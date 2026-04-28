import { type AppSettings } from '@/@types/settings'

export type SettingInputType = 'single' | 'multiline' | 'picker'

export interface SettingOption {
  label: string
  value: string
}

export interface SettingConfig {
  key: keyof AppSettings
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
    title: 'AI Provider',
    configs: [
      {
        key: 'AI_PROVIDER',
        label: 'AI Provider',
        placeholder: 'copilot',
        description: 'Chọn provider AI dùng để xử lý nội dung',
        inputType: 'picker',
        options: [
          { label: 'Copilot', value: 'copilot' },
          { label: 'DeepSeek', value: 'deepseek' },
        ],
      },
    ],
  },
  {
    title: 'Shared AI Config',
    configs: [
      {
        key: 'AI_CUSTOM_HEADERS',
        label: 'AI Custom Headers',
        placeholder: '{"Authorization":"Bearer <token>"}',
        description:
          'Headers dùng chung cho mọi AI provider ở dạng JSON object string. Ví dụ: {"X-Trace-Id":"abc","Authorization":"Bearer token"}',
        inputType: 'multiline',
      },
      {
        key: 'AI_MIN_CHUNK_SIZE',
        label: 'Min Chunk Size',
        placeholder: '1300',
        description:
          'Kích thước tối thiểu trung bình của mỗi chunk khi chia nội dung (mặc định 1300 ký tự). Giá trị càng lớn, số chunk càng ít.',
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
        description:
          'Tên model Copilot sử dụng (ví dụ: gpt-4.1, gpt-4o). Để trống sẽ dùng gpt-4.1',
      },
    ],
  },
  {
    title: 'DeepSeek Config',
    configs: [
      {
        key: 'DEEPSEEK_API_URL',
        label: 'DeepSeek API URL',
        placeholder: 'https://api.deepseek.com/v1/chat/completions',
        description:
          'URL API của DeepSeek. Để trống sẽ dùng https://api.deepseek.com/v1/chat/completions',
      },
      {
        key: 'DEEPSEEK_MODEL',
        label: 'DeepSeek Model',
        placeholder: 'deepseek-chat',
        description:
          'Tên model DeepSeek sử dụng (ví dụ: deepseek-chat, deepseek-reasoner). Để trống sẽ dùng deepseek-chat',
      },
    ],
  },
  {
    title: 'App Config',
    configs: [
      {
        key: 'BOOKS_API_URL',
        label: 'Books API URL',
        placeholder:
          'https://iqtndkcyrsmptlrepaks.supabase.co/functions/v1/get-exported-books',
        description: 'URL API để tải danh sách truyện export.',
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
          'Danh sách các hành động AI (JSON). Mỗi hành động bao gồm: key, name, prompt.',
        inputType: 'multiline',
      },
    ],
  },
]
