import { DeviceEventEmitter } from 'react-native'
import { MMKV } from 'react-native-mmkv'
import { geminiServices } from './gemini-service'
import { convertTTSCapcut, resetTTSCancellation, stopConvertTTSCapcut } from './convert-tts'
import { getCachedSummary, setCachedSummary } from '../utils/summary-cache'
import { breakSummaryIntoLines } from '../utils/string-helpers'
import * as FileSystem from 'expo-file-system'
import { CACHE_FOLDER } from '../utils/tts-cache'
import { getBookChapterContent } from '../utils'

// Cache để lưu trạng thái auto-generate
const autoGenerateCache = new MMKV({
  id: 'auto-generate-cache',
  encryptionKey: 'auto-generate-progress',
})

// Global state để track cancellation
let isAutoGenerateCancelled = false

export interface AutoGenerateProgress {
  bookId: string
  currentChapter: number
  totalChapters: number
  isRunning: boolean
  completedChapters: number[]
  lastError?: string
}

export interface ChapterData {
  chapterNumber: number
  chapterHtml: string
  bookTitle?: string
}

// --- Progress Management ---

const getProgressKey = (bookId: string): string => `auto_generate_progress_${bookId}`

export const getAutoGenerateProgress = (bookId: string): AutoGenerateProgress | null => {
  const progressKey = getProgressKey(bookId)
  const progressData = autoGenerateCache.getString(progressKey)
  return progressData ? JSON.parse(progressData) : null
}

const saveAutoGenerateProgress = (progress: AutoGenerateProgress): void => {
  const progressKey = getProgressKey(progress.bookId)
  autoGenerateCache.set(progressKey, JSON.stringify(progress))
}

const clearAutoGenerateProgress = (bookId: string): void => {
  const progressKey = getProgressKey(bookId)
  autoGenerateCache.delete(progressKey)
}

// --- Cancellation Management ---

export const stopAutoGenerate = (bookId: string) => {
  console.log(`🤖 [Auto Generate] Stopping auto generate for book: ${bookId}`)
  isAutoGenerateCancelled = true
  stopConvertTTSCapcut()

  // Update progress to mark as not running
  const progress = getAutoGenerateProgress(bookId)
  if (progress) {
    progress.isRunning = false
    saveAutoGenerateProgress(progress)
  }
}

export const resetAutoGenerateCancellation = () => {
  isAutoGenerateCancelled = false
  resetTTSCancellation()
}

// --- Utility Functions ---

/**
 * Kiểm tra xem chapter đã có summary và TTS cache chưa
 */
const isChapterFullyCached = async (bookId: string, chapterNumber: number): Promise<boolean> => {
  try {
    // Check summary cache
    const cachedSummary = getCachedSummary(bookId, chapterNumber)
    if (!cachedSummary) return false

    // Check TTS cache - kiểm tra xem có ít nhất 1 file TTS cho chapter này
    const cacheDir = await FileSystem.getInfoAsync(CACHE_FOLDER)
    if (!cacheDir.exists) return false

    const files = await FileSystem.readDirectoryAsync(CACHE_FOLDER)
    const chapterFiles = files.filter(
      (file) => file.startsWith(`${bookId}_${chapterNumber}_`) && file.endsWith('.mp3'),
    )

    return chapterFiles.length > 0
  } catch (error) {
    console.error(`Error checking cache for chapter ${chapterNumber}:`, error)
    return false
  }
}

/**
 * Generate summary cho 1 chapter
 */
const generateChapterSummary = async (
  bookId: string,
  chapterData: ChapterData,
): Promise<string | null> => {
  try {
    if (isAutoGenerateCancelled) return null

    console.log(`📝 [Auto Generate] Generating summary for chapter ${chapterData.chapterNumber}`)

    // Check cache first
    let summary = getCachedSummary(bookId, chapterData.chapterNumber)
    if (summary) {
      console.log(
        `📝 [Auto Generate] Using cached summary for chapter ${chapterData.chapterNumber}`,
      )
      return summary
    }

    // Generate new summary
    summary = await geminiServices.summarizeChapter({
      chapterHtml: chapterData.chapterHtml,
      bookTitle: chapterData.bookTitle,
    })

    if (summary && summary.length > 0) {
      // Cache the summary
      setCachedSummary(bookId, chapterData.chapterNumber, summary)
      console.log(
        `📝 [Auto Generate] Summary generated and cached for chapter ${chapterData.chapterNumber}`,
      )
      return summary
    }

    return null
  } catch (error) {
    console.error(`Error generating summary for chapter ${chapterData.chapterNumber}:`, error)
    return null
  }
}

/**
 * Generate TTS cho 1 chapter summary
 */
