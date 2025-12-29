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

      const messages: CopilotMessage[] = [
        { role: 'system', content: adjustedPrompt },
        { role: 'user', content: `Đây là nội dung cần xử lý:\n\n${content}` },
      ]

      const result = await callCopilotAPI(messages)
      return cleanCopilotResponse(result)
    },
  }
}

// ============ Copilot Types ============

interface CopilotMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// ============ Copilot Helpers ============

export const getCopilotApiUrl = (): string => {
  return useAppStore.getState().settings.COPILOT_API_URL?.trim() || 'http://localhost:8317/v1/chat/completions'
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
  return cleaned.trim()
}
