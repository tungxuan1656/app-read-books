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

/**
 * Breaks a summary text into shorter, more manageable lines for TTS playback.
 * This function attempts to split by sentences and clauses to create natural pauses.
 */
export const breakSummaryIntoLines = (summary: string): string[] => {
  if (!summary) return []

  // Initial split by newlines
  const arrLines = summary.split('\n').filter((line) => line.trim())

  // First pass: split by periods and handle long lines
  const newArrLines: string[] = []
  for (const line of arrLines) {
    const arr = line.split('.').filter((line) => hasLetters(line))
    for (const item of arr) {
      if (item.length > 100) {
        const arr2 = item.split(': "').filter((line) => hasLetters(line))
        newArrLines.push(arr2[0].trim() + '.')
        for (const item2 of arr2.slice(1)) {
          newArrLines.push('"' + item2.trim() + '.')
        }
      } else {
        newArrLines.push(item.trim() + '.')
      }
    }
  }

  // Second pass: split by commas for very long lines to break them down further
  const newArrLines2: string[] = []
  for (const line of newArrLines) {
    if (line.length > 100 && line.includes(',')) {
      const arr = line.split(',')
      let temp = ''
      for (let i = 0; i < arr.length; i++) {
        if (temp.length > 20) {
          newArrLines2.push(temp.trim())
          temp = ''
        }
        temp += arr[i] + ','
      }
      if (temp.trim()) {
        newArrLines2.push(temp.trim())
      }
    } else {
      newArrLines2.push(line.trim())
    }
  }

  // Filter out any resulting empty lines or lines that are too short to be meaningful
  return newArrLines2.filter((line) => line.trim().length > 5)
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

  // 1. Chuyển đổi In Đậm (**bold**)
  // Tìm **nội dung** và thay thế bằng <strong>nội dung</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  // 2. Chuyển đổi In Nghiêng (*italic* hoặc _italic_)
  // Tìm *nội dung* hoặc _nội dung_ và thay thế bằng <em>nội dung</em>
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // 3. Chuyển đổi Xuống dòng thành Thẻ <br> hoặc <p></p>
  // Thay thế hai lần xuống dòng liên tiếp bằng </p><p> để tạo đoạn văn mới
  html = `<p>${html.replace(/\n\n/g, '<br><br>')}</p>`

  return html
}
