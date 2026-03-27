import React, { useCallback, useEffect, useRef } from 'react'

import {
  booksActions,
  readingActions,
  useBooksStore,
} from '@/controllers/stores'

/**
 * Hook để quản lý navigation và state của reading screen
 * - Next/Previous chapter
 * - Save scroll offset
 * - Initialize reading state (bookId, chapter index)
 * - Cleanup when unmount
 */
export default function useReadingNavigation(bookId: string) {
  const refTimeout = useRef<number | undefined>(undefined)
  const refTimeoutSave = useRef<number | undefined>(undefined)
  const refCanChangeChapter = useRef<boolean>(true)

  // Initialize reading state on mount
  useEffect(() => {
    const currentIndex = useBooksStore.getState().id2BookReadingChapter[bookId]
    if (!currentIndex) {
      booksActions.updateReadingChapter(bookId, 1)
    }
    readingActions.updateReading({ onScreen: true, bookId })

    return () => {
      setTimeout(() => {
        readingActions.updateReading({ onScreen: false })
      }, 100)
      clearTimeout(refTimeout.current)
      clearTimeout(refTimeoutSave.current)
    }
  }, [bookId])

  const nextChapter = useCallback(
    (timeout?: number) => {
      if (!refCanChangeChapter.current) return
      clearTimeout(refTimeout.current)
      refTimeout.current = setTimeout(() => {
        booksActions.nextReadingChapter(bookId)
        refCanChangeChapter.current = false
        setTimeout(() => {
          refCanChangeChapter.current = true
        }, 1000)
      }, timeout || 50)
    },
    [bookId],
  )

  const previousChapter = useCallback(
    (timeout?: number) => {
      if (!refCanChangeChapter.current) return
      clearTimeout(refTimeout.current)
      refTimeout.current = setTimeout(() => {
        booksActions.previousReadingChapter(bookId)
        refCanChangeChapter.current = false
        setTimeout(() => {
          refCanChangeChapter.current = true
        }, 1000)
      }, timeout || 50)
    },
    [bookId],
  )

  const saveOffset = useCallback((offset: number) => {
    clearTimeout(refTimeoutSave.current)
    refTimeoutSave.current = setTimeout(() => {
      readingActions.updateReading({ offset })
    }, 500)
  }, [])

  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset, layoutMeasurement, contentSize } =
        event.nativeEvent
      const offset = Math.round(contentOffset.y + layoutMeasurement.height)
      const contentHeight = Math.round(contentSize.height)

      saveOffset(contentOffset.y)

      // Auto next chapter when scrolling to bottom
      if (offset > contentHeight + 70) {
        nextChapter(500)
      }

      // Auto previous chapter when pull to top
      if (contentOffset.y < -80) {
        previousChapter(500)
      }
    },
    [saveOffset, nextChapter, previousChapter],
  )

  return React.useMemo(
    () => ({
      nextChapter,
      previousChapter,
      handleScroll,
    }),
    [nextChapter, previousChapter, handleScroll],
  )
}
