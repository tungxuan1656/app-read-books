import useAppStore from '@/controllers/store'
import type { AIProvider } from '../ai.service'

/**
 * Copilot Provider Implementation
 * Sử dụng local API tại localhost:8317 (hoặc URL được cấu hình)
 */
export const createCopilotProvider = (): AIProvider => {
  return {
    name: 'Copilot',

    async processContent(prompt: string, content: string): Promise<string> {
      // Adjust prompt for text input (not file)
      const adjustedPrompt = prompt.replace('file original_content.txt', 'nội dung bên dưới')

      // Split content into chunks
      const chunks = splitContentIntoChunks(content)

      // Nếu chỉ có 1 chunk, xử lý bình thường
      if (chunks.length === 1) {
        const messages: CopilotMessage[] = [
          { role: 'system', content: adjustedPrompt },
          { role: 'user', content: `Đây là nội dung cần xử lý:\n\n${content}` },
        ]
        const result = await callCopilotAPI(messages)
        return cleanCopilotResponse(result)
      }

      // Xử lý song song nhiều chunks
      const promises = chunks.map(async (chunk, index) => {
        console.log(`Copilot: Processing chunk ${index + 1}/${chunks.length}`)
        const messages: CopilotMessage[] = [
          { role: 'system', content: adjustedPrompt },
          {
            role: 'user',
            content: `Đây là nội dung cần xử lý (phần ${index + 1}/${chunks.length}):\n\n${chunk}`,
          },
        ]
        const result = await callCopilotAPI(messages)

        return cleanCopilotResponse(result)
      })

      // Đợi tất cả promises hoàn thành và join kết quả
      const results = await Promise.all(promises)
      console.log('Copilot: All chunks processed, joining results')

      const output = cleanCopilotResponse(results.join('<br><br>'))

      return output
    },
  }
}

// ============ Copilot Types ============

interface CopilotMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// ============ Copilot Helpers ============

/**
 * Chia content thành các chunks dựa trên logic thông minh:
 * - Split bằng <br><br>
 * - Nhóm thành số phần tối ưu (10, 5, hoặc 1 phần tùy độ dài)
 * - Nếu mỗi chunk < 1k ký tự, giảm số phần xuống
 */
const splitContentIntoChunks = (content: string): string[] => {
  const SPLIT_KEY = '<br><br>'
  const MIN_CHUNK_SIZE = 1300 // Minimum average size per chunk

  // Split content by key
  const parts = content.split(SPLIT_KEY)

  // Nếu không có gì để split hoặc chỉ có 1 phần
  if (parts.length <= 1) {
    return [content]
  }

  // Hàm helper để nhóm các parts thành số chunks mong muốn
  const groupPartsIntoChunks = (numChunks: number): string[] => {
    const chunks: string[] = []
    const partsPerChunk = Math.ceil(parts.length / numChunks)

    for (let i = 0; i < parts.length; i += partsPerChunk) {
      const chunkParts = parts.slice(i, i + partsPerChunk)
      chunks.push(chunkParts.join(SPLIT_KEY))
    }

    return chunks
  }

  // Thử với 8 chunks
  let chunks = groupPartsIntoChunks(8)
  let avgChunkSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length

  // Nếu chunk quá nhỏ, thử với 5 chunks
  if (avgChunkSize < MIN_CHUNK_SIZE && chunks.length > 5) {
    chunks = groupPartsIntoChunks(5)
    avgChunkSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length
  }

  // Nếu vẫn quá nhỏ, thử với 3 chunks
  if (avgChunkSize < MIN_CHUNK_SIZE && chunks.length > 3) {
    chunks = groupPartsIntoChunks(3)
    avgChunkSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length
  }

  // Nếu vẫn quá nhỏ, thử với 2 chunks
  if (avgChunkSize < MIN_CHUNK_SIZE && chunks.length > 2) {
    chunks = groupPartsIntoChunks(2)
    avgChunkSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length
  }

  // Nếu vẫn quá nhỏ, không chia nữa
  if (avgChunkSize < MIN_CHUNK_SIZE) {
    return [content]
  }

  return chunks
}

export const getCopilotApiUrl = (): string => {
  return (
    useAppStore.getState().settings.COPILOT_API_URL?.trim() ||
    'http://localhost:8317/v1/chat/completions'
  )
}

export const getCopilotModel = (): string => {
  return useAppStore.getState().settings.COPILOT_MODEL?.trim() || 'gpt-4.1'
}

const callCopilotAPI = async (
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Copilot API error (${response.status}): ${errorText}`)
      }

      const data = await response.json()

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Không nhận được response từ Copilot')
      }

      console.log('Copilot: API call successful')
      return data.choices[0].message.content
    } catch (e: any) {
      console.error(`Copilot error (attempt ${attempt + 1}):`, e.message)
      lastError = e instanceof Error ? e : new Error('Có lỗi xảy ra khi gọi Copilot API')

      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }
  }

  throw lastError || new Error('Đã thử tất cả các lần retry nhưng đều thất bại')
}

const cleanCopilotResponse = (response: string): string => {
  let cleaned = response.trim()
  cleaned = cleaned.replace(/^```(?:html|xml|text|markdown)?\s*\n?/gi, '')
  cleaned = cleaned.replace(/\n?```\s*$/gi, '')
  // Replace 3 or more consecutive <br> tags with just 2
  cleaned = cleaned.replace(/(<br>){3,}/gi, '<br><br>')
  return cleaned.trim()
}
