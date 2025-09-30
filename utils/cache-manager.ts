import { File, Paths } from 'expo-file-system'
import {
  clearBookSummaryCache,
  clearSummaryCache,
  deleteCachedSummary,
  getSummaryCountForBook,
} from './summary-cache'
import { CACHE_DIRECTORY } from './tts-cache'

const cacheDirectoryExists = () => {
  const { exists, isDirectory } = Paths.info(CACHE_DIRECTORY.uri)
  return exists && isDirectory === true
}

/**
 * Clears all cache for a specific book (both summary and TTS)
 */
export const clearBookCache = async (bookId: string): Promise<void> => {
  console.log(`🗑️ [Cache Manager] Clearing all cache for book: ${bookId}`)

  try {
    // 2. Clear summary cache for the book
    clearBookSummaryCache(bookId)

    // 3. Clear TTS cache files for the book
    if (cacheDirectoryExists()) {
      const files = CACHE_DIRECTORY.list().filter((entry): entry is File => entry instanceof File)

      // Filter files that belong to this book (format: bookId_chapter_index.mp3)
      const bookFiles = files.filter(
        (file) => file.name.startsWith(`${bookId}_`) && file.name.endsWith('.mp3'),
      )

      console.log(`🗑️ [Cache Manager] Found ${bookFiles.length} TTS files for book ${bookId}`)

      // Delete all TTS files for this book
      for (const file of bookFiles) {
        try {
          file.delete()
          console.log(`🗑️ [Cache Manager] Deleted TTS file: ${file.name}`)
        } catch (error) {
          console.error(`🗑️ [Cache Manager] Error deleting file ${file.name}:`, error)
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
    if (cacheDirectoryExists()) {
      const files = CACHE_DIRECTORY.list().filter((entry): entry is File => entry instanceof File)

      // Filter files that belong to this chapter (format: bookId_chapter_index.mp3)
      const chapterFiles = files.filter(
        (file) => file.name.startsWith(`${bookId}_${chapterNumber}_`) && file.name.endsWith('.mp3'),
      )

      console.log(`🗑️ [Cache Manager] Found ${chapterFiles.length} TTS files for chapter`)

      // Delete all TTS files for this chapter
      for (const file of chapterFiles) {
        try {
          file.delete()
          console.log(`🗑️ [Cache Manager] Deleted TTS file: ${file.name}`)
        } catch (error) {
          console.error(`🗑️ [Cache Manager] Error deleting file ${file.name}:`, error)
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
export const getBookCacheStats = async (
  bookId: string,
): Promise<{
  totalTTSFiles: number
  totalTTSSize: number
  summariesCount: number
}> => {
  try {
    let totalTTSFiles = 0
    let totalTTSSize = 0
    let summariesCount = 0

    // Count TTS files and calculate size
    if (cacheDirectoryExists()) {
      const files = CACHE_DIRECTORY.list().filter((entry): entry is File => entry instanceof File)
      const bookFiles = files.filter(
        (file) => file.name.startsWith(`${bookId}_`) && file.name.endsWith('.mp3'),
      )

      totalTTSFiles = bookFiles.length

      for (const file of bookFiles) {
        try {
          const fileInfo = file.info()
          if (fileInfo.exists && fileInfo.size) {
            totalTTSSize += fileInfo.size
          }
        } catch (error) {
          console.error(`Error getting file size for ${file.name}:`, error)
        }
      }
    }

    // Count summaries for a book
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
    if (cacheDirectoryExists()) {
      CACHE_DIRECTORY.delete()
    }

    CACHE_DIRECTORY.create({ idempotent: true, intermediates: true })

    // Clear summary cache
    clearSummaryCache()

    console.log('🗑️ [Cache Manager] All cache cleared')
  } catch (error) {
    console.error('🗑️ [Cache Manager] Error clearing all cache:', error)
    throw error
  }
}
