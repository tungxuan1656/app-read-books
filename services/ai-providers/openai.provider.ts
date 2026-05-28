import { useSettingsStore } from '@/controllers/stores'
import { sanitizeAiHtmlContent } from '@/utils/html-content.helpers'
import { logger } from '@/utils/logger'

import type { AIProvider } from '../ai.service'
import {
  cleanProviderResponse,
  getSharedCustomHeaders,
  getSharedExtraBody,
  getSharedMinChunkSize,
  type ProviderMessage,
  splitContentIntoChunks,
} from './provider-shared'

/**
 * OpenAI Provider Implementation
 * Uses localhost:8317 (or configured URL)
 */
export const createOpenAIProvider = (): AIProvider => {
  return {
    name: 'OpenAI',

    async processContent(prompt: string, content: string): Promise<string> {
      const adjustedPrompt = prompt.replace(
        'file original_content.txt',
        'nội dung bên dưới',
      )

      const chunks = splitContentIntoChunks(content, getOpenAIMinChunkSize())

      if (chunks.length === 1) {
        const messages: ProviderMessage[] = [
          { role: 'system', content: adjustedPrompt },
          { role: 'user', content: `Đây là nội dung cần xử lý:\n\n${content}` },
        ]
        const result = await callOpenAIAPI(messages)
        return result
      }

      const promises = chunks.map(async (chunk, index) => {
        logger.info(
          'OpenAIProvider',
          `OpenAI: Processing chunk ${index + 1}/${chunks.length}: ${chunk.length} characters`,
        )
        const messages: ProviderMessage[] = [
          { role: 'system', content: adjustedPrompt },
          {
            role: 'user',
            content: `Đây là nội dung cần xử lý (phần ${index + 1}/${chunks.length}):\n\n${chunk}`,
          },
        ]
        const result = await callOpenAIAPI(messages)
        return sanitizeAiHtmlContent(result)
      })

      const results = await Promise.all(promises)
      logger.info(
        'OpenAIProvider',
        'OpenAI: All chunks processed, joining results',
      )

      return cleanProviderResponse(results.join('<br><br>'))
    },
  }
}

export const getOpenAIApiUrl = (): string => {
  return (
    useSettingsStore.getState().settings.OPENAI_API_URL?.trim() ||
    'http://localhost:8317/v1/chat/completions'
  )
}

export const getOpenAIModel = (): string => {
  return useSettingsStore.getState().settings.OPENAI_MODEL?.trim() || 'gpt-4.1'
}

export const getOpenAIMinChunkSize = (): number => {
  return getSharedMinChunkSize()
}

export const getOpenAICustomHeaders = (): Record<string, string> => {
  return getSharedCustomHeaders('OpenAIProvider')
}

export const getOpenAIExtraBody = (): Record<string, unknown> => {
  return getSharedExtraBody('OpenAIProvider')
}

const callOpenAIAPI = async (
  messages: ProviderMessage[],
  maxRetries: number = 3,
): Promise<string> => {
  const apiUrl = getOpenAIApiUrl()
  const model = getOpenAIModel()
  const customHeaders = getOpenAICustomHeaders()
  const extraBody = getOpenAIExtraBody()
  console.log('extraBody: ', extraBody)

  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      logger.info(
        'OpenAIProvider',
        `OpenAI: Calling API (attempt ${attempt + 1}/${maxRetries})`,
      )

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...customHeaders,
        },
        body: JSON.stringify({
          model,
          messages,
          ...extraBody,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`)
      }

      const data = await response.json()

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Không nhận được response từ OpenAI')
      }

      logger.info('OpenAIProvider', 'OpenAI: API call successful')
      return data.choices[0].message.content
    } catch (error) {
      logger.error(
        'OpenAIProvider',
        `OpenAI error (attempt ${attempt + 1})`,
        error,
      )
      lastError =
        error instanceof Error
          ? error
          : new Error('Có lỗi xảy ra khi gọi OpenAI API')

      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }
  }

  throw lastError || new Error('Đã thử tất cả các lần retry nhưng đều thất bại')
}
