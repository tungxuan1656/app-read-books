import { MMKVKeys } from '@/constants'
import useAppStore, { storeActions } from '@/controllers/store'
import { saveCurrentBookId } from '@/utils'
import React, { useCallback, useEffect, useRef } from 'react'

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

  // Initialize reading state on mount
  useEffect(() => {
    saveCurrentBookId(bookId)
    const currentIndex = useAppStore.getState().id2BookReadingChapter[bookId]
    if (!currentIndex) {
      storeActions.updateReadingChapter(bookId, 1)
    }
    storeActions.updateSetting('isReading', true)
    
    return () => {
      storeActions.updateSetting('isReading', false)
      clearTimeout(refTimeout.current)
      clearTimeout(refTimeoutSave.current)
    }
  }, [bookId])

  const nextChapter = useCallback(
    (timeout?: number) => {
      clearTimeout(refTimeout.current)
      refTimeout.current = setTimeout(() => {
        storeActions.nextReadingChapter(bookId)
      }, timeout || 50)
    },
    [bookId],
  )

  const previousChapter = useCallback(
    (timeout?: number) => {
      clearTimeout(refTimeout.current)
      refTimeout.current = setTimeout(() => {
        storeActions.previousReadingChapter(bookId)
      }, timeout || 50)
    },
    [bookId],
  )

  const saveOffset = useCallback((offset: number) => {
    clearTimeout(refTimeoutSave.current)
    refTimeoutSave.current = setTimeout(() => {
      storeActions.updateSetting('currentReadingOffset', offset)
    }, 500)
  }, [])

  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent
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
