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
const hasLetters = (text: string): boolean => {
  return /[a-zA-ZàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]/.test(text)
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
  html = html.replaceAll('```text', '')

  // 1. Chuyển đổi In Đậm (**bold**)
  // Tìm **nội dung** và thay thế bằng <strong>nội dung</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  // 2. Chuyển đổi In Nghiêng (*italic* hoặc _italic_)
  // Tìm *nội dung* hoặc _nội dung_ và thay thế bằng <em>nội dung</em>
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // 3. Chuyển đổi Xuống dòng thành Thẻ <br> hoặc <p></p>
  // Thay thế hai lần xuống dòng liên tiếp bằng </p><> để tạo đoạn văn mới
  html = html.replace(/\n\n/g, '<br><br>')

  return html
}
