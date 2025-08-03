import * as FileSystem from 'expo-file-system'
import { MMKV } from 'react-native-mmkv'

// Cache storage instance
const ttsCache = new MMKV({
  id: 'tts-cache',
  encryptionKey: 'tts-audio-files',
})

// Cache folder path
const CACHE_FOLDER = `${FileSystem.cacheDirectory}/tts_audio/`

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

// Get cached audio file path
const getCachedAudioPath = (text: string): string | null => {
  const cacheKey = `audio_${Buffer.from(text).toString('base64').substring(0, 32)}`
  return ttsCache.getString(cacheKey) || null
}

// Set cached audio file path
const setCachedAudioPath = (text: string, filePath: string): void => {
  const cacheKey = `audio_${Buffer.from(text).toString('base64').substring(0, 32)}`
  ttsCache.set(cacheKey, filePath)
}

// Generate cache file path
const generateCacheFilePath = (text: string): string => {
  const hash = Buffer.from(text)
    .toString('base64')
    .substring(0, 16)
    .replace(/[^a-zA-Z0-9]/g, '')
  return `${CACHE_FOLDER}${hash}_${Date.now()}.ogg`
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
    payload: `{"audio_config":{"bit_rate":64000,"format":"mp3","sample_rate":24000},"speaker":"${
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
    // Check if we already have this audio cached
    const cachedPath = getCachedAudioPath(sentence)
    if (cachedPath) {
      FileSystem.getInfoAsync(cachedPath)
        .then((info) => {
          if (info.exists) {
            // Copy from cache to output path
            FileSystem.copyAsync({ from: cachedPath, to: outputFilePath })
              .then(() => resolve(true))
              .catch(() => {
                // If copy fails, remove from cache and proceed with generation
                const cacheKey = `audio_${Buffer.from(sentence)
                  .toString('base64')
                  .substring(0, 32)}`
                ttsCache.delete(cacheKey)
                generateNewAudio()
              })
            return
          } else {
            // Cache entry exists but file doesn't, remove from cache
            const cacheKey = `audio_${Buffer.from(sentence).toString('base64').substring(0, 32)}`
            ttsCache.delete(cacheKey)
            generateNewAudio()
          }
        })
        .catch(() => generateNewAudio())
    } else {
      generateNewAudio()
    }

    function generateNewAudio() {
      const wsUrl =
        'wss://sami-normal-sg.capcutapi.com/internal/api/v1/ws?device_id=7486429558272460289&iid=7486431924195657473&app_id=359289&region=VN&update_version_code=5.7.1.2101&version_code=5.7.1&appKey=ddjeqjLGMn&device_type=macos&device_platform=macos'

      const ws = new WebSocket(wsUrl)
      let audioData: Uint8Array[] = []

      ws.onopen = () => {
        ws.send(JSON.stringify(createCapcutMessage(sentence, options)))
      }

      ws.onmessage = async (event) => {
        try {
          // Try to parse as JSON first (for control messages)
          const dataStr = typeof event.data === 'string' ? event.data : event.data.toString()
          const jsonData = JSON.parse(dataStr)

          if (jsonData.event === 'TaskFailed') {
            console.log('ERROR: ', sentence)
            ws.close()
            resolve(false)
            return
          }

          if (jsonData.event === 'TaskEnd') {
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

                // Generate cache file path and save to cache first
                const cacheFilePath = generateCacheFilePath(sentence)
                await FileSystem.writeAsStringAsync(
                  cacheFilePath,
                  Array.from(combinedData)
                    .map((byte) => String.fromCharCode(byte))
                    .join(''),
                  { encoding: FileSystem.EncodingType.UTF8 },
                )

                // Copy to output path
                await FileSystem.copyAsync({ from: cacheFilePath, to: outputFilePath })

                // Save cache mapping
                setCachedAudioPath(sentence, cacheFilePath)
              }
            } catch (writeError) {
              console.error('Error writing file:', writeError)
            }

            ws.close()
            resolve(true)
            return
          }
        } catch (error) {
          // If not JSON, treat as binary audio data
          if (event.data instanceof ArrayBuffer) {
            audioData.push(new Uint8Array(event.data))
          } else if (typeof event.data === 'string') {
            // Convert string to Uint8Array if needed
            const encoder = new TextEncoder()
            audioData.push(encoder.encode(event.data))
          }
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        ws.close()
        resolve(false)
      }

      ws.onclose = () => {
        resolve(true)
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
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
  outputFolder: string,
  options: { voice: string } = { voice: 'BV421_vivn_streaming' },
): Promise<boolean> => {
  // Ensure output folder exists
  try {
    const folderInfo = await FileSystem.getInfoAsync(outputFolder)
    if (!folderInfo.exists) {
      await FileSystem.makeDirectoryAsync(outputFolder, { intermediates: true })
    }
  } catch (error) {
    console.error('Error creating output folder:', error)
    return false
  }

  for (let index = 0; index < sentences.length; index++) {
    const sentence = sentences[index]
    const outputFilePath = `${outputFolder}/audio_${index.toString().padStart(3, '0')}.mp3`

    console.log(`${index + 1}/${sentences.length}: ${sentence}`)

    let res = false
    let retryCount = 0
    const maxRetries = 3

    while (!res && retryCount < maxRetries) {
      res = await convertTTSCapcutSentence(sentence, outputFilePath, options)
      if (!res) {
        retryCount++
        console.log(`RETRY ${retryCount}/${maxRetries}: ${sentence}`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    if (!res) {
      console.error(`Failed to convert sentence after ${maxRetries} retries: ${sentence}`)
      return false
    }
  }

  return true
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
        const cacheKey = `audio_${Buffer.from(text).toString('base64').substring(0, 32)}`
        ttsCache.delete(cacheKey)
      }
    }

    const sentences = splitContentToParagraph(text)
    if (sentences.length === 0) return null

    // Create output file in cache
    const outputFilePath = generateCacheFilePath(text)

    const success = await convertTTSCapcut([text], CACHE_FOLDER, { voice: 'BV421_vivn_streaming' })
    if (success) {
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

  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line)
  const paragraphs: string[] = []
  let currentParagraph = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip empty lines
    if (!line) continue

    // Skip the first line
    if (i === 0) continue

    // If adding this line would make the paragraph exceed 1000 chars
    // and we already have some content, start a new paragraph
    if (currentParagraph.length >= 1000) {
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
    paragraphs.push(currentParagraph)
  }

  return paragraphs
}
