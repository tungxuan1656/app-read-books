import { summarizeChapter } from '@/services/gemini-service'
import { getCachedSummary, setCachedSummary } from '@/utils/summary-cache'
import { useCallback } from 'react'
import { Alert } from 'react-native'

export default function useSummary() {
  const startSummary = useCallback(
    async (
      bookId: string | undefined | null,
      chapterNumber: number | undefined | null,
      chapterContent: string | undefined | null,
    ) => {
      if (!bookId || !chapterNumber || !chapterContent) {
        return null
      }
      try {
        let summary = getCachedSummary(bookId, chapterNumber)
        if (summary) {
          return summary
        } else {
          summary = await summarizeChapter(chapterContent)
          setCachedSummary(bookId, chapterNumber, summary)
        }
        return summary
      } catch (error) {
        console.error('📝 [Summary Cache] Error summarizing:', error)
        Alert.alert(
          'Lỗi tóm tắt',
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi tóm tắt chương truyện',
        )
      }

      return null
    },
    [],
  )
  return startSummary
}
