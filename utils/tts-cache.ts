import * as FileSystem from 'expo-file-system'
import { MMKV } from 'react-native-mmkv'

// --- Configuration ---
export const CACHE_FOLDER = `${FileSystem.documentDirectory}tts_audio/`
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
    await FileSystem.makeDirectoryAsync(CACHE_FOLDER, { intermediates: true })
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
    const files = await FileSystem.readDirectoryAsync(CACHE_FOLDER)
    let totalSize = 0
    for (const file of files) {
      const info = await FileSystem.getInfoAsync(`${CACHE_FOLDER}${file}`)
      if (info.exists && info.size) {
        totalSize += info.size
      }
    }
    return {
      totalFiles: files.length,
      totalSize,
      cacheKeys: ttsCache.getAllKeys().length,
    }
  } catch (error: unknown) {
    // If cache folder doesn't exist, return zero stats.
    // We perform a type check to safely access the 'code' property.
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: unknown }).code === 'ERR_FILE_NOT_FOUND'
    ) {
      return { totalFiles: 0, totalSize: 0, cacheKeys: 0 }
    }
    console.error('Error getting cache stats:', error)
    return { totalFiles: 0, totalSize: 0, cacheKeys: 0 }
  }
}
