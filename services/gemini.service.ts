import { ContentListUnion, createPartFromUri, GoogleGenAI } from '@google/genai'
import useAppStore, { storeActions } from '@/controllers/store'
import { formatContentForTTS } from '@/utils/string.helpers'

// Common configuration for Gemini API

/**
 * Parse danh sách API keys từ string (mỗi key một dòng)
 */
export const parseGeminiApiKeys = (): string[] => {
  const keysString = useAppStore.getState().settings.GEMINI_API_KEY || ''
  return keysString
    .split('\n')
    .map((key) => key.trim())
    .filter((key) => key.length > 30 && key !== 'YOUR_GEMINI_API_KEY')
}

/**
 * Lấy index hiện tại của key đang sử dụng
 */
export const getCurrentKeyIndex = (): number => {
  return useAppStore.getState().settings.GEMINI_API_KEY_INDEX || 0
}

/**
 * Lấy API key hiện tại theo index xoay vòng
 */
export const getGeminiApiKey = (): string => {
  const keys = parseGeminiApiKeys()
  if (keys.length === 0) return ''

  let index = getCurrentKeyIndex()
  // Đảm bảo index nằm trong phạm vi
  if (index >= keys.length) {
    index = 0
    storeActions.updateSetting('GEMINI_API_KEY_INDEX', 0)
  }

  return keys[index]
}

/**
 * Chuyển sang key tiếp theo trong danh sách (xoay vòng)
 */
export const rotateToNextKey = (): string | null => {
  const keys = parseGeminiApiKeys()
  if (keys.length <= 1) return null // Không có key khác để xoay

  let currentIndex = getCurrentKeyIndex()
  const nextIndex = (currentIndex + 1) % keys.length
  storeActions.updateSetting('GEMINI_API_KEY_INDEX', nextIndex)

  console.log(`Gemini: Rotating to key ${nextIndex + 1}/${keys.length}`)
  return keys[nextIndex]
}

/**
 * Lấy thông tin về key đang sử dụng
 */
export const getKeyInfo = (): { current: number; total: number } => {
  const keys = parseGeminiApiKeys()
  const index = getCurrentKeyIndex()
  return {
    current: Math.min(index + 1, keys.length),
    total: keys.length,
  }
}

export const getGeminiModel = () => {
  const customModel = useAppStore.getState().settings.GEMINI_MODEL
  return customModel && customModel.trim() ? customModel.trim() : 'gemini-2.0-flash-exp'
}

/**
 * Tạo Gemini client instance
 */
const getGeminiClient = () => {
  const apiKey = getGeminiApiKey()
  const keyInfo = getKeyInfo()

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.length < 30) {
    throw new Error(
      'Gemini API Key chưa được cấu hình. Vui lòng vào Settings để thiết lập API key.',
    )
  }

  console.log(`Gemini: Using key ${keyInfo.current}/${keyInfo.total}`)
  return new GoogleGenAI({ apiKey })
}

/**
 * Helper function để chuẩn bị content trước khi gửi cho Gemini
 */
export const prepareContentForGemini = (content: string): string => {
  // Loại bỏ HTML tags để lấy text thuần
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
 * Kiểm tra xem lỗi có phải là lỗi cần xoay key không (rate limit, quota exceeded)
 */
const isKeyRotatableError = (error: any): boolean => {
  const message = error?.message?.toLowerCase() || ''
  const status = error?.status

  // Các lỗi cần xoay key
  return (
    status === 429 || // Rate limit
    status === 403 || // Forbidden (quota exceeded)
    message.includes('rate limit') ||
    message.includes('quota') ||
    message.includes('exceeded') ||
    message.includes('resource exhausted')
  )
}

/**
 * Hàm chung để gọi Gemini API với prompt và content sử dụng SDK
 * Tự động xoay key khi gặp lỗi rate limit hoặc quota exceeded
 */
export const geminiProcessFile = async (
  prompt: string,
  fileContent: string,
  maxRetries: number = 3,
): Promise<string> => {
  let lastError: Error | null = null
  const totalKeys = parseGeminiApiKeys().length

  for (let attempt = 0; attempt < Math.min(maxRetries, totalKeys); attempt++) {
    try {
      const ai = getGeminiClient()
      const testFile = new Blob([fileContent], { type: 'text/plain' })
      const file = await ai.files.upload({
        file: testFile,
        config: {
          displayName: 'original_content.txt',
        },
      })

      let getFile = await ai.files.get({ name: file.name as string })
      while (getFile.state === 'PROCESSING') {
        getFile = await ai.files.get({ name: file.name as string })
        console.log(`current file status: ${getFile.state}`)
        console.log('File is still processing, retrying in 1 second')

        await new Promise((resolve) => {
          setTimeout(resolve, 1)
        })
      }
      if (file.state === 'FAILED') {
        throw new Error('File processing failed.')
      }

      const content: ContentListUnion = [prompt]
      if (file.uri && file.mimeType) {
        const fileContent = createPartFromUri(file.uri, file.mimeType)
        content.push(fileContent)
      }

      const response = await ai.models.generateContent({
        model: getGeminiModel(),
        contents: content,
      })

      if (!response || !response.text) {
        throw new Error(`Không nhận được response từ Gemini`)
      }
      return response.text
    } catch (e: any) {
      console.error('Gemini error name: ', e.name)
      console.error('Gemini error message: ', e.message)
      console.error('Gemini error status: ', e.status)

      lastError = e instanceof Error ? e : new Error(`Có lỗi xảy ra khi gọi Gemini API`)

      // Kiểm tra nếu là lỗi cần xoay key và còn key khác để thử
      if (isKeyRotatableError(e) && attempt < Math.min(maxRetries, totalKeys) - 1) {
        const nextKey = rotateToNextKey()
        if (nextKey) {
          console.log(`Gemini: Key error, rotating to next key and retrying...`)
          continue
        }
      }

      // Nếu không phải lỗi cần xoay key hoặc đã hết key, throw lỗi
      throw lastError
    }
  }

  throw lastError || new Error(`Đã thử tất cả các key nhưng đều thất bại`)
}

/**
 * Helper function để kiểm tra API key
 */
export const validateGeminiApiKey = (): boolean => {
  const apiKey = getGeminiApiKey()
  return typeof apiKey === 'string' && apiKey !== 'YOUR_GEMINI_API_KEY' && apiKey.length > 30
}
