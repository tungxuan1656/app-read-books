import { useEffect, useRef } from 'react'

import {
  prefetchActions,
  useBooksStore,
  usePrefetchStore,
  useReadingStore,
  useSettingsStore,
} from '@/controllers/stores'
import { dbService } from '@/services/database.service'
import { getReadingContent } from '@/services/reading.service'

export const useChapterPrefetch = (
  bookId: string,
  currentChapter: number,
  isCurrentChapterReady: boolean = true,
) => {
  const PREFETCH_COUNT = useSettingsStore.use.settings().PREFETCH_COUNT || '3'
  const readingAIMode = useReadingStore.use.readingAIMode()
  const book = useBooksStore((s) => s.id2Book[bookId])
  const runIdRef = useRef(0)

  useEffect(() => {
    if (!book || readingAIMode === 'none' || !isCurrentChapterReady) {
      prefetchActions.updatePrefetchState({ isRunning: false, message: '' })
      return
    }

    let isCancelled = false
    runIdRef.current += 1
    const runId = runIdRef.current

    const runPrefetch = async () => {
      const totalChapters = book.references?.length || 0
      const startChapter = currentChapter + 1
      const endChapter = Math.min(
        startChapter + +PREFETCH_COUNT - 1,
        totalChapters,
      )

      if (startChapter > endChapter) return

      // Batch check cache status for all chapters first
      const chaptersToCheck = Array.from(
        { length: endChapter - startChapter + 1 },
        (_, i) => startChapter + i,
      )
      const cachedChapters = await dbService.getChaptersCacheStatus(
        bookId,
        chaptersToCheck,
        readingAIMode,
      )

      // Filter out chapters that already have cache
      const chaptersToProcess = chaptersToCheck.filter(
        (ch) => !cachedChapters.has(ch),
      )

      if (chaptersToProcess.length === 0) {
        if (!isCancelled && runIdRef.current === runId) {
          prefetchActions.updatePrefetchState({
            isRunning: false,
            message: '',
            errors: [],
          })
        }
        return
      }

      // Only update start state if we are actually going to do something
      prefetchActions.updatePrefetchState({
        isRunning: true,
        currentBookId: bookId,
        totalChapters: chaptersToProcess.length,
        processedChapters: 0,
        message: `Đang chuẩn bị tải trước ${chaptersToProcess.length} chương...`,
        errors: [],
      })

      for (let i = 0; i < chaptersToProcess.length; i++) {
        if (isCancelled || runIdRef.current !== runId) break

        // Check if mode changed externally (double check)
        if (useReadingStore.getState().readingAIMode !== readingAIMode) break

        const chapterNum = chaptersToProcess[i]

        try {
          prefetchActions.updatePrefetchState({
            message: `Đang xử lý chương ${chapterNum}...`,
          })

          await getReadingContent(bookId, chapterNum, readingAIMode)

          if (!isCancelled && runIdRef.current === runId) {
            prefetchActions.updatePrefetchState({
              processedChapters: i + 1,
            })
          }
        } catch (error) {
          console.error(`❌ [Prefetch] Error at chapter ${chapterNum}:`, error)
          const message =
            error instanceof Error ? error.message : `Lỗi chương ${chapterNum}`
          if (!isCancelled && runIdRef.current === runId) {
            prefetchActions.updatePrefetchState({
              errors: [
                ...usePrefetchStore.getState().prefetchState.errors,
                `Chương ${chapterNum}: ${message}`,
              ],
            })
          }
        }
      }

      if (!isCancelled && runIdRef.current === runId) {
        prefetchActions.updatePrefetchState({
          isRunning: false,
          message: 'Hoàn tất tải trước',
        })
      }
    }

    runPrefetch()

    return () => {
      isCancelled = true
    }
  }, [bookId, currentChapter, readingAIMode, book, isCurrentChapterReady])
}
