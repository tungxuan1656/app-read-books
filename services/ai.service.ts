import {
  getProvider,
  hasProvider,
  registerProvider,
} from './ai-provider-registry'
import { createCopilotProvider } from './ai-providers/copilot.provider'

/**
 * AI Provider Interface
 */
export interface AIProvider {
  name: string
  processContent(prompt: string, content: string): Promise<string>
}

export type AIProviderType = 'copilot'

/**
 * Lấy AI Provider theo type cụ thể
 */
export const getAIProviderByType = (type: AIProviderType): AIProvider => {
  if (!hasProvider(type)) {
    registerProvider('copilot', createCopilotProvider)
  }

  return getProvider(type)
}

// ============ Re-exports for convenience ============

// Copilot exports
export {
  createCopilotProvider,
  getCopilotApiUrl,
  getCopilotModel,
} from './ai-providers/copilot.provider'

// ============ Legacy exports for backward compatibility ============

export const copilotProcessContent = async (
  prompt: string,
  content: string,
): Promise<string> => {
  const provider = createCopilotProvider()
  return provider.processContent(prompt, content)
}
