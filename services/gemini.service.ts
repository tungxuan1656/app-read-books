import { MMKVKeys } from '@/constants'
import useAppStore from '@/controllers/store'
import { formatContentForTTS } from '@/utils/string.helpers'

export interface GeminiSummaryRequest {
  chapterHtml: string
  bookTitle?: string
}

export interface GeminiSummaryResponse {
  summary: string
  keyDialogues: string[]
  mainPoints: string[]
}

// Common configuration for Gemini API
const getGeminiApiKey = () => useAppStore.getState().settings.geminiApiKey || ''
const getGeminiModel = () => {
  const customModel = useAppStore.getState().settings.geminiModel
  return customModel && customModel.trim() ? customModel.trim() : 'gemini-2.5-flash-lite'
}
const getGeminiApiUrl = () => {
  const model = getGeminiModel()
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
}

const getCommonHeaders = () => {
  const COMMON_HEADERS = new Headers()
  COMMON_HEADERS.append('Content-Type', 'application/json')
  COMMON_HEADERS.append('x-goog-api-key', getGeminiApiKey())
  return COMMON_HEADERS
}

// Default prompts
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
Input: "Nhưng là lúc này tràng bên trong lại không hài hoà"
Output: "Nhưng ở hiện trường lúc này lại không hài hoà"

Input: "Một tên quần áo lộng lẫy lại sắc mặt âm tàn thanh niên chính giơ chân lên giẫm tại một tên khất cái mặt bên trên"
Output: "Một thanh niên mặc quần áo lộng lẫy, sắc mặt âm tàn, đang giơ chân giẫm lên mặt của một người ăn mày"

Input: "Hắn mắt nhìn chằm chằm cái phía trước không xa dương liễu, trong con mắt lộ ra cái khí tức quyết liệt."
Output: "Hắn chằm chằm nhìn vào hàng dương liễu không xa phía trước, ánh mắt lộ ra khí tức quyết liệt."

Hãy chuyển đổi văn bản sau sang văn phong tiếng Việt tự nhiên:`

const getTranslatePrompt = () => {
  const savedPrompt = useAppStore.getState().settings.geminiTranslatePrompt
  return savedPrompt || DEFAULT_TRANSLATE_PROMPT
}

const getPrompt = () => {
  const savedPrompt = useAppStore.getState().settings.geminiSummaryPrompt
  if (!!savedPrompt) {
    return savedPrompt
  }

  return `
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
}

const COMMON_SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
]

const COMMON_GENERATION_CONFIG_BASE = {
  temperature: 0.2,
  topK: 32,
  topP: 1,
  maxOutputTokens: 8096,
}

// Helper functions
const handleGeminiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
    throw new Error(
      `Gemini API Error ${response.status}: ${errorData.error?.message || 'Unknown error'}`,
    )
  }
  return response.json()
}

const parseGeminiResult = (result: any, errorContext: string) => {
  const contentParts = result.candidates?.[0]?.content?.parts
  let rawJson = null

  if (contentParts && contentParts.length > 0) {
    rawJson = contentParts[0].text
  }

  if (!rawJson) {
    throw new Error(`Không nhận được kết quả từ Gemini. Context: ${errorContext}`)
  }

  try {
    return JSON.parse(rawJson)
  } catch (e) {
    console.log(`Lỗi khi parse JSON từ Gemini (${errorContext}):`, e, JSON.stringify(result))
    throw new Error(`Gemini trả về văn bản không phải JSON hợp lệ: ${rawJson.substring(0, 200)}...`)
  }
}

export const CONTENT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    content: {
      type: 'STRING',
      description: 'Nội dung văn bản đã được xử lý từ HTML',
      nullable: true,
    },
  },
  required: ['content'],
}

export const summarizeChapter = async (content: string): Promise<string> => {
  try {
    // Validate API key trước khi gọi
    const apiKey = getGeminiApiKey()
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.length < 30) {
      throw new Error('Gemini API Key chưa được cấu hình. Vui lòng vào Settings để thiết lập API key.')
    }

    // Loại bỏ HTML tags để lấy text thuần
    let textContent = content
      .replace(/<[^><]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    textContent = formatContentForTTS(textContent)

    if (!textContent || textContent.length < 50) {
      throw new Error('Nội dung chương quá ngắn để tóm tắt')
    }

    // Giới hạn độ dài input để tránh vượt quá token limit
    const maxInputLength = 30000 // ~7500 tokens
    const processedContent =
      textContent.length > maxInputLength
        ? textContent.substring(0, maxInputLength) + '...'
        : textContent

    const prompt = getPrompt().replace('{{content}}', processedContent)

    const raw = JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        ...COMMON_GENERATION_CONFIG_BASE,
        responseSchema: CONTENT_SCHEMA,
        responseMimeType: 'application/json',
        maxOutputTokens: 8096,
      },
      safetySettings: COMMON_SAFETY_SETTINGS,
    })

    const response = await fetch(getGeminiApiUrl(), {
      method: 'POST',
      headers: getCommonHeaders(),
      body: raw,
      redirect: 'follow',
    })

    const data = await handleGeminiResponse(response)
    const result = parseGeminiResult(data, 'chapter summarization')
    const summary = result.content || result // Fallback nếu không có field content

    if (!summary || summary.length === 0) {
      throw new Error('Gemini API trả về nội dung trống')
    }

    return summary
  } catch (error) {
    console.error('Error in summarizeChapter:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Có lỗi xảy ra khi tóm tắt chương truyện')
  }
}

export const translateChapter = async (content: string): Promise<string> => {
  try {
    // Validate API key trước khi gọi
    const apiKey = getGeminiApiKey()
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.length < 30) {
      throw new Error('Gemini API Key chưa được cấu hình. Vui lòng vào Settings để thiết lập API key.')
    }

    // Loại bỏ HTML tags để lấy text thuần
    let textContent = content.replace(/<[^><]*>/g, ' ').replace(/\s+/g, ' ').trim()

    textContent = formatContentForTTS(textContent)

    if (!textContent || textContent.length < 50) {
      throw new Error('Nội dung chương quá ngắn để dịch')
    }

    // Giới hạn độ dài input
    const maxInputLength = 30000
    const processedContent =
      textContent.length > maxInputLength
        ? textContent.substring(0, maxInputLength) + '...'
        : textContent

    const prompt = getTranslatePrompt() + '\n\n' + processedContent

    const raw = JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        ...COMMON_GENERATION_CONFIG_BASE,
        responseSchema: CONTENT_SCHEMA,
        responseMimeType: 'application/json',
        maxOutputTokens: 8096,
      },
      safetySettings: COMMON_SAFETY_SETTINGS,
    })

    const response = await fetch(getGeminiApiUrl(), {
      method: 'POST',
      headers: getCommonHeaders(),
      body: raw,
      redirect: 'follow',
    })

    const data = await handleGeminiResponse(response)
    const result = parseGeminiResult(data, 'chapter translation')
    const translated = result.content || result

    if (!translated || translated.length === 0) {
      throw new Error('Gemini API trả về nội dung trống')
    }

    return translated
  } catch (error) {
    console.error('Error in translateChapter:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Có lỗi xảy ra khi dịch chương truyện')
  }
}

// Helper function để kiểm tra API key
export const validateGeminiApiKey = (): boolean => {
  const apiKey = getGeminiApiKey()
  return (
    typeof apiKey === 'string' &&
    apiKey !== 'YOUR_GEMINI_API_KEY' &&
    apiKey.length > 30
  )
}

// Export service object tương tự như trong file tham khảo
export const geminiServices = {
  summarizeChapter,
  translateChapter,
  validateGeminiApiKey,
}
