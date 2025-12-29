import { dbService } from './database.service'
import { getBookChapterContent } from '@/utils'
import { getAIProviderByType, AIProviderType } from './ai.service'
import { simpleMdToHtml } from '@/utils/string.helpers'

interface ProcessOptions {
  bookId: string
  chapterNumber: number
  mode: 'translate' | 'summary'
  prompt: string
  aiType?: AIProviderType
  prepareContent?: (content: string) => string
}

const pendingRequests = new Map<string, Promise<string>>()

export const processChapterContent = async ({
  bookId,
  chapterNumber,
  mode,
  prompt,
  aiType,
  prepareContent,
}: ProcessOptions): Promise<string> => {
  const requestKey = `${bookId}_ch${chapterNumber}_${mode}`

  if (pendingRequests.has(requestKey)) {
    console.log(`⏳ [${mode}] Awaiting pending request: ${requestKey}`)
    return pendingRequests.get(requestKey)!
  }

  const promise = (async () => {
    try {
      // 1. Check cache
      const cached = await dbService.getProcessedChapter(bookId, chapterNumber, mode)
      if (cached) {
        console.log(`✅ [${mode}] Cache hit: ${bookId}_ch${chapterNumber}`)
        return cached.content
      }

      // 2. Load raw content
      const rawContent = await getBookChapterContent(bookId, chapterNumber)
      if (!rawContent) {
        throw new Error('Không thể tải nội dung chương gốc')
      }

      const contentToProcess = prepareContent ? prepareContent(rawContent) : rawContent

      // 3. Get Provider
      const provider = getAIProviderByType(aiType || 'gemini')
      console.log(`🌐 [${mode}] Using ${provider.name}: ${bookId}_ch${chapterNumber}`)

      // 4. Process with AI
      const processedText = await provider.processContent(prompt, contentToProcess)
      const htmlContent = simpleMdToHtml(processedText)

      // 5. Save to cache
      await dbService.saveProcessedChapter(bookId, chapterNumber, mode, htmlContent)
      console.log(`💾 [${mode}] Saved: ${bookId}_ch${chapterNumber}`)

      return htmlContent
    } catch (error) {
      console.error(`❌ [${mode}] Error: ${bookId}_ch${chapterNumber}`, error)
      throw error
    } finally {
      pendingRequests.delete(requestKey)
    }
  })()

  pendingRequests.set(requestKey, promise)
  return promise
}
