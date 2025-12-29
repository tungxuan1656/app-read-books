import useAppStore, { storeActions } from '@/controllers/store'
import { getReadingContent } from '@/services/reading.service'
import { useEffect, useRef } from 'react'

export const useChapterPrefetch = (
  bookId: string,
  currentChapter: number,
  isCurrentChapterReady: boolean = true,
) => {
  const PREFETCH_COUNT = useAppStore((s) => s.settings.PREFETCH_COUNT || '3')
  const readingAIMode = useAppStore((s) => s.readingAIMode)
  const book = useAppStore((s) => s.id2Book[bookId])

  // Use a ref to track the latest requested chapter to avoid race conditions in UI updates
  const latestChapterRef = useRef(currentChapter)

  useEffect(() => {
    latestChapterRef.current = currentChapter
  }, [currentChapter])

  useEffect(() => {
    if (!book || readingAIMode === 'none' || !isCurrentChapterReady) {
      storeActions.updatePrefetchState({ isRunning: false, message: '' })
      return
    }

    let isCancelled = false

    const runPrefetch = async () => {
      const totalChapters = book.references?.length || 0
      const startChapter = currentChapter + 1
      const endChapter = Math.min(startChapter + +PREFETCH_COUNT - 1, totalChapters)

      if (startChapter > endChapter) return

      // Only update start state if we are actually going to do something
      storeActions.updatePrefetchState({
        isRunning: true,
        currentBookId: bookId,
        totalChapters: endChapter - startChapter + 1,
        processedChapters: 0,
        message: `Đang chuẩn bị tải trước ${endChapter - startChapter + 1} chương...`,
      })

      for (let i = startChapter; i <= endChapter; i++) {
        if (isCancelled) break

        // Check if mode changed externally (double check)
        if (useAppStore.getState().readingAIMode !== readingAIMode) break

        try {
          storeActions.updatePrefetchState({
            message: `Đang xử lý chương ${i}...`,
          })

          await getReadingContent(bookId, i, readingAIMode)

          if (!isCancelled) {
            storeActions.updatePrefetchState({
              processedChapters: i - startChapter + 1,
            })
          }
        } catch (error) {
          console.error(`❌ [Prefetch] Error at chapter ${i}:`, error)
        }
      }

      if (!isCancelled) {
        storeActions.updatePrefetchState({
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
