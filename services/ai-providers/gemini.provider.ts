import { ContentListUnion, createPartFromUri, GoogleGenAI } from '@google/genai'
import useAppStore from '@/controllers/store'
import type { AIProvider } from '../ai.service'

/**
 * Gemini Provider Implementation
 */
export const createGeminiProvider = (): AIProvider => {
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

// ============ Gemini Helpers ============

export const parseGeminiApiKeys = (): string[] => {
  const keysString = useAppStore.getState().settings.GEMINI_API_KEY || ''
  return keysString
    .split('\n')
    .map((key) => key.trim())
    .filter((key) => key.length > 30 && key !== 'YOUR_GEMINI_API_KEY')
}

export const getGeminiClient = (): GoogleGenAI => {
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

export const getGeminiModel = (): string => {
  const model = useAppStore.getState().settings.GEMINI_MODEL
  return model?.trim() || 'gemini-2.0-flash-exp'
}

export const rotateToNextKey = (): void => {
  const keys = parseGeminiApiKeys()
  if (keys.length <= 1) return

  const currentIndex = useAppStore.getState().settings.GEMINI_API_KEY_INDEX || 0
  const nextIndex = (currentIndex + 1) % keys.length

  useAppStore.setState((state) => ({
    settings: { ...state.settings, GEMINI_API_KEY_INDEX: nextIndex },
  }))

  console.log(`Gemini: Rotating to key ${nextIndex + 1}/${keys.length}`)
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

// ============ Private Helpers ============

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
