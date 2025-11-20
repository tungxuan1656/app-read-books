import { Directory, Paths } from 'expo-file-system'

const CACHE_DIRECTORY = new Directory(Paths.document, 'tts_audio')

/**
 * Initialize TTS cache when app starts
 * This should be called in your App.tsx or _layout.tsx
 */
export const initializeTTSCache = async () => {
  try {
    CACHE_DIRECTORY.create({ idempotent: true, intermediates: true })
    console.log('✅ TTS cache directory initialized')
  } catch (error) {
    console.error('Error initializing TTS cache:', error)
  }
}

/**
 * Get TTS cache information for debugging
 */
export const logTTSCacheInfo = async () => {
  console.log('📊 TTS Cache directory:', CACHE_DIRECTORY.uri)
}
