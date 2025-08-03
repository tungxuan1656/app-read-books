import * as FileSystem from 'expo-file-system'
import { encode } from 'base-64'
import { DeviceEventEmitter } from 'react-native'
import {
  CACHE_FOLDER,
  createSimpleHash,
  deleteCachedAudioPath,
  getCachedAudioPath,
  setCachedAudioPath,
} from '../utils/tts-cache'
import { preprocessSentence, splitContentToParagraph } from '../utils/string-helpers'

// Global variable to track cancellation
let isCancelled = false

// Function to cancel TTS conversion
export const cancelTTSConversion = () => {
  console.log('🎵 [TTS] Cancelling TTS conversion...')
  isCancelled = true
}

// Function to reset cancellation state
export const resetTTSCancellation = () => {
  isCancelled = false
}

// --- WebSocket Audio Generation ---

function createCapcutMessage(sentence: string, voice: string) {
  // The token and other parameters might need to be updated periodically.
  return {
    appkey: 'ddjeqjLGMn',
    event: 'StartTask',
    namespace: 'TTS',
    payload: `{"audio_config":{"bit_rate":128000,"format":"mp3","sample_rate":24000},"speaker":"${voice}","text":"${preprocessSentence(
      sentence,
    )}"}`,
    token:
      'WTV6R2t6V3ZwNUIwQkFETutGxuveRZ9iTmOBC/a3wzMS7zzza86Ky9nIfYhyeoSiWYP1ZO04X7X1+RThg/zczU6u8ga3dTIJpduvWpCqrmr0Kv7BJf6tcGFgevJ/Jaa1slHj/l4NUJ/eCesl1dYBYQ51oKbuFnZjF7qXVWzsoz326XwRdNEmOufSHnuW+kuy+sS7K/sn3gVWsCC4XFi+FYntDxrVTYS/Pv2LtBgpgULmib5+5kMq2ZuJfCDYvq4NthciciB6KUCf1sOsu7VD/27Tquz8Q58NYALFvX85bjvxQJOz0iV3oUiip0RyqR1ltZPNI/LgN2OGCphyCgOJdlUUdgIbSJpaKL+5PMTM4yBuwCU4QPbYYzTs9x2ZA+7zt41ng+i5+EPtePyDjR4VFTz+7zglLw/E+KqN/nscyqLCyrumn4YgfQ3JYnSnz1WLE6q3aD175yweKBj9f9jyqxnLVmEYy9VjmoxuYNRgVmfT6M17bT9iL0PJTlJ6UqKHuNRT6ubv37ZSr961Gw+RJhyLUDBt8AD1B8YDdF4OImS+LgGjfujaY1agc4tfrnk4V4YcAXyTRlYwLMC9ATDp9CbiBrlMBmYm88gwGaTR9pbI2KcQ4Kg86jZYc6CxNM34sbMG/1LlmqvqLe+E3IG6ebOmyVbL+kYK70c1fT5TcmzVwX5O3JGkHHtFoeCmd4Eyyov6QsO1Jewx0gpjp05dqw==',
    version: 'sdk_v1',
  }
}

/**
 * Generates audio for a single sentence using Capcut's WebSocket service.
 * @returns The raw Uint8Array of the audio data.
 */
