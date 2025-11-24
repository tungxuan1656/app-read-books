import { dbService } from './database.service'
import { getBookChapterContent } from '@/utils'
import useAppStore from '@/controllers/store'
import { geminiProcessFile } from './gemini.service'
import { simpleMdToHtml } from '@/utils/string.helpers'

/**
 * Service xử lý dịch chương truyện
 * - Kiểm tra database cache trước
 * - Gọi Gemini API nếu chưa có cache
 * - Lưu kết quả vào database nếu thành công
 * - Return fallback message nếu lỗi
 */

const DEFAULT_TRANSLATE_PROMPT = `Bạn là chuyên gia dịch thuật văn học tiếng Việt. Nhiệm vụ: chuyển đổi văn bản từ văn phong dịch máy (Trung-Việt) sang văn phong tiếng Việt tự nhiên, trôi chảy.

Bạn hãy đọc văn bản trong file original_content.txt và dịch theo các bước sau:
- Nội dung trong file là định dạng html, có thể có các thẻ phân đoạn như <p>, <br>, <div>, hãy tách nội dung thành từng đoạn dựa trên các thẻ này.
- Đọc theo từng đoạn để giữ cấu trúc đoạn và dịch đoạn theo 5 nguyên tắc sau:
1. Giữ nguyên 100% các từ xưng hô như: ta, ngươi, hắn, nàng, ngài, lão, bạn, tôi, thầy, sư phụ, sư tổ, cha mẹ, ba mẹ, ông, bà, vợ chồng… (RẤT QUAN TRỌNG, bạn phải giữ nguyên các từ này)
2. Thay cấu trúc Hán Việt bằng cấu trúc ngữ pháp tiếng Việt với các thành phần như chủ ngữ, vị ngữ, trạng ngữ,…. (RẤT QUAN TRỌNG, bạn hãy tập trung vào phần này)
3. Giữ nguyên 100% ý nghĩa, chi tiết, cảm xúc
4. Giữ nguyên: tên nhân vật, địa danh, thuật ngữ võ công
5. Không tự ý sáng tạo thêm hoặc cắt bớt nội dung
- Ghép lại các đoạn thành nội dung hoàn chỉnh, theo định dạng html, giữ nguyên các thẻ phân đoạn như trong nội dung gốc.
- Chỉ trả về nội dung truyện, không thêm ý kiến, bình luận của bạn

Bắt đầu dịch file và trả về kết quả`

const getTranslatePrompt = () => {
  const savedPrompt = useAppStore.getState().settings.TRANSLATE_PROMPT
  return savedPrompt || DEFAULT_TRANSLATE_PROMPT
}

const pendingRequests = new Map<string, Promise<string>>()

/**
 * Lấy nội dung đã dịch của chương
 * @param bookId - ID của sách
 * @param chapterNumber - Số thứ tự chương
 * @returns Nội dung đã dịch hoặc fallback message nếu lỗi
 */
export const getTranslatedContent = async (
  bookId: string,
  chapterNumber: number,
): Promise<string> => {
  const requestKey = `${bookId}_ch${chapterNumber}_translate`

  // 0. Check pending requests
  if (pendingRequests.has(requestKey)) {
    console.log(`⏳ [Translate] Awaiting pending request: ${requestKey}`)
    return pendingRequests.get(requestKey)!
  }

  const promise = (async () => {
    try {
      // 1. Kiểm tra cache trong database
      const cached = await dbService.getProcessedChapter(bookId, chapterNumber, 'translate')
      if (cached) {
        console.log(`✅ [Translate] Cache hit: ${bookId}_ch${chapterNumber}`)
        return cached.content
      }

      // 2. Load nội dung gốc
      const rawContent = await getBookChapterContent(bookId, chapterNumber)
      if (!rawContent) {
        throw new Error('Không thể tải nội dung chương gốc')
      }

      // 3. Gọi Gemini API để dịch
      console.log(`🌐 [Translate] Translating: ${bookId}_ch${chapterNumber}`)
      const prompt = getTranslatePrompt()
      const translated = await geminiProcessFile(prompt, rawContent)
      const htmlTranslated = simpleMdToHtml(translated)

      // 4. Lưu vào database
      await dbService.saveProcessedChapter(bookId, chapterNumber, 'translate', htmlTranslated)
      console.log(`💾 [Translate] Saved to cache: ${bookId}_ch${chapterNumber}`)

      return htmlTranslated
    } catch (error) {
      console.error(`❌ [Translate] Error: ${bookId}_ch${chapterNumber}`, error)

      // Return fallback message - KHÔNG lưu vào database
      return 'Không thể dịch chương truyện này'
    } finally {
      pendingRequests.delete(requestKey)
    }
  })()

  pendingRequests.set(requestKey, promise)
  return promise
}

/**
 * Xóa cache dịch của một chương
 */
export const clearTranslateCache = async (bookId: string, chapterNumber: number) => {
  try {
    await dbService.deleteProcessedChapter(bookId, chapterNumber, 'translate')
    console.log(`🗑️ [Translate] Cache cleared: ${bookId}_ch${chapterNumber}`)
  } catch (error) {
    console.error(`❌ [Translate] Error clearing cache: ${bookId}_ch${chapterNumber}`, error)
  }
}

/**
 * Xóa toàn bộ cache dịch của một cuốn sách
 */
export const clearBookTranslateCache = async (bookId: string) => {
  try {
    // Implement trong database.service.ts nếu cần
    console.log(`🗑️ [Translate] Clearing all cache for book: ${bookId}`)
  } catch (error) {
    console.error(`❌ [Translate] Error clearing book cache: ${bookId}`, error)
  }
}
