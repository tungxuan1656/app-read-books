import { initTTSCache, getTTSCacheStats } from '../services/convert-tts'

/**
 * Initialize TTS cache when app starts
 * This should be called in your App.tsx or _layout.tsx
 */
export const initializeTTSCache = async () => {
  console.log('🔄 Initializing TTS cache...')
  await initTTSCache()
  console.log('✅ TTS cache initialized')
}

/**
 * Get TTS cache information for debugging
 */
export const logTTSCacheInfo = async () => {
  const stats = await getTTSCacheStats()
  console.log('📊 TTS Cache Stats:', {
    totalFiles: stats.totalFiles,
    totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2),
    cacheKeys: stats.cacheKeys
  })
}

// Export cache functions for external use
export { initTTSCache, getTTSCacheStats } from '../services/convert-tts'
