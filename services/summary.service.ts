import { callGeminiAPI } from './gemini.service'
import { dbService } from './database.service'
import { getBookChapterContent } from '@/utils'
import useAppStore from '@/controllers/store'

/**
 * Service xử lý tóm tắt chương truyện
 * - Kiểm tra database cache trước
 * - Gọi Gemini API nếu chưa có cache
 * - Lưu kết quả vào database nếu thành công
 * - Return fallback message nếu lỗi
 */

const DEFAULT_SUMMARY_PROMPT = `
Bạn là một biên tập viên chuyên nghiệp, thực hiện nhiệm vụ cô đọng lại chương truyện, chuyển đổi câu chữ từ thể loại truyện convert trung quốc sang truyện dịch việt nam.

**NHIỆM VỤ CỐT LÕI:**
Rút ngắn độ dài của chương truyện dưới đây xuống còn **50-60% độ dài bản gốc** bằng cách lược bỏ triệt để các chi tiết, mô tả, hoặc đoạn văn dư thừa, không ảnh hưởng đến mạch truyện chính, trong khi vẫn giữ nguyên hoàn toàn kết cấu và các yếu tố quan trọng của truyện, viết lại câu chữ sao cho nếu là truyện convert thì phải phù hợp với văn phong của truyện dịch việt nam.

**YÊU CẦU BẮT BUỘC:**
1. 🏗️ **GIỮ NGUYÊN KẾT CẤU:**
   - Bảo toàn tuyệt đối trình tự các tình tiết, sự kiện.
   - Giữ nguyên dòng chảy của bối cảnh.
   - Duy trì đầy đủ các tương tác quan trọng giữa các nhân vật, bao gồm cả hội thoại cốt lõi.

2. ✂️ **CHỈ LƯỢC BỎ, GIỮ TỐI ĐA VĂN PHONG:**
   - **Chỉ cắt bỏ:** Loại bỏ các câu văn, đoạn mô tả, hoặc chi tiết không cần thiết (như mô tả cảnh vật, cảm xúc dư thừa, hoặc thông tin nền không liên quan trực tiếp đến mạch truyện).
   - **Giữ tối đa văn phong:** Không chỉnh sửa cách diễn đạt, nhưng có thể thay đổi cấu trúc câu để cô đọng hơn, miễn là vẫn giữ nguyên ý nghĩa và cảm xúc của đoạn văn, có thể dịch câu chữ từ thể loại convert sang văn phong truyện dịch việt nam. Ưu tiên giữ nguyên xưng hô: Hắn, Nó, Ta, Ngươi, v.v. để phù hợp với văn phong truyện dịch việt nam.

3. 🎯 **MỤC TIÊU RÚT GỌN:**
   - Ưu tiên loại bỏ các đoạn văn mô tả dài dòng, thông tin nền không quan trọng, hoặc các chi tiết không ảnh hưởng đến cốt truyện chính (ví dụ: mô tả ngoại cảnh, cảm xúc lặp lại, hoặc thông tin phụ về nhân vật không liên quan trực tiếp).
   - Đảm bảo nội dung sau khi rút gọn vẫn truyền tải đầy đủ các sự kiện chính, tương tác nhân vật, và ý nghĩa cốt lõi của chương.

**VÍ DỤ VỀ VIỆC LƯỢC BỎ:**
- **Gốc:** "Bầu trời trong xanh, cao vời vợi, không một gợn mây, và những tia nắng vàng óng ả, ấm áp nhẹ nhàng chiếu xuống con đường đất nhỏ quanh co."
- **Sau khi rút gọn:** "Nắng vàng chiếu xuống con đường đất nhỏ."

**ĐỘ DÀI MỤC TIÊU:**
- Phiên bản sau khi cô đọng phải đạt độ dài **50-60% so với bản gốc**, không được vượt quá hoặc thấp hơn mức này quá nhiều (ví dụ: không được chỉ rút gọn xuống 85% hoặc ít hơn 50%).
**Nội dung chương gốc cần cô đọng:**
{{content}}

Hãy bắt đầu thực hiện việc cô đọng, đảm bảo loại bỏ triệt để các chi tiết dư thừa và đạt đúng mục tiêu độ dài.

**QUAN TRỌNG**: Trả về kết quả dưới dạng JSON với format sau:
{
  "content": "Nội dung chương truyện đã được cô đọng ở đây..."
}
`

const getSummaryPrompt = () => {
  const savedPrompt = useAppStore.getState().settings.geminiSummaryPrompt
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
    if (!rawContent) {
      throw new Error('Không thể tải nội dung chương gốc')
    }

    // 3. Gọi Gemini API để tóm tắt
    console.log(`✨ [Summary] Summarizing: ${bookId}_ch${chapterNumber}`)
    const prompt = getSummaryPrompt()
    const summarized = await callGeminiAPI(prompt)

    // 4. Lưu vào database
    await dbService.saveProcessedChapter(bookId, chapterNumber, 'summary', summarized)
    console.log(`💾 [Summary] Saved to cache: ${bookId}_ch${chapterNumber}`)

    return summarized
  } catch (error) {
    console.error(`❌ [Summary] Error: ${bookId}_ch${chapterNumber}`, error)
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
