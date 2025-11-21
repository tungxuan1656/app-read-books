import { MMKVKeys } from '@/constants'
import { MMKVStorage } from '@/controllers/mmkv'
import useAppStore, { storeActions } from '@/controllers/store'
import { saveCurrentBookId } from '@/utils'
import { useEffect } from 'react'

export default function useReUpdateReading(bookId: string) {
  useEffect(() => {
    saveCurrentBookId(bookId)
    const currentIndex = useAppStore.getState().id2BookReadingChapter[bookId]
    if (!currentIndex) {
      storeActions.updateReadingChapter(bookId, 1)
    }
    MMKVStorage.set(MMKVKeys.IS_READING, true)
    return () => {
      MMKVStorage.set(MMKVKeys.IS_READING, false)
    }
  }, [bookId])

  return null
}
