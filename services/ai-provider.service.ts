import useAppStore from '@/controllers/store'

/**
 * AI Provider Interface - đơn giản, dễ hiểu
 */
export interface AIProvider {
  name: string
  processContent(prompt: string, content: string): Promise<string>
}

/**
 * Lấy AI Provider dựa trên settings hiện tại
 * Mỗi lần gọi sẽ đọc settings mới nhất, không cache
 */
export const getAIProvider = (): AIProvider => {
  const provider = useAppStore.getState().settings.TRANSLATE_PROVIDER
  
  if (provider === 'copilot') {
    return createCopilotProvider()
  }
  
  return createGeminiProvider()
}

/**
 * Lấy AI Provider theo type cụ thể
 */
export const getAIProviderByType = (type: 'gemini' | 'copilot'): AIProvider => {
  if (type === 'copilot') {
    return createCopilotProvider()
  }
  return createGeminiProvider()
}

// ============ GEMINI PROVIDER ============

import { ContentListUnion, createPartFromUri, GoogleGenAI } from '@google/genai'

const createGeminiProvider = (): AIProvider => {
  return {
    name: 'Gemini',
    
    async processContent(prompt: string, content: string): Promise<string> {
      const maxRetries = 3
      const keys = parseGeminiApiKeys()
      let lastError: Error | null = null

      for (let attempt = 0; attempt < Math.min(maxRetries, keys.length || 1); attempt++) {
        try {
          const client = getGeminiClient()
          
          // Upload file
          const testFile = new Blob([content], { type: 'text/plain' })
          const file = await client.files.upload({
            file: testFile,
            config: { displayName: 'original_content.txt' },
          })

          // Wait for processing
          let getFile = await client.files.get({ name: file.name as string })
          while (getFile.state === 'PROCESSING') {
            getFile = await client.files.get({ name: file.name as string })
            await new Promise((resolve) => setTimeout(resolve, 100))
          }

          if (file.state === 'FAILED') {
            throw new Error('File processing failed.')
          }

          // Generate content
          const contentParts: ContentListUnion = [prompt]
          if (file.uri && file.mimeType) {
            contentParts.push(createPartFromUri(file.uri, file.mimeType))
          }

          const response = await client.models.generateContent({
            model: getGeminiModel(),
            contents: contentParts,
          })

          if (!response?.text) {
            throw new Error('Không nhận được response từ Gemini')
          }

          return response.text
        } catch (e: any) {
          console.error('Gemini error:', e.message)
          lastError = e instanceof Error ? e : new Error('Có lỗi xảy ra khi gọi Gemini API')

          if (isKeyRotatableError(e) && attempt < Math.min(maxRetries, keys.length) - 1) {
            rotateToNextKey()
            continue
          }
          throw lastError
        }
      }

      throw lastError || new Error('Đã thử tất cả các key nhưng đều thất bại')
    },
  }
}

// Gemini helpers
const parseGeminiApiKeys = (): string[] => {
  const keysString = useAppStore.getState().settings.GEMINI_API_KEY || ''
  return keysString
    .split('\n')
    .map((key) => key.trim())
    .filter((key) => key.length > 30 && key !== 'YOUR_GEMINI_API_KEY')
}

const getGeminiClient = (): GoogleGenAI => {
  const keys = parseGeminiApiKeys()
  if (keys.length === 0) {
    throw new Error('Gemini API Key chưa được cấu hình. Vui lòng vào Settings để thiết lập.')
  }

  let index = useAppStore.getState().settings.GEMINI_API_KEY_INDEX || 0
  if (index >= keys.length) index = 0

  const keyInfo = { current: index + 1, total: keys.length }
  console.log(`Gemini: Using key ${keyInfo.current}/${keyInfo.total}`)

  return new GoogleGenAI({ apiKey: keys[index] })
}

const getGeminiModel = (): string => {
  const model = useAppStore.getState().settings.GEMINI_MODEL
  return model?.trim() || 'gemini-2.0-flash-exp'
}

const rotateToNextKey = (): void => {
  const keys = parseGeminiApiKeys()
  if (keys.length <= 1) return

  const currentIndex = useAppStore.getState().settings.GEMINI_API_KEY_INDEX || 0
  const nextIndex = (currentIndex + 1) % keys.length
  
  // Directly update store
  useAppStore.setState((state) => ({
    settings: { ...state.settings, GEMINI_API_KEY_INDEX: nextIndex },
  }))
  
  console.log(`Gemini: Rotating to key ${nextIndex + 1}/${keys.length}`)
}

const isKeyRotatableError = (error: any): boolean => {
  const message = error?.message?.toLowerCase() || ''
  const status = error?.status
  return (
    status === 429 ||
    status === 403 ||
    message.includes('rate limit') ||
    message.includes('quota') ||
    message.includes('exceeded') ||
    message.includes('resource exhausted')
  )
}

// ============ COPILOT PROVIDER ============

interface CopilotMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const createCopilotProvider = (): AIProvider => {
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

const callCopilotAPI = async (
  messages: CopilotMessage[],
  maxRetries: number = 3,
): Promise<string> => {
  const apiUrl = useAppStore.getState().settings.COPILOT_API_URL?.trim() || 'http://localhost:8317/v1/chat/completions'
  const model = useAppStore.getState().settings.COPILOT_MODEL?.trim() || 'gpt-4.1'

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

// ============ EXPORTS for backward compatibility ============

export const geminiProcessFile = async (prompt: string, content: string): Promise<string> => {
  const provider = createGeminiProvider()
  return provider.processContent(prompt, content)
}

export const copilotProcessContent = async (prompt: string, content: string): Promise<string> => {
  const provider = createCopilotProvider()
  return provider.processContent(prompt, content)
}

export const validateGeminiApiKey = (): boolean => {
  const keys = parseGeminiApiKeys()
  return keys.length > 0
}

export const getKeyInfo = (): { current: number; total: number } => {
  const keys = parseGeminiApiKeys()
  const index = useAppStore.getState().settings.GEMINI_API_KEY_INDEX || 0
  return {
    current: Math.min(index + 1, keys.length),
    total: keys.length,
  }
}
