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
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

const COMMON_HEADERS = new Headers()
COMMON_HEADERS.append('Content-Type', 'application/json')

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
    throw new Error(
      `Không nhận được kết quả từ Gemini. Context: ${errorContext}`,
    )
  }

  try {
    return JSON.parse(rawJson)
  } catch (e) {
    console.log(
      `Lỗi khi parse JSON từ Gemini (${errorContext}):`,
      e,
      JSON.stringify(result),
    )
    throw new Error(
      `Gemini trả về văn bản không phải JSON hợp lệ: ${rawJson.substring(0, 200)}...`,
    )
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
    const textContent = request.chapterHtml
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

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
Bạn là một trợ lý tóm tắt truyện chuyên nghiệp. Hãy tóm tắt nội dung chương truyện sau đây bằng tiếng Việt theo yêu cầu:

**YÊU CẦU QUAN TRỌNG:**
1. 🎭 **GIỮ NGUYÊN** các đoạn hội thoại quan trọng, đặc sắc (đặt trong dấu ngoặc kép)
2. 💎 **GIỮ NGUYÊN** các đoạn mô tả hay, cảm xúc sâu sắc, chi tiết đẹp
3. 👥 **GIỮ ĐẦY ĐỦ** tên các nhân vật và mối quan hệ tương tác giữa họ
4. 🎯 **BẢO TOÀN** tinh thần, phong cách và thông điệp của chương gốc
5. 📏 **ĐỘ DÀI** tóm tắt khoảng 40-60% so với bài gốc (không quá ngắn)
6. Chỉnh sửa các từ về đúng tiếng việt, không có từ ngữ bị lỗi chính tả, ví dụ: "c.hết" thành "chết".

**HƯỚNG DẪN CHI TIẾT:**
- Ưu tiên giữ lại các câu thoại có tính cách, thể hiện emotion
- Bảo toàn các đoạn mô tả bối cảnh, không khí quan trọng
- Giữ nguyên tên địa danh, thuật ngữ đặc biệt trong truyện
- Nếu có action scenes, mô tả súc tích nhưng đầy đủ

${request.bookTitle ? `**Tên truyện:** ${request.bookTitle}\n` : ''}
**Nội dung chương:**
${processedContent}

Hãy tạo ra bản tóm tắt chất lượng cao, dễ đọc và hấp dẫn:
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
    console.log('Gemini API response:', JSON.stringify(data, null, 2))
    const summary = parseGeminiResult(data, 'chapter summarization')

    console.log('Summary:', summary)

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
