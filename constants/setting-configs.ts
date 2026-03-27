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
      {
        key: 'COPILOT_MIN_CHUNK_SIZE',
        label: 'Min Chunk Size',
        placeholder: '1300',
        description:
          'Kích thước tối thiểu trung bình của mỗi chunk khi chia nội dung (mặc định 1300 ký tự). Giá trị càng lớn, số chunk càng ít.',
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
          'Danh sách các hành động AI (JSON). Mỗi hành động bao gồm: key, name, prompt.',
        inputType: 'multiline',
      },
    ],
  },
]