const generateChapterTTS = async (
  bookId: string,
  chapterNumber: number,
  summary: string,
  voice: string = 'BV421_vivn_streaming',
): Promise<boolean> => {
  try {
    if (isAutoGenerateCancelled) return false

    console.log(`🎵 [Auto Generate] Generating TTS for chapter ${chapterNumber}`)

    const sentences = breakSummaryIntoLines(summary)
    if (sentences.length === 0) return false

    const taskId = `${bookId}_${chapterNumber}`
    const audioPaths = await convertTTSCapcut(sentences, taskId, voice)

    if (isAutoGenerateCancelled) return false

    if (audioPaths.length > 0) {
      console.log(
        `🎵 [Auto Generate] TTS generated for chapter ${chapterNumber}: ${audioPaths.length} files`,
      )
      return true
    }

    return false
  } catch (error) {
    console.error(`Error generating TTS for chapter ${chapterNumber}:`, error)
    return false
  }
}

// --- Main Auto Generate Function ---

/**
 * Load chapter content động trong quá trình xử lý
 */
const loadChapterContentDynamic = async (
  bookId: string,
  chapterNumber: number,
  bookTitle?: string,
): Promise<ChapterData | null> => {
  try {
    console.log(`📖 [Auto Generate] Loading content for chapter ${chapterNumber}`)
    const content = await getBookChapterContent(bookId, chapterNumber)

    return {
      chapterNumber,
      chapterHtml: content,
      bookTitle: bookTitle,
    }
  } catch (error) {
    console.error(`Error loading chapter ${chapterNumber}:`, error)
    return null
  }
}

