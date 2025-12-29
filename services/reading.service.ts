import { getBookChapterContent } from '@/utils'
import { processChapterContent } from './content-processor'
import { getActionByKey } from './ai-actions.service'

export const getLoadingMessage = (actionKey: string, chapterNumber: number): string => {
  if (actionKey === 'none') return 'Đang tải nội dung gốc...'

  const action = getActionByKey(actionKey)
  if (action) {
    return `Đang xử lý: ${action.name} (Chương ${chapterNumber})...`
  }
  return `Đang xử lý chương ${chapterNumber}...`
}

export const getReadingContent = async (
  bookId: string,
  chapterNumber: number,
  actionKey: string,
): Promise<string> => {
  if (actionKey === 'none') {
    const content = await getBookChapterContent(bookId, chapterNumber)
    if (!content) throw new Error('Không thể tải nội dung chương')
    return content
  }

  const action = getActionByKey(actionKey)
  if (!action) {
    throw new Error(`Không tìm thấy hành động AI: ${actionKey}`)
  }

  return await processChapterContent({
    bookId,
    chapterNumber,
    actionKey: action.key,
    prompt: action.prompt,
    aiType: action.aiProvider,
  })
}
