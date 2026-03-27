import { dbService } from '@/services/database.service'

/**
 * Content Cache Helpers
 * Helpers để thao tác với SQLite database cache cho nội dung đã xử lý (Gemini)
 */

/**
 * Xóa tất cả cache của một cuốn sách
 */
export const clearBookCache = async (bookId: string): Promise<void> => {
  console.log(`🗑️ [Content Cache] Clearing cache for book: ${bookId}`)

  try {
    await dbService.clearBookCache(bookId)
    console.log(`✅ [Content Cache] Cache cleared for book: ${bookId}`)
  } catch (error) {
    console.error(
      `❌ [Content Cache] Error clearing cache for book ${bookId}:`,
      error,
    )
    throw error
  }
}

/**
 * Xóa cache của một chapter cụ thể
 */
export const clearChapterCache = async (
  bookId: string,
  chapterNumber: number,
): Promise<void> => {
  console.log(
    `🗑️ [Content Cache] Clearing cache for book ${bookId}, chapter ${chapterNumber}`,
  )

  try {
    await dbService.deleteProcessedChapter(bookId, chapterNumber)
    console.log(`✅ [Content Cache] Cache cleared for chapter`)
  } catch (error) {
    console.error(`❌ [Content Cache] Error clearing chapter cache:`, error)
    throw error
  }
}

/**
 * Xóa toàn bộ cache - sử dụng cẩn thận
 */
export const clearAllCache = async (): Promise<void> => {
  console.log('🗑️ [Content Cache] Clearing ALL cache')

  try {
    await dbService.clearAllCache()
    console.log('✅ [Content Cache] All cache cleared')
  } catch (error) {
    console.error('❌ [Content Cache] Error clearing all cache:', error)
    throw error
  }
}
