import useAppStore from '@/controllers/store'
import { getBookChapterContent, getChapterHtml, showToastError } from '@/utils'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSummary from './use-summary'
import { GToast } from '@/components/GToast'

export default function useReadingContent() {
  const reading = useAppStore((s) => s.readingOptions)
  const bookId = useAppStore((s) => s.readingOptions.currentBook)
  const getBookById = useAppStore((s) => s.getBookById)
  const bookInfo = useMemo(() => getBookById(bookId), [bookId, getBookById])
  const [currentChapterContent, setCurrentChapterContent] = useState('')
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
              setCurrentChapterContent(getChapterHtml(res))
            } else {
              getChapterBySummary(res, chapter)
            }
          }
        })
        .catch(showToastError)
    }
  }, [reading.currentBook, reading.books, isSummaryMode])

  const getChapterBySummary = useCallback(async (content: string, chapter: number) => {
    const summary = await startSummary(bookId, bookInfo?.name, chapter, content)
    if (summary) {
      setCurrentChapterContent(getChapterHtml(summary))
    } else {
      GToast.error({ message: 'Thất bại khi tạo nội dung chương' })
    }
  }, [])

  return {
    currentChapterName,
    currentChapterContent,
  }
}
