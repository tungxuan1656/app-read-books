import { useSettingsStore } from '@/controllers/stores'
import { logger } from '@/utils/logger'

export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export const splitContentIntoChunks = (
  content: string,
  minChunkSize: number,
  maxChunks: number = 10,
): string[] => {
  const splitKey = '<br><br>'
  const parts = content.split(splitKey)

  if (parts.length <= 1) {
    return [content]
  }

  const groupPartsIntoChunks = (numChunks: number): string[] => {
    const chunks: string[] = []
    const partsPerChunk = Math.ceil(parts.length / numChunks)

    for (let i = 0; i < parts.length; i += partsPerChunk) {
      const chunkParts = parts.slice(i, i + partsPerChunk)
      chunks.push(chunkParts.join(splitKey))
    }

    return chunks
  }

  for (let numChunks = maxChunks; numChunks >= 1; numChunks--) {
    const chunks = groupPartsIntoChunks(numChunks)
    const avgChunkSize =
      chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length

    if (avgChunkSize >= minChunkSize || numChunks === 1) {
      return chunks
    }
  }

  return [content]
}

export const getSharedMinChunkSize = (): number => {
  const value = useSettingsStore.getState().settings.AI_MIN_CHUNK_SIZE?.trim()
  const parsed = value ? parseInt(value, 10) : NaN
  return !isNaN(parsed) && parsed > 0 ? parsed : 1300
}

export const getSharedCustomHeaders = (
  providerTag: string,
): Record<string, string> => {
  const rawHeaders = useSettingsStore
    .getState()
    .settings.AI_CUSTOM_HEADERS?.trim()

  if (!rawHeaders) {
    return {}
  }

  try {
    const parsed = JSON.parse(rawHeaders)

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      logger.warn(
        providerTag,
        'Custom headers must be a JSON object, skipping custom headers',
      )
      return {}
    }

    return Object.entries(parsed as Record<string, unknown>).reduce<
      Record<string, string>
    >((acc, [key, value]) => {
      const normalizedKey = key.trim()
      if (!normalizedKey || value === null || value === undefined) {
        return acc
      }
      acc[normalizedKey] = String(value)
      return acc
    }, {})
  } catch (error) {
    logger.warn(
      providerTag,
      'Custom headers JSON is invalid, skipping custom headers',
      error,
    )
    return {}
  }
}

export const cleanProviderResponse = (response: string): string => {
  let cleaned = response.trim()
  cleaned = cleaned.replace(/<\/?div[^>]*>/gi, '')
  cleaned = cleaned.replace(/<\/?p[^>]*>/gi, '')
  cleaned = cleaned.replace(/(<br>){3,}/gi, '<br><br>')
  return cleaned.trim()
}
