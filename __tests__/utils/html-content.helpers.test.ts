import { sanitizeAiHtmlContent } from '@/utils/html-content.helpers'

describe('html-content.helpers', () => {
  it('removes html code fences from wrapped response', () => {
    const input = '```html\n<p>Hello</p>\n```'

    expect(sanitizeAiHtmlContent(input)).toBe('<p>Hello</p>')
  })

  it('removes generic fences without language', () => {
    const input = '```\n<div>Hi</div>\n```'

    expect(sanitizeAiHtmlContent(input)).toBe('<div>Hi</div>')
  })

  it('handles extra spaces and blank lines around fences', () => {
    const input = '  ```html\n\n<span>Test</span>\n\n```  '

    expect(sanitizeAiHtmlContent(input)).toBe('<span>Test</span>')
  })

  it('keeps plain html unchanged', () => {
    const input = '<p>Already clean</p>'

    expect(sanitizeAiHtmlContent(input)).toBe('<p>Already clean</p>')
  })

  it('unwraps nested fence layers', () => {
    const input = '```html\n```html\n<p>Nested</p>\n```\n```'

    expect(sanitizeAiHtmlContent(input)).toBe('<p>Nested</p>')
  })
})
