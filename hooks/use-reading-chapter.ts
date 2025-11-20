import { GToast } from '@/components/g-toast'
import useAppStore from '@/controllers/store'
import { getChapterHtml, showToastError } from '@/utils'
import { useCallback, useEffect, useState, useRef } from 'react'
import { DeviceEventEmitter } from 'react-native'
import { EventKeys } from '@/constants'
import { GSpinner } from '@/components/g-spinner'
import useContentProcessor from './use-content-processor'
import usePrefetch from './use-prefetch'

const MODE_SWITCH_DEBOUNCE = 500 // 500ms debounce

export default function useReadingChapter(bookId: string) {
  const book = useAppStore((s) => s.id2Book[bookId])
  const chapterNumber = useAppStore((s) => s.id2BookReadingChapter[bookId] || 1)
  const readingMode = useAppStore((s) => s.readingMode)

  const [chapter, setChapter] = useState({
    content: '',
    mode: readingMode,
    index: chapterNumber,
    name: book?.references?.[chapterNumber - 1] || '',
    bookId,
  })

  const { processContent } = useContentProcessor()
  const { prefetchChapters } = usePrefetch()

  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const lastModeRef = useRef(readingMode)

  // Load chapter content
  const loadChapter = useCallback(async () => {
    if (!book) return

    try {
      DeviceEventEmitter.emit(EventKeys.EVENT_START_LOADING_CHAPTER)
      GSpinner.show({ label: 'Đang tải...' })

      const content = await processContent(bookId, chapterNumber, readingMode)

      if (content) {
        setChapter({
          content: getChapterHtml(content),
          mode: readingMode,
          index: chapterNumber,
          name: book.references?.[chapterNumber - 1] || '',
          bookId,
        })
      }

      DeviceEventEmitter.emit(EventKeys.EVENT_END_LOADING_CHAPTER)
      GSpinner.hide()

      // Trigger prefetch in background (only for translate/summary)
      if (readingMode !== 'normal' && book.references) {
        setTimeout(() => {
          prefetchChapters(bookId, chapterNumber + 1, readingMode, book.references!.length)
        }, 1000)
      }
    } catch (error) {
      console.error('Error loading chapter:', error)
      GSpinner.hide()
      
      // Hiển thị thông báo lỗi cụ thể
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
      DeviceEventEmitter.emit(EventKeys.EVENT_ERROR_GENERATE_SUMMARY)
    }
  }, [book, bookId, chapterNumber, readingMode, processContent, prefetchChapters])

  // Effect: Load on chapter change
  useEffect(() => {
    loadChapter()
  }, [chapterNumber, bookId])

  // Effect: Debounced mode change
  useEffect(() => {
    if (lastModeRef.current === readingMode) return

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce mode switch
    debounceTimerRef.current = setTimeout(() => {
      console.log(`🔄 Mode switched: ${lastModeRef.current} → ${readingMode}`)
      lastModeRef.current = readingMode
      loadChapter()
    }, MODE_SWITCH_DEBOUNCE)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [readingMode, loadChapter])

  return chapter
}
