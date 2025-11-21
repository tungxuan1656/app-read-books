import { GToast } from '@/components/g-toast'
import useAppStore from '@/controllers/store'
import { getChapterHtml, getBookChapterContent } from '@/utils'
import { translateChapter, summarizeChapter } from '@/services/gemini.service'
import { dbService } from '@/services/database.service'
import { useEffect, useState } from 'react'

/**
 * Hook để quản lý nội dung chapter đang đọc
 * - Load content từ file
 * - Tích hợp Gemini (translate/summary) với cache SQLite
 * - Track chapter index và name
 * - Loading state
 */
export default function useReadingContent(bookId: string) {
  const book = useAppStore((s) => s.id2Book[bookId])
  const chapterNumber = useAppStore((s) => s.id2BookReadingChapter[bookId] || 1)
  const readingMode = useAppStore((s) => s.readingMode) // Listen to reading mode

  const [chapter, setChapter] = useState({
    content: '',
    index: chapterNumber,
    name: book?.references?.[chapterNumber - 1] || '',
    bookId,
  })

  const [isLoading, setIsLoading] = useState(false)

  // Load chapter content (raw or processed by Gemini)
  useEffect(() => {
    if (!book) return

    const loadChapter = async () => {
      setIsLoading(true)
      try {
        let finalContent = ''

        // 1. Check cache if mode is translate/summary
        if (readingMode !== 'normal') {
          const cached = await dbService.getProcessedChapter(bookId, chapterNumber, readingMode)
          if (cached) {
            console.log(`✅ [Reading] Cache hit: ${bookId}_ch${chapterNumber}_${readingMode}`)
            finalContent = cached.content
          }
        }

        // 2. If not cached, load raw content
        if (!finalContent) {
          const rawContent = await getBookChapterContent(bookId, chapterNumber)
          if (!rawContent) {
            throw new Error('Không thể tải nội dung chương')
          }

          // 3. Process with Gemini if needed
          if (readingMode === 'translate') {
            console.log(`🌐 [Reading] Translating chapter ${chapterNumber}...`)
            finalContent = await translateChapter(rawContent)
            // Save to cache
            await dbService.saveProcessedChapter(bookId, chapterNumber, readingMode, finalContent)
          } else if (readingMode === 'summary') {
            console.log(`✨ [Reading] Summarizing chapter ${chapterNumber}...`)
            finalContent = await summarizeChapter(rawContent)
            // Save to cache
            await dbService.saveProcessedChapter(bookId, chapterNumber, readingMode, finalContent)
          } else {
            // Normal mode - use raw content
            finalContent = rawContent
          }
        }

        setChapter({
          content: finalContent ? getChapterHtml(finalContent) : '',
          index: chapterNumber,
          name: book.references?.[chapterNumber - 1] || '',
          bookId,
        })
      } catch (error) {
        console.error('❌ [Reading] Error loading chapter:', error)
        
        let errorMessage = 'Không thể tải nội dung chương'
        if (error instanceof Error) {
          if (error.message.includes('API Key chưa được cấu hình')) {
            errorMessage = 'Chưa cấu hình Gemini API Key. Vui lòng vào Settings để thiết lập.'
          } else if (error.message.includes('403')) {
            errorMessage = 'Gemini API Key không hợp lệ. Vui lòng kiểm tra lại trong Settings.'
          } else if (error.message) {
            errorMessage = error.message
          }
        }
        
        GToast.error({ message: errorMessage })
        
        setChapter({
          content: '',
          index: chapterNumber,
          name: book.references?.[chapterNumber - 1] || '',
          bookId,
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadChapter()
  }, [book, bookId, chapterNumber, readingMode]) // Re-run when readingMode changes

  return { ...chapter, isLoading }
}