export const startAutoGenerate = async (
  bookId: string,
  chapters: ChapterData[],
  options: {
    voice?: string
    startFromChapter?: number
    resumeFromProgress?: boolean
    totalChapters?: number // Thêm option để biết tổng số chapter
  } = {},
): Promise<void> => {
  const {
    voice = 'BV421_vivn_streaming',
    startFromChapter = 1,
    resumeFromProgress = true,
    totalChapters = chapters.length,
  } = options

  console.log(`🤖 [Auto Generate] Starting auto generate for book: ${bookId}`)
  console.log(`🤖 [Auto Generate] Total chapters to process: ${totalChapters}`)

  // Reset cancellation state
  resetAutoGenerateCancellation()

  // Initialize or resume progress
  let progress = resumeFromProgress ? getAutoGenerateProgress(bookId) : null

  if (!progress) {
    progress = {
      bookId,
      currentChapter: startFromChapter,
      totalChapters: totalChapters,
      isRunning: true,
      completedChapters: [],
    }
  } else {
    progress.isRunning = true
    progress.totalChapters = totalChapters // Update in case totalChapters changed
  }

  saveAutoGenerateProgress(progress)

  // Emit start event
  DeviceEventEmitter.emit('auto_generate_started', {
    bookId,
    progress: { ...progress },
  })

  try {
    // Lấy bookTitle từ chapter đầu tiên nếu có
    const bookTitle = chapters.length > 0 ? chapters[0].bookTitle : undefined

    // Process chapters từ currentChapter đến totalChapters
    for (
      let chapterNumber = progress.currentChapter;
      chapterNumber <= totalChapters;
      chapterNumber++
    ) {
      if (isAutoGenerateCancelled) {
        console.log('🤖 [Auto Generate] Process cancelled by user')
        break
      }

      // Update current chapter
      progress.currentChapter = chapterNumber
      saveAutoGenerateProgress(progress)

      // Emit progress event
      DeviceEventEmitter.emit('auto_generate_progress', {
        bookId,
        chapterNumber,
        progress: chapterNumber / totalChapters,
        totalChapters: totalChapters,
        completedChapters: progress.completedChapters.length,
      })

      // Skip if already fully cached
      if (await isChapterFullyCached(bookId, chapterNumber)) {
        console.log(`⏭️ [Auto Generate] Chapter ${chapterNumber} already cached, skipping`)
        if (!progress.completedChapters.includes(chapterNumber)) {
          progress.completedChapters.push(chapterNumber)
          saveAutoGenerateProgress(progress)
        }

        // Emit chapter completed event for cached chapters too
        DeviceEventEmitter.emit('auto_generate_chapter_completed', {
          bookId,
          chapterNumber,
          summary: getCachedSummary(bookId, chapterNumber) || '',
          completedChapters: progress.completedChapters.length,
          totalChapters: totalChapters,
        })
        continue
      }

      console.log(`🔄 [Auto Generate] Processing chapter ${chapterNumber}`)

      // Load chapter content động
      const chapterData = await loadChapterContentDynamic(bookId, chapterNumber, bookTitle)
      if (!chapterData) {
        const errorMsg = `Failed to load content for chapter ${chapterNumber}`
        console.error(`🤖 [Auto Generate] ${errorMsg}`)
        progress.lastError = errorMsg
        saveAutoGenerateProgress(progress)

        DeviceEventEmitter.emit('auto_generate_error', {
          bookId,
          chapterNumber,
          error: errorMsg,
        })
        continue
      }

      if (isAutoGenerateCancelled) break

      // Step 1: Generate Summary
      const summary = await generateChapterSummary(bookId, chapterData)
      if (!summary) {
        const errorMsg = `Failed to generate summary for chapter ${chapterNumber}`
        console.error(`🤖 [Auto Generate] ${errorMsg}`)
        progress.lastError = errorMsg
        saveAutoGenerateProgress(progress)

        DeviceEventEmitter.emit('auto_generate_error', {
          bookId,
          chapterNumber,
          error: errorMsg,
        })
        continue
      }

      if (isAutoGenerateCancelled) break

      // Step 2: Generate TTS
      const ttsSuccess = await generateChapterTTS(bookId, chapterNumber, summary, voice)
      if (!ttsSuccess) {
        const errorMsg = `Failed to generate TTS for chapter ${chapterNumber}`
        console.error(`🤖 [Auto Generate] ${errorMsg}`)
        progress.lastError = errorMsg
        saveAutoGenerateProgress(progress)

        DeviceEventEmitter.emit('auto_generate_error', {
          bookId,
          chapterNumber,
          error: errorMsg,
        })
        continue
      }

      if (isAutoGenerateCancelled) break

      // Mark chapter as completed
      if (!progress.completedChapters.includes(chapterNumber)) {
        progress.completedChapters.push(chapterNumber)
      }
      progress.currentChapter = chapterNumber + 1
      delete progress.lastError
      saveAutoGenerateProgress(progress)

      console.log(`✅ [Auto Generate] Chapter ${chapterNumber} completed successfully`)

      DeviceEventEmitter.emit('auto_generate_chapter_completed', {
        bookId,
        chapterNumber,
        summary,
        completedChapters: progress.completedChapters.length,
        totalChapters: totalChapters,
      })

      // Small delay to prevent overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    // Final update
    progress.isRunning = false

    if (isAutoGenerateCancelled) {
      console.log('🤖 [Auto Generate] Process was cancelled')
      DeviceEventEmitter.emit('auto_generate_cancelled', {
        bookId,
        completedChapters: progress.completedChapters.length,
        totalChapters: totalChapters,
      })
    } else if (progress.completedChapters.length === totalChapters) {
      console.log('🎉 [Auto Generate] All chapters completed successfully!')
      clearAutoGenerateProgress(bookId) // Clear progress when fully completed
      DeviceEventEmitter.emit('auto_generate_completed', {
        bookId,
        completedChapters: progress.completedChapters.length,
        totalChapters: totalChapters,
      })
    } else {
      console.log(
        `🤖 [Auto Generate] Process finished with ${progress.completedChapters.length}/${totalChapters} chapters completed`,
      )
      saveAutoGenerateProgress(progress)
      DeviceEventEmitter.emit('auto_generate_paused', {
        bookId,
        completedChapters: progress.completedChapters.length,
        totalChapters: totalChapters,
        canResume: true,
      })
    }
  } catch (error) {
    console.error('🤖 [Auto Generate] Unexpected error:', error)
    progress.isRunning = false
    progress.lastError = error instanceof Error ? error.message : 'Unknown error'
    saveAutoGenerateProgress(progress)

    DeviceEventEmitter.emit('auto_generate_error', {
      bookId,
      error: progress.lastError,
    })
  }
}

// --- Status Check Functions ---

export const isAutoGenerateRunning = (bookId: string): boolean => {
  const progress = getAutoGenerateProgress(bookId)
  return progress?.isRunning || false
}

export const getAutoGenerateStats = (bookId: string) => {
  const progress = getAutoGenerateProgress(bookId)
  if (!progress) return null

  return {
    totalChapters: progress.totalChapters,
    completedChapters: progress.completedChapters.length,
    currentChapter: progress.currentChapter,
    progressPercentage: (progress.completedChapters.length / progress.totalChapters) * 100,
    isRunning: progress.isRunning,
    canResume: !progress.isRunning && progress.completedChapters.length < progress.totalChapters,
    lastError: progress.lastError,
  }
}

// --- Cleanup Functions ---

export const clearAutoGenerateCache = (bookId: string): void => {
  clearAutoGenerateProgress(bookId)
  console.log(`🗑️ [Auto Generate] Cleared auto generate cache for book: ${bookId}`)
}

export const clearAllAutoGenerateCache = (): void => {
  const allKeys = autoGenerateCache.getAllKeys()
  const progressKeys = allKeys.filter((key) => key.startsWith('auto_generate_progress_'))
  progressKeys.forEach((key) => autoGenerateCache.delete(key))
  console.log(`🗑️ [Auto Generate] Cleared all auto generate cache`)
}

// Export service object
export const autoGenerateService = {
  startAutoGenerate,
  stopAutoGenerate,
  getAutoGenerateProgress,
  getAutoGenerateStats,
  isAutoGenerateRunning,
  clearAutoGenerateCache,
  clearAllAutoGenerateCache,
  resetAutoGenerateCancellation,
}
