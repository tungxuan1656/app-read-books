import * as FileSystem from 'expo-file-system'
import { CACHE_FOLDER } from './tts-cache'
import { 
  getCachedSummary, 
  deleteCachedSummary, 
  getSummaryCountForBook,
  clearBookSummaryCache,
  clearSummaryCache
} from './summary-cache'

/**
 * Clears all cache for a specific book (both summary and TTS)
 */
export const clearBookCache = async (bookId: string): Promise<void> => {
  console.log(`🗑️ [Cache Manager] Clearing all cache for book: ${bookId}`)
  
  try {
    // 1. Clear summary cache for the book
    clearBookSummaryCache(bookId)
    
    // 2. Clear TTS cache files for the book
    const cacheDir = await FileSystem.getInfoAsync(CACHE_FOLDER)
    if (cacheDir.exists && cacheDir.isDirectory) {
      const files = await FileSystem.readDirectoryAsync(CACHE_FOLDER)
      
      // Filter files that belong to this book (format: bookId_chapter_index.mp3)
      const bookFiles = files.filter(file => file.startsWith(`${bookId}_`) && file.endsWith('.mp3'))
      
      console.log(`🗑️ [Cache Manager] Found ${bookFiles.length} TTS files for book ${bookId}`)
      
      // Delete all TTS files for this book
      for (const file of bookFiles) {
        try {
          await FileSystem.deleteAsync(`${CACHE_FOLDER}${file}`)
          console.log(`🗑️ [Cache Manager] Deleted TTS file: ${file}`)
        } catch (error) {
          console.error(`🗑️ [Cache Manager] Error deleting file ${file}:`, error)
        }
      }
    }
    
    console.log(`🗑️ [Cache Manager] Cache cleared for book: ${bookId}`)
  } catch (error) {
    console.error(`🗑️ [Cache Manager] Error clearing cache for book ${bookId}:`, error)
    throw error
  }
}

/**
 * Clears cache for a specific chapter (both summary and TTS)
 */
export const clearChapterCache = async (bookId: string, chapterNumber: number): Promise<void> => {
  console.log(`🗑️ [Cache Manager] Clearing cache for book ${bookId}, chapter ${chapterNumber}`)
  
  try {
    // 1. Clear summary cache for the chapter
    deleteCachedSummary(bookId, chapterNumber)
    
    // 2. Clear TTS cache files for the chapter
    const cacheDir = await FileSystem.getInfoAsync(CACHE_FOLDER)
    if (cacheDir.exists && cacheDir.isDirectory) {
      const files = await FileSystem.readDirectoryAsync(CACHE_FOLDER)
      
      // Filter files that belong to this chapter (format: bookId_chapter_index.mp3)
      const chapterFiles = files.filter(file => 
        file.startsWith(`${bookId}_${chapterNumber}_`) && file.endsWith('.mp3')
      )
      
      console.log(`🗑️ [Cache Manager] Found ${chapterFiles.length} TTS files for chapter`)
      
      // Delete all TTS files for this chapter
      for (const file of chapterFiles) {
        try {
          await FileSystem.deleteAsync(`${CACHE_FOLDER}${file}`)
          console.log(`🗑️ [Cache Manager] Deleted TTS file: ${file}`)
        } catch (error) {
          console.error(`🗑️ [Cache Manager] Error deleting file ${file}:`, error)
        }
      }
    }
    
    console.log(`🗑️ [Cache Manager] Cache cleared for chapter`)
  } catch (error) {
    console.error(`🗑️ [Cache Manager] Error clearing chapter cache:`, error)
    throw error
  }
}

/**
 * Gets cache statistics for a book
 */
export const getBookCacheStats = async (bookId: string): Promise<{
  totalTTSFiles: number
  totalTTSSize: number
  summariesCount: number
}> => {
  try {
    let totalTTSFiles = 0
    let totalTTSSize = 0
    let summariesCount = 0
    
    // Count TTS files and calculate size
    const cacheDir = await FileSystem.getInfoAsync(CACHE_FOLDER)
    if (cacheDir.exists && cacheDir.isDirectory) {
      const files = await FileSystem.readDirectoryAsync(CACHE_FOLDER)
      const bookFiles = files.filter(file => file.startsWith(`${bookId}_`) && file.endsWith('.mp3'))
      
      totalTTSFiles = bookFiles.length
      
      for (const file of bookFiles) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(`${CACHE_FOLDER}${file}`)
          if (fileInfo.exists && fileInfo.size) {
            totalTTSSize += fileInfo.size
          }
        } catch (error) {
          console.error(`Error getting file size for ${file}:`, error)
        }
      }
    }
    
    // Note: Count summaries for a book
    summariesCount = getSummaryCountForBook(bookId)
    
    return {
      totalTTSFiles,
      totalTTSSize,
      summariesCount,
    }
  } catch (error) {
    console.error(`Error getting cache stats for book ${bookId}:`, error)
    return {
      totalTTSFiles: 0,
      totalTTSSize: 0,
      summariesCount: 0,
    }
  }
}

/**
 * Clears all cache (both summary and TTS) - use with caution
 */
export const clearAllCache = async (): Promise<void> => {
  console.log('🗑️ [Cache Manager] Clearing ALL cache')
  
  try {
    // Clear TTS cache folder
    const cacheDir = await FileSystem.getInfoAsync(CACHE_FOLDER)
    if (cacheDir.exists) {
      await FileSystem.deleteAsync(CACHE_FOLDER, { idempotent: true })
      // Recreate the folder
      await FileSystem.makeDirectoryAsync(CACHE_FOLDER, { intermediates: true })
    }
    
    // Clear summary cache
    clearSummaryCache()
    
    console.log('🗑️ [Cache Manager] All cache cleared')
  } catch (error) {
    console.error('🗑️ [Cache Manager] Error clearing all cache:', error)
    throw error
  }
}
