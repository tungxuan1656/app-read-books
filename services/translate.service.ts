import { dbService } from './database.service'
import { getBookChapterContent } from '@/utils'
import useAppStore from '@/controllers/store'
import { geminiProcessFile, prepareContentForGemini } from './gemini.service'
import { simpleMdToHtml } from '@/utils/string.helpers'

/**
 * Service xử lý dịch chương truyện
 * - Kiểm tra database cache trước
 * - Gọi Gemini API nếu chưa có cache
 * - Lưu kết quả vào database nếu thành công
 * - Return fallback message nếu lỗi
 */

const DEFAULT_TRANSLATE_PROMPT = `Bạn là chuyên gia dịch thuật văn học tiếng Việt. Nhiệm vụ: chuyển đổi văn bản từ văn phong dịch máy (Trung-Việt) sang văn phong tiếng Việt tự nhiên, trôi chảy.

NGUYÊN TẮC:
1. Giữ nguyên 100% ý nghĩa, chi tiết, cảm xúc của nội dung gốc
2. Sắp xếp lại từ ngữ theo ngữ pháp tiếng Việt chuẩn
3. Thay cấu trúc Hán Việt bằng cấu trúc hiện đại, dễ hiểu
4. Loại bỏ từ thừa, lặp từ không cần thiết
5. Giữ nguyên: tên nhân vật, địa danh, thuật ngữ võ công
6. Không thêm hoặc bớt nội dung
7. Không tóm tắt

VÍ DỤ CHUYỂN ĐỔI:
Input: "Một tên quần áo lộng lẫy lại sắc mặt âm tàn thanh niên chính giơ chân lên giẫm tại một tên khất cái mặt bên trên"
Output: "Một thanh niên mặc quần áo lộng lẫy, sắc mặt âm tàn, đang giơ chân giẫm lên mặt của một người ăn mày"

Input: "Hắn mắt nhìn chằm chằm cái phía trước không xa dương liễu, trong con mắt lộ ra cái khí tức quyết liệt."
Output: "Hắn chằm chằm nhìn vào hàng dương liễu không xa phía trước, ánh mắt lộ ra khí tức quyết liệt."

Hãy chuyển đổi văn bản trong file original_content.txt theo các nguyên tắc trên.`

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
      const processedRawContent = prepareContentForGemini(rawContent)

      // 3. Gọi Gemini API để dịch
      console.log(`🌐 [Translate] Translating: ${bookId}_ch${chapterNumber}`)
      const prompt = getTranslatePrompt()
      const translated = await geminiProcessFile(prompt, processedRawContent)
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
