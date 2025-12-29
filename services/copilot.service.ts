import useAppStore from '@/controllers/store'
import { formatContentForTTS } from '@/utils/string.helpers'

// Default Copilot API URL
const DEFAULT_COPILOT_API_URL = 'http://localhost:8317/v1/chat/completions'
const DEFAULT_COPILOT_MODEL = 'gpt-4.1'

/**
 * Lấy URL API của Copilot từ settings
 */
export const getCopilotApiUrl = (): string => {
  const customUrl = useAppStore.getState().settings.COPILOT_API_URL
  return customUrl && customUrl.trim() ? customUrl.trim() : DEFAULT_COPILOT_API_URL
}

/**
 * Lấy model của Copilot từ settings
 */
export const getCopilotModel = (): string => {
  const customModel = useAppStore.getState().settings.COPILOT_MODEL
  return customModel && customModel.trim() ? customModel.trim() : DEFAULT_COPILOT_MODEL
}

/**
 * Helper function để chuẩn bị content trước khi gửi cho Copilot
 */
export const prepareContentForCopilot = (content: string): string => {
  // Loại bỏ HTML tags để lấy text thuần (giữ lại cấu trúc đoạn)
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

/**
 * Cắt text dài thành các phần nhỏ hơn để tránh vượt giới hạn token
 * @param text - Text cần cắt
 * @param maxChars - Số ký tự tối đa mỗi phần (mặc định 8000)
 */
export const splitTextIntoChunks = (text: string, maxChars: number = 8000): string[] => {
  if (text.length <= maxChars) {
    return [text]
  }

  const chunks: string[] = []
  let currentIndex = 0

  while (currentIndex < text.length) {
    let endIndex = currentIndex + maxChars

    // Tìm vị trí ngắt tự nhiên (dấu chấm, xuống dòng) gần nhất
    if (endIndex < text.length) {
      const searchText = text.substring(currentIndex, endIndex)
      const lastPeriod = searchText.lastIndexOf('。')
      const lastNewline = searchText.lastIndexOf('\n')
      const lastDot = searchText.lastIndexOf('.')

      const breakPoint = Math.max(lastPeriod, lastNewline, lastDot)
      if (breakPoint > maxChars * 0.5) {
        endIndex = currentIndex + breakPoint + 1
      }
    }

    chunks.push(text.substring(currentIndex, endIndex).trim())
    currentIndex = endIndex
  }

  return chunks.filter((chunk) => chunk.length > 0)
}

interface CopilotMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface CopilotResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Gọi Copilot API với messages
 * @param messages - Danh sách messages gửi đến Copilot
 * @param maxRetries - Số lần retry tối đa khi gặp lỗi
 */
export const copilotChat = async (
  messages: CopilotMessage[],
  maxRetries: number = 3,
): Promise<string> => {
  const apiUrl = getCopilotApiUrl()
  const model = getCopilotModel()

  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Copilot: Calling API (attempt ${attempt + 1}/${maxRetries})`)

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Copilot API error (${response.status}): ${errorText}`)
      }

      const data: CopilotResponse = await response.json()

      if (!data.choices || data.choices.length === 0) {
        throw new Error('Không nhận được response từ Copilot')
      }

      const content = data.choices[0]?.message?.content
      if (!content) {
        throw new Error('Response từ Copilot không có nội dung')
      }

      console.log(`Copilot: API call successful`)
      return content
    } catch (e: any) {
      console.error(`Copilot error (attempt ${attempt + 1}):`, e.message)
      lastError = e instanceof Error ? e : new Error('Có lỗi xảy ra khi gọi Copilot API')

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000
        console.log(`Copilot: Waiting ${waitTime}ms before retry...`)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }
  }

  throw lastError || new Error('Đã thử tất cả các lần retry nhưng đều thất bại')
}

/**
 * Xử lý nội dung với Copilot API
 * @param prompt - Prompt hướng dẫn
 * @param fileContent - Nội dung cần xử lý
 * @param maxRetries - Số lần retry tối đa
 */
export const copilotProcessContent = async (
  prompt: string,
  fileContent: string,
  maxRetries: number = 3,
): Promise<string> => {
  // Xây dựng prompt với nội dung
  // Vì Copilot không hỗ trợ file upload, ta gửi nội dung trực tiếp trong message
  const systemPrompt = prompt.replace('file original_content.txt', 'nội dung bên dưới')

  const messages: CopilotMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: `Đây là nội dung cần xử lý:\n\n${fileContent}`,
    },
  ]

  const result = await copilotChat(messages, maxRetries)

  // Làm sạch kết quả - loại bỏ markdown code block nếu có
  return cleanCopilotResponse(result)
}

/**
 * Làm sạch response từ Copilot (loại bỏ markdown formatting không mong muốn)
 */
export const cleanCopilotResponse = (response: string): string => {
  let cleaned = response.trim()

  // Loại bỏ markdown code blocks (```html, ```xml, ```, etc.)
  cleaned = cleaned.replace(/^```(?:html|xml|text|markdown)?\s*\n?/gi, '')
  cleaned = cleaned.replace(/\n?```\s*$/gi, '')

  // Loại bỏ các ký tự đặc biệt không mong muốn ở đầu/cuối
  cleaned = cleaned.trim()

  return cleaned
}
