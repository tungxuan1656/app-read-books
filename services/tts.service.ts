import { Directory, File, Paths } from 'expo-file-system'
import { DeviceEventEmitter } from 'react-native'
import { preprocessSentence } from '../utils/string.helpers'
import useAppStore from '@/controllers/store'

const CACHE_DIRECTORY = new Directory(Paths.document, 'tts_audio')

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
  const token = useAppStore.getState().settings.CAPCUT_TOKEN

  if (!token) {
    throw new Error(
      'Capcut token chưa được cấu hình. Vui lòng vào Settings để thiết lập token TTS.',
    )
  }

  return {
    appkey: 'ddjeqjLGMn',
    event: 'StartTask',
    namespace: 'TTS',
    payload: `{"audio_config":{"bit_rate":128000,"format":"mp3","sample_rate":24000},"speaker":"${voice}","text":"${preprocessSentence(
      sentence,
    )}"}`,
    token: token,
    version: 'sdk_v1',
  }
}

function getCapcutWebSocketUrl(): string {
  const customWsUrl = useAppStore.getState().settings.CAPCUT_WS_URL
  
  // Sử dụng URL custom nếu có, không thì dùng default
  if (customWsUrl && customWsUrl.trim()) {
    return customWsUrl.trim()
  }
  
  // Default WebSocket URL
  return 'wss://sami-normal-sg.capcutapi.com/internal/api/v1/ws?device_id=7486429558272460289&iid=7486431924195657473&app_id=359289&region=VN&update_version_code=5.7.1.2101&version_code=5.7.1&appKey=ddjeqjLGMn&device_type=macos&device_platform=macos'
}

/**
 * Generates audio for a single sentence using Capcut's WebSocket service.
 * @returns The raw Uint8Array of the audio data.
 */
