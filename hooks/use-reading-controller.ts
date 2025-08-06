import { EventKeys, MMKVKeys } from '@/constants'
import { MMKVStorage } from '@/controllers/mmkv'
import useAppStore, { storeActions } from '@/controllers/store'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { DeviceEventEmitter } from 'react-native'

export default function useReadingController(bookId: string) {
  const refTimeout = useRef<number | undefined>(undefined)
  const refTimeoutSave = useRef<number | undefined>(undefined)

  const nextChapter = useCallback(
    (timeout?: number) => {
      clearTimeout(refTimeout.current)
      refTimeout.current = setTimeout(() => {
        storeActions.nextReadingChapter(bookId)
        DeviceEventEmitter.emit(EventKeys.READING_NEXT_CHAPTER_DONE)
      }, timeout || 50)
    },
    [bookId],
  )

  const previousChapter = useCallback(
    (timeout?: number) => {
      clearTimeout(refTimeout.current)
      refTimeout.current = setTimeout(() => {
        storeActions.previousReadingChapter(bookId)
        DeviceEventEmitter.emit(EventKeys.READING_PREVIOUS_CHAPTER_DONE)
      }, timeout || 50)
    },
    [bookId],
  )

  const saveOffset = useCallback((offset: number) => {
    clearTimeout(refTimeoutSave.current)
    refTimeoutSave.current = setTimeout(() => {
      MMKVStorage.set(MMKVKeys.CURRENT_READING_OFFSET, offset)
    }, 500)
  }, [])

  useEffect(() => {
    return () => {
      clearTimeout(refTimeout.current)
      clearTimeout(refTimeoutSave.current)
    }
  }, [])

  return React.useMemo(
    () => ({
      nextChapter,
      previousChapter,
      saveOffset,
    }),
    [nextChapter, previousChapter, saveOffset],
  )
}
