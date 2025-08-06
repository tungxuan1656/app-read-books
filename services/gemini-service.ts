import { formatContentForTTS } from '@/utils/string-helpers'

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
const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyAQGVLSryDfxi4KikDE_3wHy8C-AtgT7rg'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`

const COMMON_HEADERS = new Headers()
COMMON_HEADERS.append('Content-Type', 'application/json')
COMMON_HEADERS.append('x-goog-api-key', GEMINI_API_KEY)

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

    const prompt = `
Bạn là một biên tập viên chuyên nghiệp, thực hiện nhiệm vụ cô đọng lại chương truyện.

**NHIỆM VỤ CỐT LÕI:**
Rút ngắn độ dài của chương truyện dưới đây xuống còn **50-60% độ dài bản gốc** bằng cách lược bỏ triệt để các chi tiết, mô tả, hoặc đoạn văn dư thừa, không ảnh hưởng đến mạch truyện chính, trong khi vẫn giữ nguyên hoàn toàn kết cấu và các yếu tố quan trọng của truyện.

**YÊU CẦU BẮT BUỘC:**
1. 🏗️ **GIỮ NGUYÊN KẾT CẤU:**
   - Bảo toàn tuyệt đối trình tự các tình tiết, sự kiện.
   - Giữ nguyên dòng chảy của bối cảnh.
   - Duy trì đầy đủ các tương tác quan trọng giữa các nhân vật, bao gồm cả hội thoại cốt lõi.

2. ✂️ **CHỈ LƯỢC BỎ, KHÔNG VIẾT LẠI:**
   - **Chỉ cắt bỏ:** Loại bỏ các câu văn, đoạn mô tả, hoặc chi tiết không cần thiết (như mô tả cảnh vật, cảm xúc dư thừa, hoặc thông tin nền không liên quan trực tiếp đến mạch truyện).
   - **Không viết lại:** Tuyệt đối không diễn giải, tóm tắt, hoặc thay đổi văn phong của nguyên tác. Chỉ giữ lại các câu văn gốc, không chỉnh sửa cách diễn đạt.

3. 🎯 **MỤC TIÊU RÚT GỌN:**
   - Ưu tiên loại bỏ các đoạn văn mô tả dài dòng, thông tin nền không quan trọng, hoặc các chi tiết không ảnh hưởng đến cốt truyện chính (ví dụ: mô tả ngoại cảnh, cảm xúc lặp lại, hoặc thông tin phụ về nhân vật không liên quan trực tiếp).
   - Đảm bảo nội dung sau khi rút gọn vẫn truyền tải đầy đủ các sự kiện chính, tương tác nhân vật, và ý nghĩa cốt lõi của chương.

**VÍ DỤ VỀ VIỆC LƯỢC BỎ:**
- **Gốc:** "Bầu trời trong xanh, cao vời vợi, không một gợn mây, và những tia nắng vàng óng ả, ấm áp nhẹ nhàng chiếu xuống con đường đất nhỏ quanh co."
- **Sau khi rút gọn:** "Nắng vàng chiếu xuống con đường đất nhỏ."

**ĐỘ DÀI MỤC TIÊU:**
- Phiên bản sau khi cô đọng phải đạt độ dài **50-60% so với bản gốc**, không được vượt quá hoặc thấp hơn mức này quá nhiều (ví dụ: không được chỉ rút gọn xuống 85% hoặc ít hơn 50%).
**Nội dung chương gốc cần cô đọng:**
${processedContent}

Hãy bắt đầu thực hiện việc cô đọng, đảm bảo loại bỏ triệt để các chi tiết dư thừa và đạt đúng mục tiêu độ dài.

**QUAN TRỌNG**: Trả về kết quả dưới dạng JSON với format sau:
{
  "content": "Nội dung chương truyện đã được cô đọng ở đây..."
}
`

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

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: COMMON_HEADERS,
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

// Helper function để kiểm tra API key
export const validateGeminiApiKey = (): boolean => {
  return (
    typeof GEMINI_API_KEY === 'string' &&
    GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY' &&
    GEMINI_API_KEY.length > 30
  )
}

// Export service object tương tự như trong file tham khảo
export const geminiServices = {
  summarizeChapter,
  validateGeminiApiKey,
}
