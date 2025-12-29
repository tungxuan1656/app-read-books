import { getBookChapterContent } from '@/utils'
import { getTranslatedContent } from './translate.service'
import { getSummarizedContent } from './summary.service'

export type ReadingMode = 'none' | 'translate' | 'summary'

export const getLoadingMessage = (mode: ReadingMode, chapterNumber: number): string => {
  switch (mode) {
    case 'translate':
      return `Đang dịch chương ${chapterNumber}...`
    case 'summary':
      return `Đang tóm tắt chương ${chapterNumber}...`
    default:
      return 'Đang tải nội dung gốc...'
  }
}

export const getReadingContent = async (
  bookId: string,
  chapterNumber: number,
  mode: ReadingMode,
): Promise<string> => {
  switch (mode) {
    case 'translate':
      return await getTranslatedContent(bookId, chapterNumber)
    case 'summary':
      return await getSummarizedContent(bookId, chapterNumber)
    case 'none':
    default:
      const content = await getBookChapterContent(bookId, chapterNumber)
      if (!content) throw new Error('Không thể tải nội dung chương')
      return content
  }
}
