/// <reference types="jest" />

import { sanitizeAiHtmlContent } from '@/utils/html-content.helpers'

describe('html-content.helpers', () => {
  it('removes html code fences from wrapped response', () => {
    const input = '1231234456 ```html\n<p>Hello</p>\n```'

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

  it('removes unmatched leading html fence marker', () => {
    const input = '```html\n<p>Unclosed fence</p>'

    expect(sanitizeAiHtmlContent(input)).toBe('<p>Unclosed fence</p>')
  })

  it('removes unmatched trailing generic fence marker', () => {
    const input = '<p>Unopened fence</p>\n```'

    expect(sanitizeAiHtmlContent(input)).toBe('<p>Unopened fence</p>')
  })

  it('extracts content between html fence markers and drops outside text', () => {
    const input = '123455```html vip pro```4567'

    expect(sanitizeAiHtmlContent(input)).toBe('vip pro')
  })

  it('removes unmatched generic opening fence marker', () => {
    const input = 'abc```def'

    expect(sanitizeAiHtmlContent(input)).toBe('abcdef')
  })
})
