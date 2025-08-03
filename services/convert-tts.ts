import * as FileSystem from 'expo-file-system'
import { MMKV } from 'react-native-mmkv'

// Cache storage instance
const ttsCache = new MMKV({
  id: 'tts-cache',
  encryptionKey: 'tts-audio-files',
})

// Cache folder path
const CACHE_FOLDER = `${FileSystem.cacheDirectory}tts_audio/`

// Initialize cache - call this when app starts
export const initTTSCache = async () => {
  try {
    // Clear cache folder
    const folderInfo = await FileSystem.getInfoAsync(CACHE_FOLDER)
    if (folderInfo.exists) {
      await FileSystem.deleteAsync(CACHE_FOLDER, { idempotent: true })
    }

    // Clear MMKV cache
    ttsCache.clearAll()

    // Recreate cache folder
    await FileSystem.makeDirectoryAsync(CACHE_FOLDER, { intermediates: true })

    console.log('TTS Cache initialized and reset')
  } catch (error) {
    console.error('Error initializing TTS cache:', error)
  }
}

// Simple hash function to create cache keys
const createSimpleHash = (text: string): string => {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

// Get cached audio file path
const getCachedAudioPath = (text: string): string | null => {
  const cacheKey = `audio_${createSimpleHash(text)}`
  return ttsCache.getString(cacheKey) || null
}

// Set cached audio file path
const setCachedAudioPath = (text: string, filePath: string): void => {
  const cacheKey = `audio_${createSimpleHash(text)}`
  ttsCache.set(cacheKey, filePath)
}

// Generate cache file path
const generateCacheFilePath = (text: string): string => {
  const hash = createSimpleHash(text)
  return `${CACHE_FOLDER}${hash}_${Date.now()}.mp3`
}

// Preprocess sentence to remove special characters
const preprocessSentence = (sentence: string): string => {
  return sentence.replace(/["""\\'`\/*<>|~]/g, '')
}

// Create Capcut WebSocket message
function createCapcutMessage(sentence: string, options: { voice: string }) {
  return {
		appkey: 'ddjeqjLGMn',
		event: 'StartTask',
		namespace: 'TTS',
		payload: `{"audio_config":{"bit_rate":64000,"format":"ogg_opus","sample_rate":24000},"speaker":"${
			options.voice
		}","text":"${preprocessSentence(sentence)}"}`,
		token:
			'WTV6R2t6V3ZwNUIwQkFETutGxuveRZ9iTmOBC/a3wzMS7zzza86Ky9nIfYhyeoSiWYP1ZO04X7X1+RThg/zczU6u8ga3dTIJpduvWpCqrmr0Kv7BJf6tcGFgevJ/Jaa1slHj/l4NUJ/eCesl1dYBYQ51oKbuFnZjF7qXVWzsoz326XwRdNEmOufSHnuW+kuy+sS7K/sn3gVWsCC4XFi+FYntDxrVTYS/Pv2LtBgpgULmib5+5kMq2ZuJfCDYvq4NthciciB6KUCf1sOsu7VD/27Tquz8Q58NYALFvX85bjvxQJOz0iV3oUiip0RyqR1ltZPNI/LgN2OGCphyCgOJdlUUdgIbSJpaKL+5PMTM4yBuwCU4QPbYYzTs9x2ZA+7zt41ng+i5+EPtePyDjR4VFTz+7zglLw/E+KqN/nscyqLCyrumn4YgfQ3JYnSnz1WLE6q3aD175yweKBj9f9jyqxnLVmEYy9VjmoxuYNRgVmfT6M17bT9iL0PJTlJ6UqKHuNRT6ubv37ZSr961Gw+RJhyLUDBt8AD1B8YDdF4OImS+LgGjfujaY1agc4tfrnk4V4YcAXyTRlYwLMC9ATDp9CbiBrlMBmYm88gwGaTR9pbI2KcQ4Kg86jZYc6CxNM34sbMG/1LlmqvqLe+E3IG6ebOmyVbL+kYK70c1fT5TcmzVwX5O3JGkHHtFoeCmd4Eyyov6QsO1Jewx0gpjp05dqw==',
		version: 'sdk_v1',
	}
}

// Convert single sentence to TTS using Capcut with caching
export const convertTTSCapcutSentence = (
  sentence: string,
  outputFilePath: string,
  options: { voice: string } = { voice: 'BV421_vivn_streaming' },
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    console.log(`🎤 [convertTTSCapcutSentence] Starting conversion for: ${sentence.substring(0, 50)}...`)
    console.log(`🎤 [convertTTSCapcutSentence] Output file: ${outputFilePath}`)
    
    // Check if we already have this audio cached
    const cachedPath = getCachedAudioPath(sentence)
    if (cachedPath) {
      console.log(`🎤 [convertTTSCapcutSentence] Found cached path: ${cachedPath}`)
      FileSystem.getInfoAsync(cachedPath)
        .then((info) => {
          if (info.exists) {
            console.log(`🎤 [convertTTSCapcutSentence] Cache file exists, copying...`)
            // Copy from cache to output path
            FileSystem.copyAsync({ from: cachedPath, to: outputFilePath })
              .then(() => {
                console.log(`🎤 [convertTTSCapcutSentence] Successfully copied from cache`)
                resolve(true)
              })
              .catch(() => {
                console.log(`🎤 [convertTTSCapcutSentence] Cache copy failed, generating new audio`)
                // If copy fails, remove from cache and proceed with generation
                const cacheKey = `audio_${createSimpleHash(sentence)}`
                ttsCache.delete(cacheKey)
                generateNewAudio()
              })
            return
          } else {
            console.log(`🎤 [convertTTSCapcutSentence] Cache file doesn't exist, generating new audio`)
            // Cache entry exists but file doesn't, remove from cache
            const cacheKey = `audio_${createSimpleHash(sentence)}`
            ttsCache.delete(cacheKey)
            generateNewAudio()
          }
        })
        .catch(() => {
          console.log(`🎤 [convertTTSCapcutSentence] Error checking cache, generating new audio`)
          generateNewAudio()
        })
    } else {
      console.log(`🎤 [convertTTSCapcutSentence] No cache found, generating new audio`)
      generateNewAudio()
    }

    function generateNewAudio() {
      console.log(`🎤 [convertTTSCapcutSentence] Starting WebSocket connection for new audio generation`)
      const wsUrl =
        'wss://sami-normal-sg.capcutapi.com/internal/api/v1/ws?device_id=7486429558272460289&iid=7486431924195657473&app_id=359289&region=VN&update_version_code=5.7.1.2101&version_code=5.7.1&appKey=ddjeqjLGMn&device_type=macos&device_platform=macos'

      const ws = new WebSocket(wsUrl)
      let audioData: Uint8Array[] = []

      ws.onopen = () => {
        console.log(`🎤 [convertTTSCapcutSentence] WebSocket connected, sending message`)
        ws.send(JSON.stringify(createCapcutMessage(sentence, options)))
      }

      ws.onmessage = async (event) => {
        try {
          // Try to parse as JSON first (for control messages)
          const dataStr = typeof event.data === 'string' ? event.data : event.data.toString()
          const jsonData = JSON.parse(dataStr)

          console.log(`🎤 [convertTTSCapcutSentence] Received JSON message:`, jsonData.event)

          if (jsonData.event === 'TaskFailed') {
            console.log(`🎤 [convertTTSCapcutSentence] Task failed for: ${sentence.substring(0, 50)}...`)
            ws.close()
            resolve(false)
            return
          }

          if (jsonData.event === 'TaskEnd') {
            console.log(`🎤 [convertTTSCapcutSentence] Task completed, processing audio data (${audioData.length} chunks)`)
            // Write collected audio data to file
            try {
              if (audioData.length > 0) {
                const combinedData = new Uint8Array(
                  audioData.reduce((acc, curr) => acc + curr.length, 0),
                )
                let offset = 0
                for (const chunk of audioData) {
                  combinedData.set(chunk, offset)
                  offset += chunk.length
                }

                console.log(`🎤 [convertTTSCapcutSentence] Combined audio data size: ${combinedData.length} bytes`)

                // Generate cache file path and save to cache first
                const cacheFilePath = generateCacheFilePath(sentence)
                console.log(`🎤 [convertTTSCapcutSentence] Writing to cache: ${cacheFilePath}`)
                await FileSystem.writeAsStringAsync(
                  cacheFilePath,
                  Array.from(combinedData)
                    .map((byte) => String.fromCharCode(byte))
                    .join(''),
                  { encoding: FileSystem.EncodingType.UTF8 },
                )

                console.log(`🎤 [convertTTSCapcutSentence] Copying to output path: ${outputFilePath}`)
                // Copy to output path
                await FileSystem.copyAsync({ from: cacheFilePath, to: outputFilePath })

                console.log(`🎤 [convertTTSCapcutSentence] Saving cache mapping`)
                // Save cache mapping
                setCachedAudioPath(sentence, cacheFilePath)
                
                console.log(`🎤 [convertTTSCapcutSentence] Audio generation completed successfully`)
              } else {
                console.log(`🎤 [convertTTSCapcutSentence] No audio data received`)
              }
            } catch (writeError) {
              console.error('🎤 [convertTTSCapcutSentence] Error writing file:', writeError)
            }

            ws.close()
            resolve(true)
            return
          }
        } catch (error) {
          // If not JSON, treat as binary audio data
          if (event.data instanceof ArrayBuffer) {
            console.log(`🎤 [convertTTSCapcutSentence] Received binary audio data: ${event.data.byteLength} bytes`)
            audioData.push(new Uint8Array(event.data))
          } else if (typeof event.data === 'string') {
            console.log(`🎤 [convertTTSCapcutSentence] Received string audio data: ${event.data.length} chars`)
            // Convert string to Uint8Array if needed
            const encoder = new TextEncoder()
            audioData.push(encoder.encode(event.data))
          }
        }
      }

      ws.onerror = (error) => {
        console.error('🎤 [convertTTSCapcutSentence] WebSocket error:', error)
        ws.close()
        resolve(false)
      }

      ws.onclose = () => {
        console.log(`🎤 [convertTTSCapcutSentence] WebSocket closed`)
        resolve(true)
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          console.log(`🎤 [convertTTSCapcutSentence] WebSocket timeout (30s), closing connection`)
          ws.close()
          resolve(false)
        }
      }, 30000)
    }
  })
}

// Convert multiple sentences to TTS
export const convertTTSCapcut = async (
  sentences: string[],
  options: { voice: string } = { voice: 'BV421_vivn_streaming' },
): Promise<string[]> => {
  console.log('🔊 [convertTTSCapcut] Starting conversion with:', {
    sentencesCount: sentences.length,
    voice: options.voice,
    cacheFolder: CACHE_FOLDER
  })

  // Ensure cache folder exists
  try {
    const cacheFolderInfo = await FileSystem.getInfoAsync(CACHE_FOLDER)
    if (!cacheFolderInfo.exists) {
      console.log('🔊 [convertTTSCapcut] Creating cache folder:', CACHE_FOLDER)
      await FileSystem.makeDirectoryAsync(CACHE_FOLDER, { intermediates: true })
    } else {
      console.log('🔊 [convertTTSCapcut] Cache folder exists:', CACHE_FOLDER)
    }
  } catch (error) {
    console.error('🔊 [convertTTSCapcut] Error creating cache folder:', error)
    return []
  }

  const audioPaths: string[] = []

  for (let index = 0; index < sentences.length; index++) {
    const sentence = sentences[index]
    const outputFilePath = `${CACHE_FOLDER}audio_${index.toString().padStart(3, '0')}_${Date.now()}.mp3`

    console.log(`🔊 [convertTTSCapcut] Processing ${index + 1}/${sentences.length}: ${sentence.substring(0, 100)}...`)
    console.log(`🔊 [convertTTSCapcut] Output file path: ${outputFilePath}`)

    // Check if we have this sentence cached
    const cachedPath = getCachedAudioPath(sentence)
    if (cachedPath) {
      console.log(`🔊 [convertTTSCapcut] Found cached path: ${cachedPath}`)
      try {
        const cachedInfo = await FileSystem.getInfoAsync(cachedPath)
        if (cachedInfo.exists) {
          console.log(`🔊 [convertTTSCapcut] Using cached audio, copying to: ${outputFilePath}`)
          // Copy cached file to new output path to maintain index order
          await FileSystem.copyAsync({ from: cachedPath, to: outputFilePath })
          console.log(`🔊 [convertTTSCapcut] Successfully copied cached audio`)
          audioPaths.push(outputFilePath)
          continue
        } else {
          console.log(`🔊 [convertTTSCapcut] Cached file doesn't exist, removing from cache`)
          // Cache entry exists but file doesn't, remove from cache
          const cacheKey = `audio_${createSimpleHash(sentence)}`
          ttsCache.delete(cacheKey)
        }
      } catch (error) {
        console.error('🔊 [convertTTSCapcut] Error checking cache:', error)
      }
    } else {
      console.log(`🔊 [convertTTSCapcut] No cached audio found, generating new`)
    }

    // Generate new audio
    console.log(`🔊 [convertTTSCapcut] Generating new audio for sentence ${index + 1}`)
    let res = false
    let retryCount = 0
    const maxRetries = 3

    while (!res && retryCount < maxRetries) {
      console.log(`🔊 [convertTTSCapcut] Attempt ${retryCount + 1}/${maxRetries} for sentence ${index + 1}`)
      res = await convertTTSCapcutSentence(sentence, outputFilePath, options)
      if (!res) {
        retryCount++
        console.log(`🔊 [convertTTSCapcut] RETRY ${retryCount}/${maxRetries}: ${sentence.substring(0, 50)}...`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } else {
        console.log(`🔊 [convertTTSCapcut] Successfully generated audio for sentence ${index + 1}`)
      }
    }

    if (!res) {
      console.error(`🔊 [convertTTSCapcut] Failed to convert sentence after ${maxRetries} retries: ${sentence}`)
      console.log(`🔊 [convertTTSCapcut] Returning empty array due to failure`)
      return []
    }

    audioPaths.push(outputFilePath)
    console.log(`🔊 [convertTTSCapcut] Added to audioPaths: ${outputFilePath}`)
  }

  console.log(`🔊 [convertTTSCapcut] Conversion completed. Total audio files: ${audioPaths.length}`)
  console.log(`🔊 [convertTTSCapcut] Final audio paths:`, audioPaths)
  return audioPaths
}

// Legacy function - now uses Capcut instead of play.ht with caching
export const convertTTS = async (text: string): Promise<string | null> => {
  try {
    // Check cache first for the entire text
    const cachedPath = getCachedAudioPath(text)
    if (cachedPath) {
      const info = await FileSystem.getInfoAsync(cachedPath)
      if (info.exists) {
        return cachedPath
      } else {
        // Cache entry exists but file doesn't, remove from cache
        const cacheKey = `audio_${createSimpleHash(text)}`
        ttsCache.delete(cacheKey)
      }
    }

    const sentences = splitContentToParagraph(text)
    if (sentences.length === 0) return null

    // Use the new convertTTSCapcut function
    const audioPaths = await convertTTSCapcut([text], { voice: 'BV421_vivn_streaming' })
    if (audioPaths.length > 0) {
      const outputFilePath = audioPaths[0]
      // Cache the result
      setCachedAudioPath(text, outputFilePath)
      return outputFilePath
    }

    return null
  } catch (error) {
    console.error('Error in convertTTS:', error)
    return null
  }
}

// Get cache statistics
export const getTTSCacheStats = async (): Promise<{
  totalFiles: number
  totalSize: number
  cacheKeys: number
}> => {
  try {
    const folderInfo = await FileSystem.getInfoAsync(CACHE_FOLDER)
    if (!folderInfo.exists) {
      return { totalFiles: 0, totalSize: 0, cacheKeys: 0 }
    }

    const files = await FileSystem.readDirectoryAsync(CACHE_FOLDER)
    let totalSize = 0

    for (const file of files) {
      const fileInfo = await FileSystem.getInfoAsync(`${CACHE_FOLDER}${file}`)
      if (fileInfo.exists && fileInfo.size) {
        totalSize += fileInfo.size
      }
    }

    return {
      totalFiles: files.length,
      totalSize,
      cacheKeys: ttsCache.getAllKeys().length,
    }
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return { totalFiles: 0, totalSize: 0, cacheKeys: 0 }
  }
}

export const splitContentToParagraph = (content: string) => {
  if (!content) return []

  console.log('📝 [splitContentToParagraph] Input content:', content.substring(0, 200) + '...')

  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line)
  
  console.log('📝 [splitContentToParagraph] Lines after split and filter:', lines.length)
  lines.forEach((line, index) => {
    console.log(`📝 [splitContentToParagraph] Line ${index}: ${line.substring(0, 100)}...`)
  })

  const paragraphs: string[] = []
  let currentParagraph = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip empty lines
    if (!line) continue

    console.log(`📝 [splitContentToParagraph] Processing line ${i}: ${line.substring(0, 50)}...`)

    // If adding this line would make the paragraph exceed 1000 chars
    // and we already have some content, start a new paragraph
    if (currentParagraph.length >= 1000) {
      console.log(`📝 [splitContentToParagraph] Current paragraph exceeds 1000 chars, starting new paragraph`)
      paragraphs.push(currentParagraph)
      currentParagraph = line
    } else {
      // Add a space between lines if the current paragraph is not empty
      if (currentParagraph) {
        currentParagraph += ' ' + line
      } else {
        currentParagraph = line
      }
    }
  }

  // Add the last paragraph if it has content
  if (currentParagraph) {
    console.log(`📝 [splitContentToParagraph] Adding final paragraph: ${currentParagraph.substring(0, 100)}...`)
    paragraphs.push(currentParagraph)
  }

  console.log(`📝 [splitContentToParagraph] Final result: ${paragraphs.length} paragraphs`)
  paragraphs.forEach((paragraph, index) => {
    console.log(`📝 [splitContentToParagraph] Paragraph ${index + 1} (${paragraph.length} chars): ${paragraph.substring(0, 100)}...`)
  })

  return paragraphs
}
