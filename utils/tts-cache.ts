import { Directory, File, Paths } from 'expo-file-system'
import { MMKV } from 'react-native-mmkv'

// --- Configuration ---
export const CACHE_DIRECTORY = new Directory(Paths.document, 'tts_audio')
export const CACHE_FOLDER = CACHE_DIRECTORY.uri

const ttsCache = new MMKV({
  id: 'tts-cache',
  encryptionKey: 'tts-audio-files',
})

// --- Initialization and Cache Management ---

/**
 * Initializes the TTS cache by clearing the old cache directory and MMKV store.
 * Should be called once when the application starts.
 */
export const initTTSCache = async () => {
  try {
    CACHE_DIRECTORY.create({ idempotent: true, intermediates: true })
  } catch (error) {
    console.error('Error initializing TTS cache:', error)
  }
}

/**
 * Creates a simple hash from a string for use as a cache key.
 */
export const createSimpleHash = (text: string): string => {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash &= hash // Convert to 32bit integer
  }
  return `cache_${Math.abs(hash).toString(36)}`
}

export const getCachedAudioPath = (text: string): string | null => {
  const cacheKey = createSimpleHash(text)
  const filePath = ttsCache.getString(cacheKey)
  return filePath || null
}

export const setCachedAudioPath = (text: string, filePath: string): void => {
  const cacheKey = createSimpleHash(text)
  ttsCache.set(cacheKey, filePath)
}

export const deleteCachedAudioPath = (text: string): void => {
  const cacheKey = createSimpleHash(text)
  ttsCache.delete(cacheKey)
}

/**
 * Provides statistics about the TTS cache.
 */
export const getTTSCacheStats = async (): Promise<{
  totalFiles: number
  totalSize: number // in bytes
  cacheKeys: number
}> => {
  try {
    const cacheInfo = Paths.info(CACHE_DIRECTORY.uri)
    if (!cacheInfo.exists || cacheInfo.isDirectory === false) {
      return { totalFiles: 0, totalSize: 0, cacheKeys: ttsCache.getAllKeys().length }
    }

    const files = CACHE_DIRECTORY.list().filter((entry): entry is File => entry instanceof File)
    let totalSize = 0
    for (const file of files) {
      try {
        const info = file.info()
        if (info.exists && info.size) {
          totalSize += info.size
        }
      } catch (error) {
        console.error('Error reading TTS cache file info:', error)
      }
    }
    return {
      totalFiles: files.length,
      totalSize,
      cacheKeys: ttsCache.getAllKeys().length,
    }
  } catch (error: unknown) {
    console.error('Error getting cache stats:', error)
    return { totalFiles: 0, totalSize: 0, cacheKeys: ttsCache.getAllKeys().length }
  }
}
