import { GToast } from '@/components/g-toast'
import useAppStore from '@/controllers/store'
import { getChapterHtml, getBookChapterContent } from '@/utils'
import { useEffect, useState } from 'react'

/**
 * Hook để quản lý nội dung chapter đang đọc
 * - Load content từ file
 * - Track chapter index và name
 * - Loading state
 */
export default function useReadingContent(bookId: string) {
  const book = useAppStore((s) => s.id2Book[bookId])
  const chapterNumber = useAppStore((s) => s.id2BookReadingChapter[bookId] || 1)

  const [chapter, setChapter] = useState({
    content: '',
    index: chapterNumber,
    name: book?.references?.[chapterNumber - 1] || '',
    bookId,
  })

  const [isLoading, setIsLoading] = useState(false)

  // Load chapter content from file
  useEffect(() => {
    if (!book) return

    const loadChapter = async () => {
      setIsLoading(true)
      try {
        const content = await getBookChapterContent(bookId, chapterNumber)
        
        setChapter({
          content: content ? getChapterHtml(content) : '',
          index: chapterNumber,
          name: book.references?.[chapterNumber - 1] || '',
          bookId,
        })
      } catch (error) {
        console.error('Error loading chapter:', error)
        GToast.error({ message: 'Không thể tải nội dung chương' })
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
  }, [book, bookId, chapterNumber])

  return { ...chapter, isLoading }
}
