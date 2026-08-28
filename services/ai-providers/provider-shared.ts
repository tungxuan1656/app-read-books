import { useSettingsStore } from '@/controllers/stores'
import { logger } from '@/utils/logger'

export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const HAS_BR = /<br\s*\/?>/i
const BR_3_PLUS = /(<br\s*\/?>){3,}/gi
const BR_LEADING = /^(?:<br\s*\/?>\s*)+/gi
const BR_TRAILING = /(?:<br\s*\/?>\s*)+$/gi

export const splitContentIntoChunks = (
  content: string,
  minChunkSize: number,
  maxChunks: number = 10,
): string[] => {
  const splitKey = '<br><br>'

  // Helper: try to split by a delimiter and group into chunks
  // using the same avgChunkSize >= minChunkSize loop as the primary path.
  // Returns null if delimiter not found (parts.length <= 1).
  const tryDelimiter = (delimiter: string | RegExp): string[] | null => {
    const parts = content.split(delimiter as unknown as string)
    if (parts.length <= 1) {
      return null
    }

    const isTerminator =
      typeof delimiter === 'string' && delimiter.startsWith('</')
    const isBrRegex = delimiter instanceof RegExp

    let effectiveParts: string[]
    let joinStr: string
    if (isTerminator) {
      effectiveParts = parts
        .map((p, i) => (i < parts.length - 1 ? p + delimiter : p))
        .filter((p) => p.length > 0)
      joinStr = ''
    } else if (isBrRegex) {
      effectiveParts = parts
      joinStr = '<br>'
    } else {
      effectiveParts = parts
      joinStr = delimiter as string
    }

    const groupPartsIntoChunks = (numChunks: number): string[] => {
      const chunks: string[] = []
      const partsPerChunk = Math.ceil(effectiveParts.length / numChunks)
      for (let i = 0; i < effectiveParts.length; i += partsPerChunk) {
        const chunkParts = effectiveParts.slice(i, i + partsPerChunk)
        // Re-join with delimiter preserved so closing tags / breaks stay intact
        // Terminator delimiters already appended to parts, join with ''.
        // BR regex normalizes to canonical '<br>'.
        chunks.push(chunkParts.join(joinStr))
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
    // Unreachable: loop always returns at numChunks === 1
    throw new Error('unreachable: tryDelimiter loop did not return')
  }

  // 1. Primary delimiter: keep existing behavior for backward compat
  const primaryResult = tryDelimiter(splitKey)
  if (primaryResult) {
    return primaryResult
  }

  // 2. Fallback delimiters: try in order, first that yields >1 parts wins
  // BR variants collapsed to single RegExp to handle mixed "a<br />b<br/>c" in one pass
  const fallbackDelimiters: (string | RegExp)[] = [
    '</p>',
    '</div>',
    '\n\n',
    HAS_BR,
    '\n',
  ]
  for (const delimiter of fallbackDelimiters) {
    const result = tryDelimiter(delimiter)
    if (result) {
      return result
    }
  }

  // 3. Hard length-based chunking (no delimiter found)
  if (content.length <= minChunkSize) {
    return [content]
  }

  // Slice by character length, trying to break at a safe boundary
  // within 150 chars before the ideal cut to avoid mid-word/tag cuts.
  const sliceIntoChunks = (numChunks: number): string[] => {
    const chunks: string[] = []
    const chunkSize = Math.ceil(content.length / numChunks)
    let start = 0

    for (let i = 0; i < numChunks; i++) {
      if (start >= content.length) break

      // Last chunk takes the remainder
      if (i === numChunks - 1) {
        chunks.push(content.slice(start))
        break
      }

      let end = start + chunkSize
      if (end >= content.length) {
        chunks.push(content.slice(start))
        break
      }

      // Search for a safe boundary within 150 chars before the ideal cut
      const windowStart = Math.max(start, end - 150)
      const windowStr = content.slice(windowStart, end)

      // Find last occurrence of each safe boundary candidate
      const candidates: { index: number; length: number }[] = []
      const lastSpace = windowStr.lastIndexOf(' ')
      if (lastSpace !== -1) candidates.push({ index: lastSpace, length: 1 })
      const lastNewline = windowStr.lastIndexOf('\n')
      if (lastNewline !== -1) candidates.push({ index: lastNewline, length: 1 })
      const lastGt = windowStr.lastIndexOf('>')
      if (lastGt !== -1) candidates.push({ index: lastGt, length: 1 })
      const lastDot = windowStr.lastIndexOf('.')
      if (lastDot !== -1) candidates.push({ index: lastDot, length: 1 })
      const lastPClose = windowStr.lastIndexOf('</p>')
      if (lastPClose !== -1) candidates.push({ index: lastPClose, length: 4 })

      if (candidates.length > 0) {
        // Pick the boundary closest to the ideal cut (largest index)
        let best = candidates[0]!
        for (const c of candidates) {
          if (c.index > best.index) best = c
        }
        const safeEnd = windowStart + best.index + best.length
        // Ensure we make progress (avoid zero-length or tiny steps)
        if (safeEnd > start) {
          end = safeEnd
        }
      }

      chunks.push(content.slice(start, end))
      start = end
    }

    return chunks
  }

  for (let numChunks = maxChunks; numChunks >= 1; numChunks--) {
    const chunks = sliceIntoChunks(numChunks)
    if (chunks.length === 0) continue
    const avgChunkSize =
      chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length
    if (avgChunkSize >= minChunkSize || numChunks === 1) {
      return chunks
    }
  }

  // Unreachable: loop always returns at numChunks === 1
  throw new Error('unreachable: splitContentIntoChunks loop did not return')
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

export const getSharedExtraBody = (
  providerTag: string,
): Record<string, unknown> => {
  const rawExtraBody = useSettingsStore
    .getState()
    .settings.AI_EXTRA_BODY?.trim()

  if (!rawExtraBody) {
    return {}
  }

  try {
    const parsed = JSON.parse(rawExtraBody)

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      logger.warn(
        providerTag,
        'Extra body must be a JSON object, skipping extra body',
      )
      return {}
    }

    return parsed as Record<string, unknown>
  } catch (error) {
    logger.warn(
      providerTag,
      'Extra body JSON is invalid, skipping extra body',
      error,
    )
    return {}
  }
}

export const cleanProviderResponse = (response: string): string => {
  let cleaned = response.trim()

  // If no <br> exists, preserve paragraph boundaries from <p>/<div> before stripping.
  // This handles AI responses like "<p>A</p><p>B</p>" which would otherwise become "AB".
  if (!HAS_BR.test(cleaned)) {
    cleaned = cleaned.replace(/<\/p>\s*<p[^>]*>/gi, '<br><br>')
    cleaned = cleaned.replace(/<\/div>\s*<div[^>]*>/gi, '<br><br>')
    cleaned = cleaned.replace(/<\/p>/gi, '<br><br>')
    cleaned = cleaned.replace(/<\/div>/gi, '<br><br>')
    cleaned = cleaned.replace(/<p[^>]*>/gi, '')
    cleaned = cleaned.replace(/<div[^>]*>/gi, '')
  } else {
    cleaned = cleaned.replace(/<\/?div[^>]*>/gi, '')
    cleaned = cleaned.replace(/<\/?p[^>]*>/gi, '')
  }

  // Auto add line spacing when response has line breaks but no visual spacing.
  // Only when no <br> already exists, convert \n to <br><br> for readability.
  if (!HAS_BR.test(cleaned) && cleaned.includes('\n')) {
    cleaned = cleaned
      .replace(/\r\n/g, '\n')
      .replace(/\n\s*\n/g, '<br><br>')
      .replace(/\n/g, '<br><br>')
  }

  // Collapse 3+ consecutive <br> (including variants) to <br><br>
  cleaned = cleaned.replace(BR_3_PLUS, '<br><br>')
  // Remove leading/trailing <br> that may have been introduced from closing tags
  // Intentional: strip leading/trailing <br> introduced from closing tags
  cleaned = cleaned.replace(BR_LEADING, '')
  cleaned = cleaned.replace(BR_TRAILING, '')

  return cleaned.trim()
}
