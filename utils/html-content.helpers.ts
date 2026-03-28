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
    const match = output.match(
      /^\s*```(?:html|xml|markdown|md|text)?\s*\n?([\s\S]*?)\n?```\s*$/i,
    )
    if (!match) break
    output = match[1].trim()
  }

  // Fallback cleanup for partially malformed fences.
  output = output.replace(/^\s*```(?:html|xml|markdown|md|text)?\s*\n?/i, '')
  output = output.replace(/\n?\s*```\s*$/i, '')

  return output.trim()
}
