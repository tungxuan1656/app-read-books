/**
 * @deprecated This file is kept for backward compatibility
 * Use ai-provider.service.ts instead
 */

export {
  geminiProcessFile,
  validateGeminiApiKey,
  getKeyInfo,
} from './ai-provider.service'

import useAppStore from '@/controllers/store'
import { formatContentForTTS } from '@/utils/string.helpers'

/**
 * Helper function để chuẩn bị content trước khi gửi cho Gemini
 * @deprecated Use directly in your service
 */
export const prepareContentForGemini = (content: string): string => {
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

// Legacy exports for backward compatibility
export const parseGeminiApiKeys = (): string[] => {
  const keysString = useAppStore.getState().settings.GEMINI_API_KEY || ''
  return keysString
    .split('\n')
    .map((key) => key.trim())
    .filter((key) => key.length > 30 && key !== 'YOUR_GEMINI_API_KEY')
}

export const getCurrentKeyIndex = (): number => {
  return useAppStore.getState().settings.GEMINI_API_KEY_INDEX || 0
}

export const getGeminiApiKey = (): string => {
  const keys = parseGeminiApiKeys()
  if (keys.length === 0) return ''

  let index = getCurrentKeyIndex()
  if (index >= keys.length) index = 0

  return keys[index]
}

export const getGeminiModel = () => {
  const customModel = useAppStore.getState().settings.GEMINI_MODEL
  return customModel?.trim() || 'gemini-2.0-flash-exp'
}
