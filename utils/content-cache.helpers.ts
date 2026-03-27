import { dbService } from '@/services/database.service'
import { logger } from '@/utils/logger'

/**
 * Content Cache Helpers
 * Helpers để thao tác với SQLite database cache cho nội dung đã xử lý bởi AI
 */

/**
 * Xóa tất cả cache của một cuốn sách
 */
export const clearBookCache = async (bookId: string): Promise<void> => {
  logger.info('ContentCache', `Clearing cache for book: ${bookId}`)

  try {
    await dbService.clearBookCache(bookId)
    logger.info('ContentCache', `Cache cleared for book: ${bookId}`)
  } catch (error) {
    logger.error(
      'ContentCache',
      `Error clearing cache for book ${bookId}`,
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
  logger.info(
    'ContentCache',
    `Clearing cache for book ${bookId}, chapter ${chapterNumber}`,
  )

  try {
    await dbService.deleteProcessedChapter(bookId, chapterNumber)
    logger.info('ContentCache', 'Cache cleared for chapter')
  } catch (error) {
    logger.error('ContentCache', 'Error clearing chapter cache', error)
    throw error
  }
}

/**
 * Xóa toàn bộ cache - sử dụng cẩn thận
 */
export const clearAllCache = async (): Promise<void> => {
  logger.info('ContentCache', 'Clearing ALL cache')

  try {
    await dbService.clearAllCache()
    logger.info('ContentCache', 'All cache cleared')
  } catch (error) {
    logger.error('ContentCache', 'Error clearing all cache', error)
    throw error
  }
}
