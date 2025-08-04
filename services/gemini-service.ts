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

export const summarizeChapter = async (request: GeminiSummaryRequest): Promise<string> => {
  try {
    // Loại bỏ HTML tags để lấy text thuần
    let textContent = request.chapterHtml
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
Rút ngắn độ dài của chương truyện dưới đây bằng cách lược bỏ những phần không cần thiết, trong khi vẫn giữ nguyên hoàn toàn kết cấu và các yếu tố quan trọng của truyện.

**YÊU CẦU TUYỆT ĐỐI (BẮT BUỘC PHẢI TUÂN THỦ):**
1. Chỉnh sửa các lỗi chính tả sai từ tiếng việt. các từ viết chưa chính xác, ví dụ: n·gười c·hết -> người chết. Đây là yêu cầu rất quan trọng.

2.  ✍️ **GIỮ NGUYÊN 100% HỘI THOẠI:** Tất cả các đoạn hội thoại (văn bản trong dấu ngoặc kép "...") phải được giữ lại y nguyên, không thêm, không bớt, trừ chỉnh sửa chính tả. Đây là yêu cầu quan trọng nhất.

3.  🏗️ **GIỮ NGUYÊN KẾT CẤU:** Phải bảo toàn tuyệt đối trình tự của chương truyện, bao gồm:
    *   Thứ tự các tình tiết, sự kiện.
    *   Dòng chảy của bối cảnh.
    *   Tương tác giữa các nhân vật.

4.  ✂️ **MỤC TIÊU LÀ RÚT GỌN, KHÔNG VIẾT LẠI TRỪ CHỈNH SỬA CHÍNH TẢ:**
    *   **CHỈ LƯỢC BỎ:** Bạn chỉ được phép cắt bỏ những từ ngữ, câu văn mô tả được cho là dư thừa, không ảnh hưởng đến mạch truyện chính.
    *   **KHÔNG VIẾT LẠI:** Tuyệt đối không được diễn giải, tóm tắt hay viết lại câu văn theo văn phong của bạn. Hãy tôn trọng nguyên tác.

**VÍ DỤ VỀ VIỆC LƯỢC BỎ:**
*   **Gốc:** "Bầu trời trong xanh, cao vời vợi, không một gợn mây, và những tia nắng vàng óng ả, ấm áp nhẹ nhàng chiếu xuống con đường đất nhỏ quanh co."
*   **Sau khi rút gọn:** "Nắng vàng chiếu xuống con đường đất nhỏ."

**ĐỘ DÀI MỤC TIÊU:**
Phiên bản sau khi cô đọng nên có độ dài khoảng 50-60% so với bản gốc.

${request.bookTitle ? `**Tên truyện:** ${request.bookTitle}\n` : ''}
**Nội dung chương gốc cần cô đọng:**
${processedContent}

Hãy bắt đầu thực hiện việc cô đọng.

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

// Thêm function để tóm tắt tự động theo độ dài
export const summarizeChapterWithLength = async (
  request: GeminiSummaryRequest,
  targetLength: 'short' | 'medium' | 'long' = 'medium',
): Promise<string> => {
  const lengthConfig = {
    short: { percentage: '20-30%', maxTokens: 1500 },
    medium: { percentage: '40-60%', maxTokens: 3000 },
    long: { percentage: '70-80%', maxTokens: 4096 },
  }

  const config = lengthConfig[targetLength]

  // Modify the original request with length-specific config
  const modifiedRequest = {
    ...request,
    targetPercentage: config.percentage,
  }

  return summarizeChapter(modifiedRequest)
}

// Function để lấy key points từ chapter
export const extractKeyPoints = async (request: GeminiSummaryRequest): Promise<string[]> => {
  try {
    const textContent = request.chapterHtml
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (!textContent || textContent.length < 50) {
      throw new Error('Nội dung chương quá ngắn để trích xuất key points')
    }

    const prompt = `
Hãy trích xuất 5-8 điểm chính quan trọng nhất từ chương truyện sau đây:

${textContent.substring(0, 15000)}

Trả về dưới dạng danh sách JSON array, mỗi item là một string ngắn gọn (không quá 100 ký tự).
Ví dụ: ["Nhân vật A gặp gỡ nhân vật B", "Xảy ra xung đột tại địa điểm X", "Tiết lộ bí mật quan trọng"]
`

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        ...COMMON_GENERATION_CONFIG_BASE,
        maxOutputTokens: 500,
        temperature: 0.1,
      },
      safetySettings: COMMON_SAFETY_SETTINGS,
    }

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: COMMON_HEADERS,
      body: JSON.stringify(requestBody),
    })

    const data = await handleGeminiResponse(response)
    const resultText = parseGeminiResult(data, 'key points extraction')

    try {
      return JSON.parse(resultText)
    } catch {
      // Fallback: parse manually if JSON parsing fails
      return resultText
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .slice(0, 8)
    }
  } catch (error) {
    console.error('Error extracting key points:', error)
    return []
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
  summarizeChapterWithLength,
  extractKeyPoints,
  validateGeminiApiKey,
}
