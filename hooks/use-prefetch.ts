import { useCallback, useRef } from 'react'
import { dbService } from '@/services/database-service'
import useContentProcessor from './use-content-processor'
import useAppStore from '@/controllers/store'

const PREFETCH_COUNT = 10
const PREFETCH_DELAY = 2000 // 2s delay giữa các chapters
const MAX_CONCURRENT = 2 // Process 2 chapters cùng lúc

export default function usePrefetch() {
  const { processContent } = useContentProcessor()
  const setPrefetching = useAppStore((s) => s.setPrefetching)
  const abortRef = useRef(false)

  const prefetchChapters = useCallback(
    async (
      bookId: string,
      fromChapter: number,
      mode: 'translate' | 'summary',
      totalChapters: number
    ) => {
      abortRef.current = false
      setPrefetching(true)

      try {
        const toChapter = Math.min(fromChapter + PREFETCH_COUNT, totalChapters)
        console.log(`🚀 Prefetch: ${bookId} ch.${fromChapter}-${toChapter} [${mode}]`)

        // Add to queue
        for (let ch = fromChapter; ch <= toChapter; ch++) {
          const priority = toChapter - ch // Closer chapters = higher priority
          await dbService.addToPrefetchQueue(bookId, ch, mode, priority)
        }

        // Process queue with concurrency limit
        const processingPromises: Promise<void>[] = []

        while (true) {
          if (abortRef.current) {
            console.log('⚠️ Prefetch aborted')
            break
          }

          const tasks = await dbService.getPendingPrefetchTasks(MAX_CONCURRENT)
          if (tasks.length === 0) break

          for (const task of tasks) {
            const promise = (async () => {
              try {
                await dbService.updatePrefetchStatus(task.id, 'processing')

                // Check if already cached
                const cached = await dbService.getProcessedChapter(
                  task.book_id,
                  task.chapter_number,
                  task.mode as any
                )

                if (!cached) {
                  await processContent(task.book_id, task.chapter_number, task.mode as any)
                  await new Promise((resolve) => setTimeout(resolve, PREFETCH_DELAY))
                }

                await dbService.updatePrefetchStatus(task.id, 'completed')
              } catch (error) {
                console.error(
                  `❌ Prefetch failed: ${task.book_id} ch.${task.chapter_number}`,
                  error
                )
                
                // Kiểm tra lỗi critical (API key invalid) → abort toàn bộ prefetch
                if (error instanceof Error) {
                  if (error.message.includes('API Key chưa được cấu hình') || 
                      error.message.includes('403') ||
                      error.message.includes('API Error')) {
                    console.error('❌ Critical error in prefetch, aborting all tasks')
                    abortRef.current = true
                  }
                }
                
                await dbService.updatePrefetchStatus(
                  task.id,
                  'failed',
                  error instanceof Error ? error.message : 'Unknown error'
                )
              }
            })()

            processingPromises.push(promise)
          }

          // Wait for current batch
          await Promise.all(processingPromises)
          processingPromises.length = 0
        }

        console.log('✅ Prefetch completed')
      } catch (error) {
        console.error('❌ Prefetch error:', error)
      } finally {
        setPrefetching(false)
      }
    },
    [processContent, setPrefetching]
  )

  const abortPrefetch = useCallback(() => {
    abortRef.current = true
  }, [])

  return { prefetchChapters, abortPrefetch }
}