const generateAudioFromWebSocket = (
  sentence: string,
  voice: string,
): Promise<Uint8Array | null> => {
  return new Promise((resolve) => {
    const wsUrl =
      'wss://sami-normal-sg.capcutapi.com/internal/api/v1/ws?device_id=7486429558272460289&iid=7486431924195657473&app_id=359289&region=VN&update_version_code=5.7.1.2101&version_code=5.7.1&appKey=ddjeqjLGMn&device_type=macos&device_platform=macos'
    const ws = new WebSocket(wsUrl)
    const audioChunks: Uint8Array[] = []

    const closeConnection = (data: Uint8Array | null = null) => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
      resolve(data)
    }

    ws.onopen = () => {
      ws.send(JSON.stringify(createCapcutMessage(sentence, voice)))
    }

    ws.onmessage = (event) => {
      // JSON messages are for control, binary data is audio
      if (typeof event.data === 'string') {
        try {
          const message = JSON.parse(event.data)
          if (message.event === 'TaskFailed') {
            console.error(`TTS task failed for: ${sentence.substring(0, 30)}...`)
            closeConnection(null)
          } else if (message.event === 'TaskEnd' || message.event === 'TaskFinished') {
            // Combine all received audio chunks
            const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0)
            const combinedData = new Uint8Array(totalLength)
            let offset = 0
            for (const chunk of audioChunks) {
              combinedData.set(chunk, offset)
              offset += chunk.length
            }
            closeConnection(combinedData)
          }
        } catch (e) {
          // Not a JSON message, ignore.
        }
      } else if (event.data instanceof ArrayBuffer) {
        audioChunks.push(new Uint8Array(event.data))
      } else if (event.data instanceof Blob) {
        // Fallback for environments where WebSocket returns Blob
        const reader = new FileReader()
        reader.onload = () => {
          audioChunks.push(new Uint8Array(reader.result as ArrayBuffer))
        }
        reader.readAsArrayBuffer(event.data)
      }
    }

    ws.onerror = (error) => {
      console.error('TTS WebSocket error:', error)
      closeConnection(null)
    }

    // Timeout to prevent hanging connections
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        console.error('TTS WebSocket connection timed out.')
        closeConnection(null)
      }
    }, 20000) // 20-second timeout
  })
}

// --- Core Conversion Functions ---

/**
 * A private helper to get audio for a sentence, either from cache or by generating it.
 * It saves the generated audio to a file named after the book ID, chapter, and sentence index.
 * @returns The path to the cached audio file, or null on failure.
 */
const _getOrGenerateAudioFile = async (
  sentence: string,
  voice: string,
  bookId: string,
  chapterNumber: number,
  sentenceIndex: number,
): Promise<string | null> => {
  // Check if operation was cancelled
  if (isCancelled) {
    console.log('🎵 [TTS] Operation cancelled during audio generation')
    return null
  }

  // 1. Create new filename format: bookId_chapter_index.mp3
  const fileName = `${bookId}_${chapterNumber}_${sentenceIndex}.mp3`
  const newCacheFilePath = `${CACHE_FOLDER}${fileName}`

  // 2. Check if file already exists
  const info = await FileSystem.getInfoAsync(newCacheFilePath)
  if (info.exists) {
    console.log(`🎵 [TTS] Using cached audio: ${fileName}`)
    // Emit event for cached file
    DeviceEventEmitter.emit('tts_audio_ready', {
      name: fileName,
      filePath: newCacheFilePath,
      sentenceIndex,
      isFromCache: true,
    })
    return newCacheFilePath
  }

  // 3. Generate new audio if not in cache
  console.log(`🎵 [TTS] Generating audio for: ${fileName}`)
  const audioData = await generateAudioFromWebSocket(sentence, voice)

  // Check cancellation again after async operation
  if (isCancelled) {
    console.log('🎵 [TTS] Operation cancelled after audio generation')
    return null
  }

  if (!audioData || audioData.length === 0) {
    console.error(`Failed to generate audio for: ${sentence.substring(0, 50)}...`)
    return null
  }

  // 4. Save to file system
  try {
    // expo-file-system requires base64 encoding for binary data.
    // We convert the Uint8Array to a binary string first.
    let binaryString = ''
    for (let i = 0; i < audioData.byteLength; i++) {
      binaryString += String.fromCharCode(audioData[i])
    }
    const base64Data = encode(binaryString)

    await FileSystem.writeAsStringAsync(newCacheFilePath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    })

    console.log(`🎵 [TTS] Audio saved: ${fileName}`)

    // Emit event when audio file is ready
    DeviceEventEmitter.emit('tts_audio_ready', {
      name: fileName,
      filePath: newCacheFilePath,
      sentenceIndex,
      isFromCache: false,
    })

    return newCacheFilePath
  } catch (error) {
    console.error(`Failed to write audio file ${newCacheFilePath}:`, error)
    return null
  }
}

