import { MMKVKeys } from '@/constants'
import { MMKVStorage } from '@/controllers/mmkv'
import useAppStore from '@/controllers/store'
import React, { useEffect } from 'react'

export default function useReupdateReading(bookId: string) {
  const reading = useAppStore((s) => s.readingOptions)
  const updateReadingOptions = useAppStore((s) => s.updateReadingOptions)

  useEffect(() => {
    const newId = bookId ? bookId : reading.currentBook
    if (!reading.books[newId]) {
      const books = { ...reading.books }
      books[newId] = 1
      updateReadingOptions({
        currentBook: newId,
        books,
      })
    } else {
      updateReadingOptions({
        currentBook: newId,
      })
    }

    MMKVStorage.set(MMKVKeys.IS_READING, true)
    return () => {
      MMKVStorage.set(MMKVKeys.IS_READING, false)
    }
  }, [bookId, updateReadingOptions])

  return null
}
