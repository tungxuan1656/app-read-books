export type SettingInputType = 'single' | 'multiline' | 'picker'

export interface SettingOption {
  label: string
  value: string
}

export interface SettingConfig {
  key: string
  label: string
  placeholder: string
  description?: string
  inputType?: SettingInputType
  options?: SettingOption[] // Dùng cho picker
}

// Danh sách các setting configs mặc định
export const DEFAULT_SETTING_CONFIGS: SettingConfig[] = [
  {
    key: 'GEMINI_API_KEY',
    label: 'Gemini API Key',
    placeholder: 'Nhập Gemini API Key của bạn',
    description:
      'API key để sử dụng Google Gemini AI. Hỗ trợ nhập nhiều key (mỗi key một dòng) để xoay vòng tự động khi gặp lỗi rate limit hoặc quota.',
  },
  {
    key: 'GEMINI_MODEL',
    label: 'Gemini Model',
    placeholder: 'gemini-2.0-flash-exp',
    description:
      'Tên model Gemini sử dụng (ví dụ: gemini-2.0-flash-exp, gemini-1.5-flash, gemini-1.5-pro). Để trống sẽ dùng gemini-2.0-flash-exp',
  },
  {
    key: 'COPILOT_API_URL',
    label: 'Copilot API URL',
    placeholder: 'http://localhost:8317/v1/chat/completions',
    description:
      'URL API của Copilot local server. Để trống sẽ dùng http://localhost:8317/v1/chat/completions',
  },
  {
    key: 'COPILOT_MODEL',
    label: 'Copilot Model',
    placeholder: 'gpt-4.1',
    description: 'Tên model Copilot sử dụng (ví dụ: gpt-4.1, gpt-4o). Để trống sẽ dùng gpt-4.1',
  },
  {
    key: 'SUMMARY_PROMPT',
    label: 'Prompt tóm tắt truyện',
    placeholder: 'Prompt tóm tắt truyện, nội dung chapter là {{content}}',
    description:
      'Mẫu prompt để yêu cầu Gemini tóm tắt nội dung. Sử dụng {{content}} để đại diện cho nội dung chương',
  },
  {
    key: 'TRANSLATE_PROMPT',
    label: 'Prompt dịch truyện',
    placeholder: 'Prompt dịch truyện convert sang văn phong tiếng Việt',
    description: 'Mẫu prompt để yêu cầu AI dịch và chuyển đổi văn phong sang tiếng Việt',
  },
  {
    key: 'TRANSLATE_PROVIDER',
    label: 'Provider dịch truyện',
    placeholder: 'Chọn provider',
    description: 'Chọn AI provider để dịch truyện. Gemini sử dụng API key, Copilot sử dụng local server.',
    inputType: 'picker',
    options: [
      { label: 'Gemini (Google AI)', value: 'gemini' },
      { label: 'Copilot (Local)', value: 'copilot' },
    ],
  },
  {
    key: 'CAPCUT_TOKEN',
    label: 'Capcut TTS Token',
    placeholder: 'Nhập Capcut TTS Token',
    description:
      'Token để sử dụng dịch vụ Text-to-Speech của Capcut. Token này cần được làm mới định kỳ. Lấy từ DevTools khi sử dụng Capcut web.',
  },
  {
    key: 'CAPCUT_WS_URL',
    label: 'Capcut WebSocket URL',
    placeholder: 'wss://sami-normal-sg.capcutapi.com/internal/api/v1/ws?device_id=...&iid=...',
    description:
      'WebSocket URL đầy đủ cho Capcut TTS. Lấy từ DevTools khi sử dụng Capcut web. Để trống sẽ dùng URL mặc định.',
  },
  {
    key: 'SUPABASE_ANON_KEY',
    label: 'Supabase Anon Key',
    placeholder: 'Nhập Supabase Anon Key',
    description: 'Khóa ẩn danh để kết nối với Supabase',
  },
  {
    key: 'PREFETCH_COUNT',
    label: 'Số chương tải trước',
    placeholder: '3',
    description: 'Số chương sẽ được tự động tải trước khi đọc (mặc định 3)',
  },
]
