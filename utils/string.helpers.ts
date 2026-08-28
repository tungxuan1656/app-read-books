/**
 * Preprocesses a sentence by removing special characters that might interfere with TTS services.
 */
export const preprocessSentence = (sentence: string): string => {
  return sentence.replace(/["""\\'`\/*<>|~]/g, '')
}

/**
 * Splits a block of text into smaller paragraphs suitable for TTS processing.
 * It splits by newlines and then joins lines into paragraphs of up to 1000 characters.
 */
export const splitContentToParagraph = (content: string): string[] => {
  if (!content) return []

  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .reduce((acc, line) => {
      if (acc.length === 0) {
        return [line]
      }

      const lastParagraph = acc[acc.length - 1]
      // Combine with last paragraph if it doesn't exceed the limit
      if (lastParagraph.length + line.length < 1000) {
        acc[acc.length - 1] = lastParagraph + ' ' + line
      } else {
        // Otherwise, start a new paragraph
        acc.push(line)
      }
      return acc
    }, [] as string[])
}

/**
 * Helper function to check if text contains letters, including Vietnamese characters.
 */
export const hasLetters = (text: string): boolean => {
  return /[a-zA-ZàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]/.test(
    text,
  )
}

function removeDotsAndDashesComma(str: string): string {
  const words = str.split(' ')
  const processedWords = words.map((word) => {
    const res = word.replace(/[.,-]/g, '').replaceAll('·', '')

    if (word.endsWith('.')) return res + '.'
    if (word.endsWith(',')) return res + ','
    return res
  })
  return processedWords.join(' ')
}

export const formatContentForTTS = (content: string): string => {
  let cleanedText = content
    .split('\n')
    .map((line) => removeDotsAndDashesComma(line))
    .map((line) => line.trim())
    .filter((line) => line.trim().length > 1)
    .join('\n')

  return cleanedText
}

export function simpleMdToHtml(md: string) {
  let html = md
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // Preserve logic: if html already has <br>, only normalize double newlines
  // Otherwise handle all newline cases via single guard like cleanProviderResponse does
  const HAS_BR = /<br\s*\/?>/i
  const BR_3_PLUS = /(<br\s*\/?>){3,}/gi

  if (!HAS_BR.test(html) && html.includes('\n')) {
    html = html
      .replace(/\r\n/g, '\n')
      .replace(/\n\s*\n/g, '<br><br>')
      .replace(/\n/g, '<br><br>')
  } else {
    html = html.replace(/\n\n/g, '<br><br>')
  }
  html = html.replace(BR_3_PLUS, '<br><br>')
  return html
}

export const simpleRemoveHtmlSectionFormat = (html: string): string => {
  let cleaned = html
  cleaned = cleaned.replaceAll(/^```(?:html|xml|text|markdown)?\s*\n?/gi, '')
  cleaned = cleaned.replaceAll(/\n?```\s*$/gi, '')

  cleaned = cleaned
    .replaceAll('\n', '<br><br>')
    .split('<br>')
    .map((s) => s.trim())
    .join('<br>')

  cleaned = cleaned.replaceAll(/(<br>){3,}/gi, '<br><br>')

  return cleaned
}
