import { dbService } from '@/services/database.service'

/**
 * Cache Manager - chỉ quản lý cache cho Gemini (processed chapters)
 * Không liên quan đến TTS
 */

/**
 * Clears all processed chapters cache for a specific book
 */
export const clearBookCache = async (bookId: string): Promise<void> => {
  console.log(`🗑️ [Cache Manager] Clearing cache for book: ${bookId}`)

  try {
    await dbService.clearBookCache(bookId)
    console.log(`✅ [Cache Manager] Cache cleared for book: ${bookId}`)
  } catch (error) {
    console.error(`❌ [Cache Manager] Error clearing cache for book ${bookId}:`, error)
    throw error
  }
}

/**
 * Clears cache for a specific chapter
 */
export const clearChapterCache = async (bookId: string, chapterNumber: number): Promise<void> => {
  console.log(`🗑️ [Cache Manager] Clearing cache for book ${bookId}, chapter ${chapterNumber}`)

  try {
    await dbService.deleteProcessedChapter(bookId, chapterNumber)
    console.log(`✅ [Cache Manager] Cache cleared for chapter`)
  } catch (error) {
    console.error(`❌ [Cache Manager] Error clearing chapter cache:`, error)
    throw error
  }
}

/**
 * Gets cache statistics for a book (Gemini processed chapters only)
 */
export const getBookCacheStats = async (
  bookId: string,
): Promise<{
  translateCount: number
  summaryCount: number
}> => {
  try {
    const processedChapters = await dbService.getProcessedChaptersForBook(bookId)
    
    const translateCount = processedChapters.filter(c => c.mode === 'translate').length
    const summaryCount = processedChapters.filter(c => c.mode === 'summary').length

    return {
      translateCount,
      summaryCount,
    }
  } catch (error) {
    console.error(`❌ [Cache Manager] Error getting cache stats for book ${bookId}:`, error)
    return {
      translateCount: 0,
      summaryCount: 0,
    }
  }
}

/**
 * Clears all Gemini cache (processed chapters) - use with caution
 */
export const clearAllCache = async (): Promise<void> => {
  console.log('🗑️ [Cache Manager] Clearing ALL Gemini cache')

  try {
    await dbService.clearAllCache()
    console.log('✅ [Cache Manager] All Gemini cache cleared')
  } catch (error) {
    console.error('❌ [Cache Manager] Error clearing all cache:', error)
    throw error
  }
}
