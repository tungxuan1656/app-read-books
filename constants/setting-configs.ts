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

export interface SettingGroup {
  title: string
  configs: SettingConfig[]
}

export const SETTING_GROUPS: SettingGroup[] = [
  {
    title: 'Gemini Config',
    configs: [
      {
        key: 'GEMINI_API_KEY',
        label: 'Gemini API Key',
        placeholder: 'Nhập Gemini API Key của bạn',
        description:
          'API key để sử dụng Google Gemini AI. Hỗ trợ nhập nhiều key (mỗi key một dòng) để xoay vòng tự động khi gặp lỗi rate limit hoặc quota.',
        inputType: 'multiline',
      },
      {
        key: 'GEMINI_MODEL',
        label: 'Gemini Model',
        placeholder: 'gemini-2.0-flash-exp',
        description:
          'Tên model Gemini sử dụng (ví dụ: gemini-2.0-flash-exp, gemini-1.5-flash, gemini-1.5-pro). Để trống sẽ dùng gemini-2.0-flash-exp',
      },
    ],
  },
  {
    title: 'Copilot Config',
    configs: [
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
    ],
  },
  {
    title: 'TTS Config',
    configs: [
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
    ],
  },
  {
    title: 'App Config',
    configs: [
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
    ],
  },
  {
    title: 'AI Process Actions',
    configs: [
      {
        key: 'AI_PROCESS_ACTIONS',
        label: 'AI Actions List',
        placeholder: '[]',
        description:
          'Danh sách các hành động AI (JSON). Mỗi hành động bao gồm: key, name, prompt, preprocess (none/tts), aiProvider (gemini/copilot).',
        inputType: 'multiline',
      },
    ],
  },
]
