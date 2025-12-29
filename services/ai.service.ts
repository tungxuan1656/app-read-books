import useAppStore from '@/controllers/store'
import { createGeminiProvider } from './ai-providers/gemini.provider'
import { createCopilotProvider } from './ai-providers/copilot.provider'

/**
 * AI Provider Interface
 */
export interface AIProvider {
  name: string
  processContent(prompt: string, content: string): Promise<string>
}

export type AIProviderType = 'gemini' | 'copilot'

/**
 * Lấy AI Provider theo type cụ thể
 */
export const getAIProviderByType = (type: AIProviderType): AIProvider => {
  switch (type) {
    case 'copilot':
      return createCopilotProvider()
    case 'gemini':
    default:
      return createGeminiProvider()
  }
}

// ============ Re-exports for convenience ============

// Gemini exports
export {
  createGeminiProvider,
  parseGeminiApiKeys,
  getGeminiClient,
  getGeminiModel,
  rotateToNextKey,
  validateGeminiApiKey,
  getKeyInfo,
} from './ai-providers/gemini.provider'

// Copilot exports
export {
  createCopilotProvider,
  getCopilotApiUrl,
  getCopilotModel,
} from './ai-providers/copilot.provider'

// ============ Legacy exports for backward compatibility ============

export const geminiProcessFile = async (prompt: string, content: string): Promise<string> => {
  const provider = createGeminiProvider()
  return provider.processContent(prompt, content)
}

export const copilotProcessContent = async (prompt: string, content: string): Promise<string> => {
  const provider = createCopilotProvider()
  return provider.processContent(prompt, content)
}
