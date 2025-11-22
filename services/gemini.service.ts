import { ContentListUnion, createPartFromUri, GoogleGenAI } from '@google/genai'
import useAppStore from '@/controllers/store'
import { formatContentForTTS } from '@/utils/string.helpers'

// Common configuration for Gemini API
export const getGeminiApiKey = () => useAppStore.getState().settings.GEMINI_API_KEY || ''

export const getGeminiModel = () => {
  const customModel = useAppStore.getState().settings.GEMINI_MODEL
  return customModel && customModel.trim() ? customModel.trim() : 'gemini-2.0-flash-exp'
}

/**
 * Tạo Gemini client instance
 */
const getGeminiClient = () => {
  const apiKey = getGeminiApiKey()

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.length < 30) {
    throw new Error(
      'Gemini API Key chưa được cấu hình. Vui lòng vào Settings để thiết lập API key.',
    )
  }
  return new GoogleGenAI({ apiKey })
}

/**
 * Helper function để chuẩn bị content trước khi gửi cho Gemini
 */
export const prepareContentForGemini = (content: string): string => {
  // Loại bỏ HTML tags để lấy text thuần
  let textContent = content
    .replace(/<[^><]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  textContent = formatContentForTTS(textContent)

  if (!textContent || textContent.length < 50) {
    throw new Error('Nội dung quá ngắn để xử lý')
  }

  return textContent
}

/**
 * Hàm chung để gọi Gemini API với prompt và content sử dụng SDK
 */
export const geminiProcessFile = async (prompt: string, fileContent: string): Promise<string> => {
  try {
    const ai = getGeminiClient()
    const testFile = new Blob([fileContent], { type: 'text/plain' })
    const file = await ai.files.upload({
      file: testFile,
      config: {
        displayName: 'original_content.txt',
      },
    })

    let getFile = await ai.files.get({ name: file.name as string })
    while (getFile.state === 'PROCESSING') {
      getFile = await ai.files.get({ name: file.name as string })
      console.log(`current file status: ${getFile.state}`)
      console.log('File is still processing, retrying in 1 second')

      await new Promise((resolve) => {
        setTimeout(resolve, 1)
      })
    }
    if (file.state === 'FAILED') {
      throw new Error('File processing failed.')
    }

    const content: ContentListUnion = [prompt]
    if (file.uri && file.mimeType) {
      const fileContent = createPartFromUri(file.uri, file.mimeType)
      content.push(fileContent)
    }

    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: content,
    })

    if (!response || !response.text) {
      throw new Error(`Không nhận được response từ Gemini`)
    }
    return response.text
  } catch (e: any) {
    console.error('Gemini error name: ', e.name)
    console.error('Gemini error message: ', e.message)
    console.error('Gemini error status: ', e.status)
    if (e instanceof Error) {
      throw e
    }
    throw new Error(`Có lỗi xảy ra khi gọi Gemini API`)
  }
}

/**
 * Helper function để kiểm tra API key
 */
export const validateGeminiApiKey = (): boolean => {
  const apiKey = getGeminiApiKey()
  return typeof apiKey === 'string' && apiKey !== 'YOUR_GEMINI_API_KEY' && apiKey.length > 30
}
