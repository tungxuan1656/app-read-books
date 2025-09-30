import { File } from 'expo-file-system'
import { DeviceEventEmitter } from 'react-native'
import { preprocessSentence } from '../utils/string-helpers'
import { CACHE_DIRECTORY } from '../utils/tts-cache'

// Global variable to track cancellation
let isCancelled = false

// Function to stop TTS conversion
export const stopConvertTTSCapcut = () => {
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
  audioTaskId: string,
  voice: string,
): Promise<string | null> => {
  // Check if operation was cancelled
  if (isCancelled) {
    console.log('🎵 [TTS] Operation cancelled during audio generation')
    return null
  }
  const fileName = `${audioTaskId}.mp3`
  const cacheFile = new File(CACHE_DIRECTORY, fileName)
  const newCacheFilePath = cacheFile.uri

  if (cacheFile.exists) {
    console.log(`🎵 [TTS] Using cached audio: ${fileName}`)
    return newCacheFilePath
  }

  // 3. Generate new audio if not in cache
  console.log(`🎵 [TTS] Generating audio for: ${fileName}`)
  const audioData = await generateAudioFromWebSocket(sentence, voice)

  if (isCancelled) {
    console.log('🎵 [TTS] Operation cancelled after audio generation')
    return null
  }

  if (!audioData || audioData.length === 0) {
    console.error(`Failed to generate audio for: ${sentence.substring(0, 50)}...`)
    return null
  }

  try {
    cacheFile.create({ intermediates: true, overwrite: true })
    cacheFile.write(audioData)

    console.log(`🎵 [TTS] Audio saved: ${fileName}`)
    return newCacheFilePath
  } catch (error) {
    console.error(`Failed to write audio file ${newCacheFilePath}:`, error)
    return null
  }
}

/**
 * Converts an array of sentences to speech, returning an array of audio file paths.
 * It uses a cache to avoid re-generating audio for the same sentence.
 * The output files are named based on book ID, chapter, and sentence index.
 */
export const convertTTSCapcut = async (
  sentences: string[],
  taskId: string = 'tts_default',
  voice: string = 'BV421_vivn_streaming',
): Promise<string[]> => {
  console.log(`🎤 Starting TTS conversion for ${sentences.length} sentences.`)
  resetTTSCancellation()

  const finalAudioPaths: string[] = []
  const maxRetries = 2

  for (let i = 0; i < sentences.length; i++) {
    if (isCancelled) {
      console.log('🎵 [TTS] Conversion cancelled by user')
      return []
    }
    const sentence = sentences[i]
    let success = false
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const cachedAudioPath = await _getOrGenerateAudioFile(sentence, `${taskId}_${i}`, voice)
        if (cachedAudioPath) {
          DeviceEventEmitter.emit('tts_audio_ready', {
            filePath: cachedAudioPath,
            audioTaskId: `${taskId}_${i}`,
            index: i,
            isFromCache: false,
          })

          finalAudioPaths.push(cachedAudioPath)
          success = true
          break
        }
      } catch (error) {
        console.error(`Error processing sentence ${i} (attempt ${attempt}):`, error)
      }

      if (!success && attempt < maxRetries) {
        console.log(`Retrying sentence ${i} (attempt ${attempt + 1}/${maxRetries})...`)
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait before retrying
      }
    }
  }

  console.log(`🎤 TTS conversion finished. ${finalAudioPaths.length} files created.`)
  return finalAudioPaths
}

export { splitContentToParagraph } from '../utils/string-helpers'
export { getTTSCacheStats, initTTSCache } from '../utils/tts-cache'
