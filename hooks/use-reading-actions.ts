import { EventKeys, MMKVKeys } from '@/constants'
import { MMKVStorage } from '@/controllers/mmkv'
import useAppStore from '@/controllers/store'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { DeviceEventEmitter } from 'react-native'

export default function useReadingActions() {
  const reading = useAppStore((s) => s.readingOptions)
  const updateReadingOptions = useAppStore((s) => s.updateReadingOptions)

  const [isLoading, setIsLoading] = useState(true)

  const refTimeout = useRef<number | undefined>(undefined)
  const refTimeoutSave = useRef<number | undefined>(undefined)

  const nextChapter = useCallback(
    (timeout?: number) => {
      clearTimeout(refTimeout.current)
      refTimeout.current = setTimeout(() => {
        setIsLoading(true)
        const books = { ...reading.books }
        books[reading.currentBook] = books[reading.currentBook] + 1
        updateReadingOptions({ books })
        DeviceEventEmitter.emit(EventKeys.READING_NEXT_CHAPTER_DONE)
      }, timeout || 50)
    },
    [reading.books, reading.currentBook, updateReadingOptions],
  )

  const previousChapter = useCallback(
    (timeout?: number) => {
      clearTimeout(refTimeout.current)
      refTimeout.current = setTimeout(() => {
        setIsLoading(true)
        const books = { ...reading.books }
        books[reading.currentBook] = Math.max(books[reading.currentBook] - 1, 0)
        updateReadingOptions({ books })
        DeviceEventEmitter.emit(EventKeys.READING_PREVIOUS_CHAPTER_DONE)
      }, timeout || 50)
    },
    [reading.books, reading.currentBook, updateReadingOptions],
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

  const onLoaded = useCallback(() => {
    setTimeout(() => {
      setIsLoading(false)
    }, 150)
  }, [])

  return {
    nextChapter,
    previousChapter,
    saveOffset,
    isLoading,
    onLoaded,
  }
}
