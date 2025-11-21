import { useCallback, useRef } from 'react'
import { dbService } from '@/services/database.service'
import { translateChapter, summarizeChapter } from '@/services/gemini.service'
import { getBookChapterContent } from '@/utils'
import type { ReadingMode } from '@/controllers/store'

export default function useContentProcessor() {
  const processingRef = useRef<Set<string>>(new Set())

  const processContent = useCallback(
    async (bookId: string, chapter: number, mode: ReadingMode): Promise<string | null> => {
      const key = `${bookId}_${chapter}_${mode}`

      // Prevent duplicate processing
      if (processingRef.current.has(key)) {
        console.log(`⏳ Already processing: ${key}`)
        return null
      }

      try {
        processingRef.current.add(key)

        // 1. Check database cache for translate/summary modes
        if (mode !== 'normal') {
          const cached = await dbService.getProcessedChapter(bookId, chapter, mode)
          if (cached) {
            console.log(`✅ Cache hit: ${key}`)
            return cached.content
          }
        }

        // 2. Load raw content
        const rawContent = await getBookChapterContent(bookId, chapter)
        if (!rawContent) {
          throw new Error('Không thể load nội dung chapter')
        }

        // 3. Process based on mode
        let processed: string

        switch (mode) {
          case 'normal':
            processed = rawContent
            break

          case 'translate':
            console.log(`🌐 Translating: ${bookId} ch.${chapter}`)
            processed = await translateChapter(rawContent)
            break

          case 'summary':
            console.log(`✨ Summarizing: ${bookId} ch.${chapter}`)
            processed = await summarizeChapter(rawContent)
            break

          default:
            processed = rawContent
        }

        // 4. Save to cache (except normal mode)
        if (mode !== 'normal') {
          await dbService.saveProcessedChapter(bookId, chapter, mode, processed)
          console.log(`💾 Saved to cache: ${key}`)
        }

        return processed
      } catch (error) {
        console.error(`❌ Error processing ${key}:`, error)
        
        // Throw error với message rõ ràng cho user
        if (error instanceof Error) {
          throw error // Re-throw để caller xử lý
        } else {
          throw new Error('Có lỗi không xác định khi xử lý nội dung')
        }
      } finally {
        processingRef.current.delete(key)
      }
    },
    []
  )

  return { processContent }
}
