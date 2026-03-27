import { useEffect, useState } from 'react'

import {
  useBooksStore,
  useReadingStore,
  useUIRuntimeStore,
} from '@/controllers/stores'
import {
  getLoadingMessage,
  getReadingContent,
} from '@/services/reading.service'
import { getChapterHtml } from '@/utils'

export default function useReadingContent(bookId: string) {
  const book = useBooksStore((s) => s.id2Book[bookId])
  const chapterNumber = useBooksStore(
    (s) => s.id2BookReadingChapter[bookId] || 1,
  )
  const readingAIMode = useReadingStore.use.readingAIMode()
  const reloadTrigger = useUIRuntimeStore.use.contentReloadToken()

  const [chapter, setChapter] = useState({
    content: '',
    index: chapterNumber,
    name: book?.references?.[chapterNumber - 1] || '',
    bookId,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Load chapter content based on reading AI mode
  useEffect(() => {
    if (!book) return

    let isCancelled = false
    const requestId = `${bookId}_${chapterNumber}_${readingAIMode}_${reloadTrigger}`

    const loadChapter = async () => {
      setIsLoading(true)
      setMessage(getLoadingMessage(readingAIMode, chapterNumber))

      try {
        const finalContent = await getReadingContent(
          bookId,
          chapterNumber,
          readingAIMode,
        )

        if (isCancelled) return

        const latestRequestId = `${bookId}_${useBooksStore.getState().id2BookReadingChapter[bookId] || 1}_${useReadingStore.getState().readingAIMode}_${useUIRuntimeStore.getState().contentReloadToken}`
        if (latestRequestId !== requestId) return

        setChapter({
          content: finalContent ? getChapterHtml(finalContent) : '',
          index: chapterNumber,
          name: book.references?.[chapterNumber - 1] || '',
          bookId,
        })

        setMessage('')
      } catch (error) {
        if (isCancelled) return

        console.error('❌ [Reading] Error loading chapter:', error)

        setChapter({
          content: '',
          index: chapterNumber,
          name: book.references?.[chapterNumber - 1] || '',
          bookId,
        })

        setMessage('Có lỗi xảy ra khi tải chương')
      } finally {
        if (isCancelled) return
        setIsLoading(false)
      }
    }

    loadChapter()
    return () => {
      isCancelled = true
    }
  }, [book, bookId, chapterNumber, readingAIMode, reloadTrigger])

  return { ...chapter, isLoading, message }
}
