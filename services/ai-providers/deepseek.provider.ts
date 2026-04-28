import { useSettingsStore } from '@/controllers/stores'
import { sanitizeAiHtmlContent } from '@/utils/html-content.helpers'
import { logger } from '@/utils/logger'

import type { AIProvider } from '../ai.service'
import {
  cleanProviderResponse,
  getSharedCustomHeaders,
  getSharedMinChunkSize,
  type ProviderMessage,
  splitContentIntoChunks,
} from './provider-shared'

/**
 * DeepSeek Provider Implementation
 * Sử dụng DeepSeek API (hoặc URL được cấu hình)
 */
export const createDeepSeekProvider = (): AIProvider => {
  return {
    name: 'DeepSeek',

    async processContent(prompt: string, content: string): Promise<string> {
      const adjustedPrompt = prompt.replace(
        'file original_content.txt',
        'nội dung bên dưới',
      )

      const chunks = splitContentIntoChunks(content, getDeepSeekMinChunkSize())

      if (chunks.length === 1) {
        const messages: ProviderMessage[] = [
          { role: 'system', content: adjustedPrompt },
          { role: 'user', content: `Đây là nội dung cần xử lý:\n\n${content}` },
        ]
        const result = await callDeepSeekAPI(messages)
        return result
      }

      const promises = chunks.map(async (chunk, index) => {
        logger.info(
          'DeepSeekProvider',
          `DeepSeek: Processing chunk ${index + 1}/${chunks.length}: ${chunk.length} characters`,
        )
        const messages: ProviderMessage[] = [
          { role: 'system', content: adjustedPrompt },
          {
            role: 'user',
            content: `Đây là nội dung cần xử lý (phần ${index + 1}/${chunks.length}):\n\n${chunk}`,
          },
        ]
        const result = await callDeepSeekAPI(messages)
        return sanitizeAiHtmlContent(result)
      })

      const results = await Promise.all(promises)
      logger.info(
        'DeepSeekProvider',
        'DeepSeek: All chunks processed, joining results',
      )

      return cleanProviderResponse(results.join('<br><br>'))
    },
  }
}

export const getDeepSeekApiUrl = (): string => {
  return (
    useSettingsStore.getState().settings.DEEPSEEK_API_URL?.trim() ||
    'https://api.deepseek.com/v1/chat/completions'
  )
}

export const getDeepSeekModel = (): string => {
  return (
    useSettingsStore.getState().settings.DEEPSEEK_MODEL?.trim() ||
    'deepseek-chat'
  )
}

export const getDeepSeekMinChunkSize = (): number => {
  return getSharedMinChunkSize()
}

export const getDeepSeekCustomHeaders = (): Record<string, string> => {
  return getSharedCustomHeaders('DeepSeekProvider')
}

const callDeepSeekAPI = async (
  messages: ProviderMessage[],
  maxRetries: number = 3,
): Promise<string> => {
  const apiUrl = getDeepSeekApiUrl()
  const model = getDeepSeekModel()
  const customHeaders = getDeepSeekCustomHeaders()

  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      logger.info(
        'DeepSeekProvider',
        `DeepSeek: Calling API (attempt ${attempt + 1}/${maxRetries})`,
      )

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...customHeaders,
        },
        body: JSON.stringify({ model, messages }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`DeepSeek API error (${response.status}): ${errorText}`)
      }

      const data = await response.json()

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Không nhận được response từ DeepSeek')
      }

      logger.info('DeepSeekProvider', 'DeepSeek: API call successful')
      return data.choices[0].message.content
    } catch (error) {
      logger.error(
        'DeepSeekProvider',
        `DeepSeek error (attempt ${attempt + 1})`,
        error,
      )
      lastError =
        error instanceof Error
          ? error
          : new Error('Có lỗi xảy ra khi gọi DeepSeek API')

      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }
  }

  throw lastError || new Error('Đã thử tất cả các lần retry nhưng đều thất bại')
}
