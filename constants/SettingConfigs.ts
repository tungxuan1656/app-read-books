export type SettingInputType = 'single' | 'multiline'

export interface SettingConfig {
  key: string
  label: string
  inputType: SettingInputType
  placeholder: string
  description?: string
  defaultValue?: string
  lines?: number // số dòng hiển thị cho multiline input
}

// Danh sách các setting configs mặc định
export const DEFAULT_SETTING_CONFIGS: SettingConfig[] = [
  {
    key: 'GEMINI_API_KEY',
    label: 'Gemini API Key',
    inputType: 'single',
    placeholder: 'Nhập Gemini API Key của bạn',
    description: 'API key để sử dụng Google Gemini AI cho tính năng tóm tắt và dịch truyện',
    lines: 2,
  },
  {
    key: 'GEMINI_MODEL',
    label: 'Gemini Model',
    inputType: 'single',
    placeholder: 'gemini-2.0-flash-exp',
    description: 'Tên model Gemini sử dụng (ví dụ: gemini-2.0-flash-exp, gemini-1.5-flash, gemini-1.5-pro). Để trống sẽ dùng gemini-2.0-flash-exp',
    lines: 1,
  },
  {
    key: 'GEMINI_SUMMARY_PROMPT',
    label: 'Prompt tóm tắt truyện',
    inputType: 'multiline',
    placeholder: 'Prompt tóm tắt truyện, nội dung chapter là {{content}}',
    description:
      'Mẫu prompt để yêu cầu Gemini tóm tắt nội dung. Sử dụng {{content}} để đại diện cho nội dung chương',
    defaultValue: '',
    lines: 8,
  },
  {
    key: 'GEMINI_TRANSLATE_PROMPT',
    label: 'Prompt dịch truyện',
    inputType: 'multiline',
    placeholder: 'Prompt dịch truyện convert sang văn phong tiếng Việt',
    description: 'Mẫu prompt để yêu cầu Gemini dịch và chuyển đổi văn phong sang tiếng Việt',
    defaultValue: '',
    lines: 16,
  },
  {
    key: 'CAPCUT_TOKEN',
    label: 'Capcut TTS Token',
    inputType: 'multiline',
    placeholder: 'Nhập Capcut TTS Token',
    description:
      'Token để sử dụng dịch vụ Text-to-Speech của Capcut. Token này cần được làm mới định kỳ. Lấy từ DevTools khi sử dụng Capcut web.',
    lines: 3,
  },
  {
    key: 'CAPCUT_WS_URL',
    label: 'Capcut WebSocket URL',
    inputType: 'multiline',
    placeholder: 'wss://sami-normal-sg.capcutapi.com/internal/api/v1/ws?device_id=...&iid=...',
    description:
      'WebSocket URL đầy đủ cho Capcut TTS. Lấy từ DevTools khi sử dụng Capcut web. Để trống sẽ dùng URL mặc định.',
    lines: 4,
  },
]