const generateAudioFromWebSocket = (
  sentence: string,
  voice: string,
): Promise<Uint8Array | null> => {
  return new Promise((resolve, reject) => {
    let ws: WebSocket | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let isCompleted = false

    const cleanup = () => {
      isCompleted = true
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      if (ws) {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close()
        }
        ws = null
      }
    }

    const closeConnection = (data: Uint8Array | null = null) => {
      if (isCompleted) return
      cleanup()
      resolve(data)
    }

    const rejectConnection = (error: Error) => {
      if (isCompleted) return
      cleanup()
      reject(error)
    }

    try {
      const wsUrl = getCapcutWebSocketUrl()
      ws = new WebSocket(wsUrl)
      const audioChunks: Uint8Array[] = []

      ws.onopen = () => {
        if (isCompleted) return
        try {
          ws!.send(JSON.stringify(createCapcutMessage(sentence, voice)))
        } catch (error) {
          console.error('Error sending message to WebSocket:', error)
          rejectConnection(new Error('Không thể gửi yêu cầu TTS'))
        }
      }

      ws.onmessage = (event) => {
        if (isCompleted) return
        try {
          // JSON messages are for control, binary data is audio
          if (typeof event.data === 'string') {
            try {
              const message = JSON.parse(event.data)
              if (message.event === 'TaskFailed') {
                console.error(`TTS task failed for: ${sentence.substring(0, 30)}...`)
                rejectConnection(new Error('Capcut TTS task failed'))
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
              if (!isCompleted) {
                audioChunks.push(new Uint8Array(reader.result as ArrayBuffer))
              }
            }
            reader.onerror = () => {
              rejectConnection(new Error('Không thể đọc audio data'))
            }
            reader.readAsArrayBuffer(event.data)
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error)
          rejectConnection(error instanceof Error ? error : new Error('WebSocket message error'))
        }
      }

      ws.onerror = (error) => {
        console.error('TTS WebSocket error:', error)
        rejectConnection(new Error('Lỗi kết nối WebSocket. Vui lòng kiểm tra token và URL.'))
      }

      ws.onclose = () => {
        if (!isCompleted) {
          console.log('WebSocket closed before completion')
          rejectConnection(new Error('WebSocket đóng kết nối bất thường'))
        }
      }

      // Timeout to prevent hanging connections
      timeoutId = setTimeout(() => {
        if (!isCompleted) {
          console.error('TTS WebSocket connection timed out.')
          rejectConnection(new Error('Kết nối WebSocket timeout (20s)'))
        }
      }, 20000) // 20-second timeout
    } catch (error) {
      console.error('Error initializing WebSocket:', error)
      rejectConnection(error instanceof Error ? error : new Error('WebSocket initialization error'))
    }
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
  cacheDir: string = CACHE_DIRECTORY.uri,
): Promise<string | null> => {
  // Check if operation was cancelled
  if (isCancelled) {
    console.log('🎵 [TTS] Operation cancelled during audio generation')
    return null
  }
  const fileName = `${audioTaskId}.mp3`
  const cacheFile = new File(cacheDir, fileName)
  const newCacheFilePath = cacheFile.uri

  if (cacheFile.exists) {
    console.log(`🎵 [TTS] Using cached audio: ${fileName}`)
    return newCacheFilePath
  }

  // 3. Generate new audio if not in cache
  console.log(`🎵 [TTS] Generating audio for: ${fileName}`)
  
  try {
    const audioData = await generateAudioFromWebSocket(sentence, voice)

    if (isCancelled) {
      console.log('🎵 [TTS] Operation cancelled after audio generation')
      return null
    }

    if (!audioData || audioData.length === 0) {
      console.error(`Failed to generate audio for: ${sentence.substring(0, 50)}...`)
      throw new Error('Không nhận được dữ liệu audio từ Capcut')
    }

    cacheFile.create({ intermediates: true, overwrite: true })
    cacheFile.write(audioData)

    console.log(`🎵 [TTS] Audio saved: ${fileName}`)
    return newCacheFilePath
  } catch (error) {
    console.error(`Error generating audio for sentence: ${sentence.substring(0, 50)}...`, error)
    throw error
  }
}

// Function to clear TTS cache folder
export const clearTTSFolder = async () => {
  try {
    if (CACHE_DIRECTORY.exists) {
      await CACHE_DIRECTORY.delete()
      await CACHE_DIRECTORY.create()
      console.log('🧹 [TTS] Cache folder cleared')
    } else {
      await CACHE_DIRECTORY.create()
    }
  } catch (error) {
    console.error('❌ [TTS] Error clearing cache folder:', error)
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
  cacheDir?: string,
  voice: string = 'BV421_vivn_streaming',
  onAudioReady?: (filePath: string, index: number) => void,
): Promise<string[]> => {
  console.log(`🎤 Starting TTS conversion for ${sentences.length} sentences.`)
  resetTTSCancellation()

  const finalAudioPaths: string[] = []
  const maxRetries = 2
  const targetDir = cacheDir || CACHE_DIRECTORY.uri

  for (let i = 0; i < sentences.length; i++) {
    if (isCancelled) {
      console.log('🎵 [TTS] Conversion cancelled by user')
      return []
    }
    const sentence = sentences[i]
    let success = false
    let isCriticalError = false
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const cachedAudioPath = await _getOrGenerateAudioFile(sentence, `${taskId}_${i}`, voice, targetDir)
        if (cachedAudioPath) {
          DeviceEventEmitter.emit('tts_audio_ready', {
            filePath: cachedAudioPath,
            audioTaskId: `${taskId}_${i}`,
            index: i,
            isFromCache: false,
          })

          if (onAudioReady) {
            onAudioReady(cachedAudioPath, i)
          }

          finalAudioPaths.push(cachedAudioPath)
          success = true
          break
        }
      } catch (error) {
        console.error(`Error processing sentence ${i} (attempt ${attempt}):`, error)
        
        // Kiểm tra lỗi critical (token invalid, WS URL invalid)
        if (error instanceof Error) {
          if (error.message.includes('token chưa được cấu hình') || 
              error.message.includes('Lỗi kết nối WebSocket')) {
            isCriticalError = true
            console.error('🎵 [TTS] Critical error detected, stopping all tasks:', error.message)
            break
          }
        }
      }

      if (!success && !isCriticalError && attempt < maxRetries) {
        console.log(`Retrying sentence ${i} (attempt ${attempt + 1}/${maxRetries})...`)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
    
    // Dừng ngay khi gặp lỗi critical
    if (isCriticalError) {
      console.log('🎵 [TTS] Stopping conversion due to critical error')
      isCancelled = true
      return []
    }
  }

  console.log(`🎤 TTS conversion finished. ${finalAudioPaths.length} files created.`)
  return finalAudioPaths
}

export { splitContentToParagraph } from '../utils/string.helpers'
