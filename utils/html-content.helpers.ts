/**
 * Removes markdown code-fence wrappers around AI HTML output.
 * Example:
 * ```html
 * <p>Text</p>
 * ```
 */
export const sanitizeAiHtmlContent = (content: string): string => {
  if (!content) return ''

  let output = content.trim()

  // Some providers may wrap content in multiple fence layers.
  for (let i = 0; i < 3; i += 1) {
    const htmlOpenMatch = /```html\s*/i.exec(output)

    if (htmlOpenMatch) {
      const openStartIndex = htmlOpenMatch.index
      const openEndIndex = openStartIndex + htmlOpenMatch[0].length
      const closeIndex = output.lastIndexOf('```')

      if (closeIndex > openEndIndex) {
        output = output.slice(openEndIndex, closeIndex).trim()
      } else {
        // If only one marker exists, remove it and keep remaining content.
        output = (
          output.slice(0, openStartIndex) + output.slice(openEndIndex)
        ).trim()
      }

      continue
    }

    const firstFenceIndex = output.indexOf('```')
    if (firstFenceIndex === -1) break

    const lastFenceIndex = output.lastIndexOf('```')
    if (lastFenceIndex > firstFenceIndex) {
      output = output.slice(firstFenceIndex + 3, lastFenceIndex).trim()
    } else {
      // If only one marker exists, remove it and keep remaining content.
      output = (
        output.slice(0, firstFenceIndex) + output.slice(firstFenceIndex + 3)
      ).trim()
    }
  }

  return output.trim()
}
