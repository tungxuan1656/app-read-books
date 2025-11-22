import { useCallback, useRef } from 'react'
import { getTranslatedContent } from '@/services/translate.service'
import { getSummarizedContent } from '@/services/summary.service'
import { getBookChapterContent } from '@/utils'
import { ReadingAIMode } from '@/@types/common'

export default function useContentProcessor() {
  const processingRef = useRef<Set<string>>(new Set())

  const processContent = useCallback(
    async (bookId: string, chapter: number, mode: ReadingAIMode): Promise<string | null> => {
      const key = `${bookId}_${chapter}_${mode}`

      // Prevent duplicate processing
      if (processingRef.current.has(key)) {
        console.log(`⏳ Already processing: ${key}`)
        return null
      }

      try {
        processingRef.current.add(key)

        let processed: string

        switch (mode) {
          case 'none':
            processed = await getBookChapterContent(bookId, chapter)
            if (!processed) {
              throw new Error('Không thể load nội dung chapter')
            }
            break

          case 'translate':
            console.log(`🌐 Processing translate: ${bookId} ch.${chapter}`)
            processed = await getTranslatedContent(bookId, chapter)
            break

          case 'summary':
            console.log(`✨ Processing summary: ${bookId} ch.${chapter}`)
            processed = await getSummarizedContent(bookId, chapter)
            break

          default:
            processed = await getBookChapterContent(bookId, chapter)
            if (!processed) {
              throw new Error('Không thể load nội dung chapter')
            }
        }

        return processed
      } catch (error) {
        console.error(`❌ Error processing ${key}:`, error)

        // Throw error với message rõ ràng cho caller
        if (error instanceof Error) {
          throw error
        } else {
          throw new Error('Có lỗi không xác định khi xử lý nội dung')
        }
      } finally {
        processingRef.current.delete(key)
      }
    },
    [],
  )

  return { processContent }
}
