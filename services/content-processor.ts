import { getBookChapterContent } from '@/utils'
import { logger } from '@/utils/logger'
import { simpleMdToHtml } from '@/utils/string.helpers'

import { type AIProviderType, getAIProviderByType } from './ai.service'
import { dbService } from './database.service'

interface ProcessOptions {
  bookId: string
  chapterNumber: number
  actionKey: string
  prompt: string
  aiType?: AIProviderType
}

const pendingRequests = new Map<string, Promise<string>>()

export const processChapterContent = async ({
  bookId,
  chapterNumber,
  actionKey,
  prompt,
  aiType,
}: ProcessOptions): Promise<string> => {
  const requestKey = `${bookId}_ch${chapterNumber}_${actionKey}`

  if (pendingRequests.has(requestKey)) {
    logger.info(actionKey, `Awaiting pending request: ${requestKey}`)
    return pendingRequests.get(requestKey)!
  }

  const promise = (async () => {
    try {
      // 1. Check cache
      const cached = await dbService.getProcessedChapter(
        bookId,
        chapterNumber,
        actionKey,
      )
      if (cached) {
        logger.info(actionKey, `Cache hit: ${bookId}_ch${chapterNumber}`)
        return cached.content
      }

      // 2. Load raw content
      const rawContent = await getBookChapterContent(bookId, chapterNumber)
      if (!rawContent) {
        throw new Error('Không thể tải nội dung chương gốc')
      }

      // 3. Get Provider
      const provider = getAIProviderByType(aiType || 'copilot')
      logger.info(
        actionKey,
        `Using ${provider.name}: ${bookId}_ch${chapterNumber}`,
      )

      // 4. Process with AI
      const processedText = await provider.processContent(prompt, rawContent)
      const htmlContent = simpleMdToHtml(processedText)

      // 5. Save to cache
      await dbService.saveProcessedChapter(
        bookId,
        chapterNumber,
        actionKey,
        htmlContent,
      )
      logger.info(actionKey, `Saved: ${bookId}_ch${chapterNumber}`)

      return htmlContent
    } catch (error) {
      logger.error(actionKey, `Error: ${bookId}_ch${chapterNumber}`, error)
      throw error
    } finally {
      pendingRequests.delete(requestKey)
    }
  })()

  pendingRequests.set(requestKey, promise)
  return promise
}

export const clearProcessedChapter = async (
  bookId: string,
  chapterNumber: number,
  actionKey: string,
) => {
  try {
    await dbService.deleteProcessedChapter(bookId, chapterNumber, actionKey)
    logger.info(actionKey, `Cache cleared: ${bookId}_ch${chapterNumber}`)
  } catch (error) {
    logger.error(actionKey, 'Error clearing cache', error)
  }
}
