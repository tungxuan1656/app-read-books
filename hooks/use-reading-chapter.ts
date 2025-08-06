import { GToast } from '@/components/g-toast'
import useAppStore from '@/controllers/store'
import { getBookChapterContent, getChapterHtml, showToastError } from '@/utils'
import { useCallback, useEffect, useState } from 'react'
import useSummary from './use-summary'
import { GSpinner } from '@/components/g-spinner'

export default function useReadingChapter(bookId: string) {
  const book = useAppStore((s) => s.id2Book[bookId])
  const chapterNumber = useAppStore((s) => s.id2BookReadingChapter[bookId] || 1)

  const [chapter, setChapter] = useState({
    content: '',
    summary: false,
    index: chapterNumber,
    name: book?.references?.[chapterNumber - 1] || '',
    bookId,
  })
  const isSummaryMode = useAppStore((s) => s.isSummaryMode)
  const startSummary = useSummary()

  useEffect(() => {
    if (chapterNumber && book) {
      setChapter((prev) => ({
        ...prev,
        content: '',
      }))
      GSpinner.show({ label: 'Đang tải chương...' })
      getBookChapterContent(book.id, chapterNumber)
        .then((res) => {
          if (res) {
            if (!isSummaryMode) {
              setChapter((prev) => ({
                ...prev,
                content: getChapterHtml(res),
                summary: false,
                number: chapterNumber,
              }))
              GSpinner.hide()
            } else {
              getChapterBySummary(res, chapterNumber)
            }
          }
        })
        .catch(showToastError)
    }
  }, [book, chapterNumber, isSummaryMode])

  const getChapterBySummary = useCallback(
    async (content: string, chapter: number) => {
      GSpinner.show({ label: 'Đang tóm tắt...' })
      const summary = await startSummary(bookId, chapter, content)
      if (summary) {
        setChapter((prev) => ({
          ...prev,
          content: getChapterHtml(summary),
          summary: true,
          number: chapter,
        }))
      } else {
        GToast.error({ message: 'Thất bại khi tạo nội dung chương' })
      }
      GSpinner.hide()
    },
    [bookId],
  )

  return chapter
}
