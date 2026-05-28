import {
  getProvider,
  hasProvider,
  registerProvider,
} from './ai-provider-registry'
import { createOpenAIProvider } from './ai-providers/openai.provider'

/**
 * AI Provider Interface
 */
export interface AIProvider {
  name: string
  processContent(prompt: string, content: string): Promise<string>
}

export type AIProviderType = 'openai'

/**
 * Lấy AI Provider theo type cụ thể
 */
export const getAIProviderByType = (type: AIProviderType): AIProvider => {
  if (!hasProvider(type)) {
    registerProvider('openai', createOpenAIProvider)
  }

  return getProvider(type)
}

// ============ Re-exports for convenience ============

export {
  createOpenAIProvider,
  getOpenAIApiUrl,
  getOpenAIModel,
} from './ai-providers/openai.provider'

// ============ Legacy exports for backward compatibility ============

export const openaiProcessContent = async (
  prompt: string,
  content: string,
): Promise<string> => {
  const provider = createOpenAIProvider()
  return provider.processContent(prompt, content)
}
