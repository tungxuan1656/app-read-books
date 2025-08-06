import { GToast } from '@/components/g-toast'
import useAppStore from '@/controllers/store'
import { getBookChapterContent, getChapterHtml, showToastError } from '@/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useSummary from './use-summary'

export default function useCurrentReading() {
  const reading = useAppStore((s) => s.readingOptions)
  const bookId = useAppStore((s) => s.readingOptions.currentBook)
  const getBookById = useAppStore((s) => s.getBookById)
  const bookInfo = useMemo(() => getBookById(bookId), [bookId, getBookById])
  const [chapter, setChapter] = useState({
    content: '',
    summary: false,
    number: 1,
    name: bookInfo?.name,
    bookId,
  })
  const isSummaryMode = useAppStore((s) => s.isSummaryMode)

  const startSummary = useSummary()

  const currentChapterName = useMemo(() => {
    if (bookInfo && reading.books) {
      const bookId = reading.currentBook
      const chapter = reading.books[bookId] ?? 1
      return bookInfo.references?.[chapter - 1]
    }
  }, [bookInfo, reading.books, reading.currentBook])

  useEffect(() => {
    const book = reading.currentBook
    const chapter = reading.books[book] ?? 1
    if (chapter && reading.currentBook) {
      getBookChapterContent(reading.currentBook, chapter)
        .then((res) => {
          if (res) {
            if (!isSummaryMode) {
              setChapter((prev) => ({
                ...prev,
                content: getChapterHtml(res),
                summary: false,
                number: chapter,
              }))
            } else {
              getChapterBySummary(res, chapter)
            }
          }
        })
        .catch(showToastError)
    }
  }, [reading.currentBook, reading.books, isSummaryMode])

  const getChapterBySummary = useCallback(
    async (content: string, chapter: number) => {
      const summary = await startSummary(bookId, currentChapterName, chapter, content)
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
    },
    [currentChapterName, bookId],
  )

  return chapter
}
