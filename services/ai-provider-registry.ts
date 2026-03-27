import { logger } from '@/utils/logger'

import type { AIProvider, AIProviderType } from './ai.service'

const registry = new Map<AIProviderType, () => AIProvider>()

export const registerProvider = (
  type: AIProviderType,
  factory: () => AIProvider,
): void => {
  registry.set(type, factory)
}

export const hasProvider = (type: AIProviderType): boolean => {
  return registry.has(type)
}

export const getProvider = (type: AIProviderType): AIProvider => {
  const factory = registry.get(type)
  if (!factory) {
    throw new Error(`AI provider not found: ${type}`)
  }

  try {
    return factory()
  } catch (error) {
    logger.error('AIProviderRegistry', 'Failed to create provider', error)
    throw error
  }
}
