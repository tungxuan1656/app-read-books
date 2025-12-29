import { dbService } from './database.service'
import { getBookChapterContent } from '@/utils'
import useAppStore from '@/controllers/store'
import { getAIProviderByType } from './ai.service'
import { simpleMdToHtml, formatContentForTTS } from '@/utils/string.helpers'

/**
 * Service xử lý tóm tắt chương truyện
 * - Luôn sử dụng Gemini (hỗ trợ file upload tốt hơn)
 * - Cache kết quả vào database
 */

const DEFAULT_SUMMARY_PROMPT = `Bạn là dịch thuật truyện chữ Trung Quốc sang tiếng Việt.

Nhiệm vụ: tóm tắt lại nội dung chương truyện trong file original_content.txt theo các yêu cầu sau:

1. Mức độ rút gọn:
   - Rút ngắn nội dung xuống khoảng 50–60% độ dài bản gốc.
   - Chỉ lược bỏ chi tiết thừa, không làm mất mạch truyện và ý chính.

2. Giữ nguyên cốt truyện:
   - Bảo toàn trình tự sự kiện, bối cảnh và diễn biến chính.
   - Giữ lại các tình tiết quan trọng, cao trào, nút thắt, mở nút.
   - Giữ các đoạn hội thoại quan trọng giữa nhân vật (có thể rút ngắn nhưng không làm thay đổi ý).

3. Văn phong & xưng hô:
   - Giữ văn phong truyện dịch Việt Nam, tự nhiên, dễ đọc.
   - Có thể chỉnh câu cho mượt hơn, nhưng không thay đổi nghĩa.
   - Giữ nguyên xưng hô quen thuộc như: Hắn, Nó, Ta, Ngươi, v.v.

4. Lược bỏ:
   - Cắt giảm mô tả cảnh vật dài dòng, cảm xúc lặp lại, thông tin nền không ảnh hưởng trực tiếp đến cốt truyện.
   - Không thêm nội dung mới, không suy diễn thêm ngoài những gì có trong bản gốc.

5. Định dạng đầu ra:
   - Viết lại thành một bản tóm tắt hoàn chỉnh, mạch lạc, theo dạng văn xuôi bình thường.
   - Không giải thích quy trình, chỉ trả về nội dung chương đã được tóm tắt.`

const getSummaryPrompt = (): string => {
  return useAppStore.getState().settings.SUMMARY_PROMPT || DEFAULT_SUMMARY_PROMPT
}

const prepareContent = (content: string): string => {
  let textContent = content
    .replace(/<[^><]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  textContent = formatContentForTTS(textContent)

  if (!textContent || textContent.length < 50) {
    throw new Error('Nội dung quá ngắn để xử lý')
  }

  return textContent
}

const pendingRequests = new Map<string, Promise<string>>()

/**
 * Lấy nội dung đã tóm tắt của chương
 */
export const getSummarizedContent = async (
  bookId: string,
  chapterNumber: number,
): Promise<string> => {
  const requestKey = `${bookId}_ch${chapterNumber}_summary`

  if (pendingRequests.has(requestKey)) {
    console.log(`⏳ [Summary] Awaiting pending request: ${requestKey}`)
    return pendingRequests.get(requestKey)!
  }

  const promise = (async () => {
    try {
      // 1. Check cache
      const cached = await dbService.getProcessedChapter(bookId, chapterNumber, 'summary')
      if (cached) {
        console.log(`✅ [Summary] Cache hit: ${bookId}_ch${chapterNumber}`)
        return cached.content
      }

      // 2. Load raw content
      const rawContent = await getBookChapterContent(bookId, chapterNumber)
      if (!rawContent) {
        throw new Error('Không thể tải nội dung chương gốc')
      }
      const processedContent = prepareContent(rawContent)

      // 3. Luôn dùng Gemini cho summary (file upload tốt hơn)
      const provider = getAIProviderByType('gemini')
      console.log(`✨ [Summary] Using ${provider.name}: ${bookId}_ch${chapterNumber}`)

      // 4. Process với AI
      const prompt = getSummaryPrompt()
      const summarized = await provider.processContent(prompt, processedContent)
      const htmlSummarized = simpleMdToHtml(summarized)

      // 5. Save to cache
      await dbService.saveProcessedChapter(bookId, chapterNumber, 'summary', htmlSummarized)
      console.log(`💾 [Summary] Saved: ${bookId}_ch${chapterNumber}`)

      return htmlSummarized
    } catch (error) {
      console.error(`❌ [Summary] Error: ${bookId}_ch${chapterNumber}`, error)
      return 'Không thể tóm tắt chương truyện này'
    } finally {
      pendingRequests.delete(requestKey)
    }
  })()

  pendingRequests.set(requestKey, promise)
  return promise
}

/**
 * Xóa cache tóm tắt của một chương
 */
export const clearSummaryCache = async (bookId: string, chapterNumber: number) => {
  try {
    await dbService.deleteProcessedChapter(bookId, chapterNumber, 'summary')
    console.log(`🗑️ [Summary] Cache cleared: ${bookId}_ch${chapterNumber}`)
  } catch (error) {
    console.error(`❌ [Summary] Error clearing cache:`, error)
  }
}

/**
 * Xóa toàn bộ cache tóm tắt của một cuốn sách
 */
export const clearBookSummaryCache = async (bookId: string) => {
  console.log(`🗑️ [Summary] Clearing all cache for book: ${bookId}`)
}
