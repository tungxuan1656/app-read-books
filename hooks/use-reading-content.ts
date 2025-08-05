import useAppStore from '@/controllers/store'
import { getBookChapterContent, getChapterHtml, showToastError } from '@/utils'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export default function useReadingContent() {
  const reading = useAppStore((s) => s.readingOptions)
  const bookId = useAppStore((s) => s.readingOptions.currentBook)
  const getBookById = useAppStore((s) => s.getBookById)
  const bookInfo = useMemo(() => getBookById(bookId), [bookId, getBookById])
  const [currentChapterContent, setCurrentChapterContent] = useState('')
  const isSummaryMode = useAppStore((s) => s.isSummaryMode)

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
            setCurrentChapterContent(getChapterHtml(res))
          }
        })
        .catch(showToastError)
    }
  }, [reading.currentBook, reading.books])

  return {
    currentChapterName,
    currentChapterContent,
  }
}
