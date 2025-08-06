import { GToast } from '@/components/g-toast'
import useAppStore from '@/controllers/store'
import { getBookChapterContent, getChapterHtml, showToastError } from '@/utils'
import { useCallback, useEffect, useState } from 'react'
import { DeviceEventEmitter } from 'react-native'
import useSummary from './use-summary'
import { EventKeys } from '@/constants'

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
        summary: false,
        index: chapterNumber,
        name: book.references?.[chapterNumber - 1] || '',
      }))
      DeviceEventEmitter.emit(EventKeys.EVENT_START_LOADING_CHAPTER)
      getBookChapterContent(book.id, chapterNumber)
        .then((res) => {
          if (res) {
            if (!isSummaryMode) {
              setChapter((prev) => ({
                ...prev,
                content: getChapterHtml(res),
                summary: false,
                index: chapterNumber,
              }))
              DeviceEventEmitter.emit(EventKeys.EVENT_END_LOADING_CHAPTER)
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
      DeviceEventEmitter.emit(EventKeys.EVENT_START_GENERATE_SUMMARY)
      const summary = await startSummary(bookId, chapter, content)
      if (summary) {
        setChapter((prev) => ({
          ...prev,
          content: getChapterHtml(summary),
          summary: true,
          index: chapter,
        }))
      } else {
        GToast.error({ message: 'Thất bại khi tạo nội dung chương' })
      }
      DeviceEventEmitter.emit(EventKeys.EVENT_END_GENERATE_SUMMARY)
    },
    [bookId],
  )

  return chapter
}
