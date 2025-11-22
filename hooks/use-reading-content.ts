import useAppStore from '@/controllers/store'
import { getChapterHtml, getBookChapterContent } from '@/utils'
import { getTranslatedContent } from '@/services/translate.service'
import { getSummarizedContent } from '@/services/summary.service'
import { useEffect, useState } from 'react'

export default function useReadingContent(bookId: string) {
  const book = useAppStore((s) => s.id2Book[bookId])
  const chapterNumber = useAppStore((s) => s.id2BookReadingChapter[bookId] || 1)
  const readingAIMode = useAppStore((s) => s.readingAIMode)

  const [chapter, setChapter] = useState({
    content: '',
    index: chapterNumber,
    name: book?.references?.[chapterNumber - 1] || '',
    bookId,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Load chapter content based on reading AI mode
  useEffect(() => {
    if (!book) return

    const loadChapter = async () => {
      setIsLoading(true)
      
      try {
        let finalContent = ''

        // Load content based on mode
        switch (readingAIMode) {
          case 'none':
            setMessage('Đang tải nội dung gốc...')
            finalContent = await getBookChapterContent(bookId, chapterNumber)
            if (!finalContent) {
              throw new Error('Không thể tải nội dung chương')
            }
            break

          case 'translate':
            setMessage(`Đang dịch chương ${chapterNumber}...`)
            finalContent = await getTranslatedContent(bookId, chapterNumber)
            break

          case 'summary':
            setMessage(`Đang tóm tắt chương ${chapterNumber}...`)
            finalContent = await getSummarizedContent(bookId, chapterNumber)
            break

          default:
            finalContent = await getBookChapterContent(bookId, chapterNumber)
        }

        setChapter({
          content: finalContent ? getChapterHtml(finalContent) : '',
          index: chapterNumber,
          name: book.references?.[chapterNumber - 1] || '',
          bookId,
        })
        
        setMessage('') // Clear message on success
      } catch (error) {
        console.error('❌ [Reading] Error loading chapter:', error)

        // Set empty content on error
        setChapter({
          content: '',
          index: chapterNumber,
          name: book.references?.[chapterNumber - 1] || '',
          bookId,
        })
        
        setMessage('Có lỗi xảy ra khi tải chương')
      } finally {
        setIsLoading(false)
      }
    }

    loadChapter()
  }, [book, bookId, chapterNumber, readingAIMode])

  return { ...chapter, isLoading, message }
}
