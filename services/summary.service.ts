import { dbService } from './database.service'
import { getBookChapterContent } from '@/utils'
import useAppStore from '@/controllers/store'
import { geminiProcessFile, prepareContentForGemini } from './gemini.service'
import { simpleMdToHtml } from '@/utils/string.helpers'

/**
 * Service xử lý tóm tắt chương truyện
 * - Kiểm tra database cache trước
 * - Gọi Gemini API nếu chưa có cache
 * - Lưu kết quả vào database nếu thành công
 * - Return fallback message nếu lỗi
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

const getSummaryPrompt = () => {
  const savedPrompt = useAppStore.getState().settings.SUMMARY_PROMPT
  return savedPrompt || DEFAULT_SUMMARY_PROMPT
}

/**
 * Lấy nội dung đã tóm tắt của chương
 * @param bookId - ID của sách
 * @param chapterNumber - Số thứ tự chương
 * @returns Nội dung đã tóm tắt hoặc fallback message nếu lỗi
 */
export const getSummarizedContent = async (
  bookId: string,
  chapterNumber: number,
): Promise<string> => {
  try {
    // 1. Kiểm tra cache trong database
    const cached = await dbService.getProcessedChapter(bookId, chapterNumber, 'summary')
    if (cached) {
      console.log(`✅ [Summary] Cache hit: ${bookId}_ch${chapterNumber}`)
      return cached.content
    }

    // 2. Load nội dung gốc
    const rawContent = await getBookChapterContent(bookId, chapterNumber)
    const processedRawContent = prepareContentForGemini(rawContent)
    if (!rawContent) {
      throw new Error('Không thể tải nội dung chương gốc')
    }

    // 3. Gọi Gemini API để tóm tắt
    console.log(`✨ [Summary] Summarizing: ${bookId}_ch${chapterNumber}`)
    const prompt = getSummaryPrompt()
    const summarized = await geminiProcessFile(prompt, processedRawContent)
    const htmlSummarized = simpleMdToHtml(summarized)

    // 4. Lưu vào database
    await dbService.saveProcessedChapter(bookId, chapterNumber, 'summary', htmlSummarized)
    console.log(`💾 [Summary] Saved to cache: ${bookId}_ch${chapterNumber}`)

    return htmlSummarized
  } catch (error) {
    console.error(`❌ [Summary] Error: ${bookId}_ch${chapterNumber}`, error)

    // Return fallback message - KHÔNG lưu vào database
    return 'Không thể tóm tắt chương truyện này'
  }
}

/**
 * Xóa cache tóm tắt của một chương
 */
export const clearSummaryCache = async (bookId: string, chapterNumber: number) => {
  try {
    await dbService.deleteProcessedChapter(bookId, chapterNumber, 'summary')
    console.log(`🗑️ [Summary] Cache cleared: ${bookId}_ch${chapterNumber}`)
  } catch (error) {
    console.error(`❌ [Summary] Error clearing cache: ${bookId}_ch${chapterNumber}`, error)
  }
}

/**
 * Xóa toàn bộ cache tóm tắt của một cuốn sách
 */
export const clearBookSummaryCache = async (bookId: string) => {
  try {
    // Implement trong database.service.ts nếu cần
    console.log(`🗑️ [Summary] Clearing all cache for book: ${bookId}`)
  } catch (error) {
    console.error(`❌ [Summary] Error clearing book cache: ${bookId}`, error)
  }
}
