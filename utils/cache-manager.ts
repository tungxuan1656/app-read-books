import { Directory, File, Paths } from 'expo-file-system'
import { dbService } from '@/services/database-service'

const CACHE_DIRECTORY = new Directory(Paths.document, 'tts_audio')

const cacheDirectoryExists = () => {
  const { exists, isDirectory } = Paths.info(CACHE_DIRECTORY.uri)
  return exists && isDirectory === true
}

/**
 * Clears all cache for a specific book (both processed content and TTS)
 */
export const clearBookCache = async (bookId: string): Promise<void> => {
  console.log(`🗑️ [Cache Manager] Clearing all cache for book: ${bookId}`)

  try {
    // Clear database cache for the book
    await dbService.clearBookCache(bookId)

    // Clear TTS cache files for the book
    if (cacheDirectoryExists()) {
      const bookDir = new Directory(CACHE_DIRECTORY.uri, bookId)
      const bookDirInfo = Paths.info(bookDir.uri)
      
      if (bookDirInfo.exists && bookDirInfo.isDirectory) {
        bookDir.delete()
        console.log(`🗑️ [Cache Manager] Deleted TTS directory for book: ${bookId}`)
      }
    }

    console.log(`🗑️ [Cache Manager] Cache cleared for book: ${bookId}`)
  } catch (error) {
    console.error(`🗑️ [Cache Manager] Error clearing cache for book ${bookId}:`, error)
    throw error
  }
}

/**
 * Clears cache for a specific chapter (both processed content and TTS)
 */
export const clearChapterCache = async (bookId: string, chapterNumber: number): Promise<void> => {
  console.log(`🗑️ [Cache Manager] Clearing cache for book ${bookId}, chapter ${chapterNumber}`)

  try {
    // Clear database cache for the chapter
    await dbService.deleteProcessedChapter(bookId, chapterNumber)

    // Clear TTS cache files for the chapter (all modes)
    if (cacheDirectoryExists()) {
      const chapterDir = new Directory(CACHE_DIRECTORY.uri, `${bookId}/${chapterNumber}`)
      const chapterDirInfo = Paths.info(chapterDir.uri)
      
      if (chapterDirInfo.exists && chapterDirInfo.isDirectory) {
        chapterDir.delete()
        console.log(`🗑️ [Cache Manager] Deleted TTS directory for chapter ${chapterNumber}`)
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

    // Count TTS files and calculate size from book directory
    if (cacheDirectoryExists()) {
      const bookDir = new Directory(CACHE_DIRECTORY.uri, bookId)
      const bookDirInfo = Paths.info(bookDir.uri)
      
      if (bookDirInfo.exists && bookDirInfo.isDirectory) {
        const countFilesRecursively = (dir: Directory): { count: number; size: number } => {
          let count = 0
          let size = 0
          
          const entries = dir.list()
          for (const entry of entries) {
            if (entry instanceof File && entry.name.endsWith('.mp3')) {
              count++
              const fileInfo = entry.info()
              if (fileInfo.exists && fileInfo.size) {
                size += fileInfo.size
              }
            } else if (entry instanceof Directory) {
              const subResult = countFilesRecursively(entry)
              count += subResult.count
              size += subResult.size
            }
          }
          
          return { count, size }
        }
        
        const result = countFilesRecursively(bookDir)
        totalTTSFiles = result.count
        totalTTSSize = result.size
      }
    }

    // Count processed chapters from database
    const processedChapters = await dbService.getProcessedChaptersForBook(bookId)
    const summariesCount = processedChapters.filter(c => c.mode === 'summary').length

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
 * Clears all cache (both database and TTS files) - use with caution
 */
export const clearAllCache = async (): Promise<void> => {
  console.log('🗑️ [Cache Manager] Clearing ALL cache')

  try {
    // Clear TTS cache folder
    if (cacheDirectoryExists()) {
      CACHE_DIRECTORY.delete()
    }

    CACHE_DIRECTORY.create({ idempotent: true, intermediates: true })

    // Clear database
    await dbService.clearAllCache()

    console.log('🗑️ [Cache Manager] All cache cleared')
  } catch (error) {
    console.error('🗑️ [Cache Manager] Error clearing all cache:', error)
    throw error
  }
}
