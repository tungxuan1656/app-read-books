import { MMKV } from 'react-native-mmkv'

// Cache storage for summaries
const summaryCache = new MMKV({
  id: 'summary-cache',
  encryptionKey: 'chapter-summaries',
})

// Helper functions for summary cache
const getSummaryCacheKey = (bookId: string, chapterNumber: number): string => {
  return `summary_${bookId}_${chapterNumber}`
}

export const getCachedSummary = (bookId: string, chapterNumber: number): string | null => {
  const cacheKey = getSummaryCacheKey(bookId, chapterNumber)
  return summaryCache.getString(cacheKey) || null
}

export const setCachedSummary = (bookId: string, chapterNumber: number, summary: string): void => {
  const cacheKey = getSummaryCacheKey(bookId, chapterNumber)
  summaryCache.set(cacheKey, summary)
}

export const clearSummaryCache = (): void => {
  summaryCache.clearAll()
}

export const deleteCachedSummary = (bookId: string, chapterNumber: number): void => {
  const cacheKey = getSummaryCacheKey(bookId, chapterNumber)
  summaryCache.delete(cacheKey)
}

export const getSummaryCountForBook = (bookId: string): number => {
  const allKeys = summaryCache.getAllKeys()
  return allKeys.filter((key) => key.startsWith(`summary_${bookId}_`)).length
}

export const clearBookSummaryCache = (bookId: string): void => {
  const allKeys = summaryCache.getAllKeys()
  const bookKeys = allKeys.filter((key) => key.startsWith(`summary_${bookId}_`))
  bookKeys.forEach((key) => summaryCache.delete(key))
}