/**
 * Converts a single sentence to speech and saves it to a specified file path.
 * This is a convenience wrapper around the main `convertTTSCapcut` function.
 */
export const convertTTSCapcutSentence = async (
  sentence: string,
  outputFilePath: string,
  options: {
    voice: string
    bookId: string
    chapterNumber: number
  } = {
    voice: 'BV421_vivn_streaming',
    bookId: 'unknown',
    chapterNumber: 0,
  },
): Promise<boolean> => {
  const audioPaths = await convertTTSCapcut([sentence], options)
  return audioPaths.length > 0
}

/**
 * Converts an array of sentences to speech, returning an array of audio file paths.
 * It uses a cache to avoid re-generating audio for the same sentence.
 * The output files are named based on book ID, chapter, and sentence index.
 */
export const convertTTSCapcut = async (
  sentences: string[],
  options: {
    voice: string
    bookId: string
    chapterNumber: number
  } = {
    voice: 'BV421_vivn_streaming',
    bookId: 'unknown',
    chapterNumber: 0,
  },
  outputPaths?: string[], // Optional: provide specific output paths
): Promise<string[]> => {
  console.log(`🎤 Starting TTS conversion for ${sentences.length} sentences.`)

  // Reset cancellation state at the start
  resetTTSCancellation()

  const finalAudioPaths: string[] = []
  const maxRetries = 2

  for (let i = 0; i < sentences.length; i++) {
    // Check if operation was cancelled
    if (isCancelled) {
      console.log('🎵 [TTS] Conversion cancelled by user')
      break
    }

    const sentence = sentences[i]

    let success = false
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const cachedAudioPath = await _getOrGenerateAudioFile(
          sentence,
          options.voice,
          options.bookId,
          options.chapterNumber,
          i,
        )

        if (cachedAudioPath) {
          finalAudioPaths.push(cachedAudioPath)
          success = true
          break // Success, exit retry loop
        }
      } catch (error) {
        console.error(`Error processing sentence ${i} (attempt ${attempt}):`, error)
      }

      if (!success && attempt < maxRetries) {
        console.log(`Retrying sentence ${i} (attempt ${attempt + 1}/${maxRetries})...`)
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait before retrying
      }
    }

    if (!success) {
      console.error(
        `Failed to convert sentence after ${maxRetries} attempts: ${sentence.substring(0, 50)}...`,
      )
      // Continue with next sentence instead of stopping entirely
    }
  }

  console.log(`🎤 TTS conversion finished. ${finalAudioPaths.length} files created.`)
  return finalAudioPaths
}

/**
 * Legacy function, now maps to the new Capcut implementation.
 * Converts a single block of text.
 */
export const convertTTS = async (
  text: string,
  bookId: string = 'legacy',
  chapterNumber: number = 0,
): Promise<string | null> => {
  const paragraphs = splitContentToParagraph(text)
  if (paragraphs.length === 0) return null

  // This function is designed for a single text block, so we process it as one.
  // If the text is very long, it will be sent as one large chunk to the TTS service.
  const audioPaths = await convertTTSCapcut([text], {
    voice: 'BV421_vivn_streaming',
    bookId,
    chapterNumber,
  })

  if (audioPaths.length > 0) {
    // The path is already cached by convertTTSCapcut, so we just return it.
    return audioPaths[0]
  }

  return null
}

// --- Utility Functions ---
// All utility functions have been moved to /utils/
// The following exports are kept for backward compatibility if needed,
// but they now point to the new utility files.
export { initTTSCache, getTTSCacheStats } from '../utils/tts-cache'
export { splitContentToParagraph } from '../utils/string-helpers'
