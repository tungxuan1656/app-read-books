import { type AIAction, type AppSettings } from '@/@types/settings'

export const APP_STORE_VERSION = 2

const DEFAULT_AI_ACTIONS: AIAction[] = [
  {
    key: 'translate',
    name: 'Dịch AI',
    prompt: `Bạn là chuyên gia dịch thuật văn học tiếng Việt. Nhiệm vụ: chuyển đổi văn bản từ văn phong dịch máy (Trung-Việt) sang văn phong tiếng Việt tự nhiên, trôi chảy.

Bạn hãy đọc văn bản trong file original_content.txt và dịch theo các bước sau:
- Nội dung trong file là định dạng html, có thể có các thẻ phân đoạn như <p>, <br>, <div>, hãy tách nội dung thành từng đoạn dựa trên các thẻ này.
- Đọc theo từng đoạn để giữ cấu trúc đoạn và dịch đoạn theo 5 nguyên tắc sau:
1. Giữ nguyên 100% các từ xưng hô như: ta, ngươi, hắn, nàng, ngài, huynh, đệ, tỷ, muội lão, bạn, tôi, thầy, sư phụ, sư tổ, cha mẹ, ba mẹ, ông, bà, vợ chồng, v.v.."TA" không thể dịch thành "EM" hoặc "ANH", "NGƯƠI" không thể dịch thành "BẠN", v.v.. (RẤT QUAN TRỌNG, bạn phải giữ nguyên các từ này, không thể lẫn lộn xưng hô khác với nội dung gốc)
2. Thay cấu trúc Hán Việt bằng cấu trúc ngữ pháp tiếng Việt với các thành phần như chủ ngữ, vị ngữ, trạng ngữ,…. (RẤT QUAN TRỌNG, bạn hãy tập trung vào phần này)
3. Giữ nguyên 100% ý nghĩa, chi tiết, cảm xúc
4. Giữ nguyên: tên nhân vật, địa danh, thuật ngữ võ công
5. Không tự ý sáng tạo thêm hoặc cắt bớt nội dung
- Ghép lại các đoạn thành nội dung hoàn chỉnh, theo định dạng html, giữ nguyên các thẻ phân đoạn như trong nội dung gốc.
- Chỉ trả về nội dung truyện, không thêm ý kiến, bình luận của bạn

Bắt đầu dịch file và trả về kết quả`,
  },
  {
    key: 'summary',
    name: 'Tóm tắt AI',
    prompt: `Bạn là dịch thuật truyện chữ Trung Quốc sang tiếng Việt.

Nhiệm vụ: tóm tắt lại nội dung chương truyện trong file original_content.txt theo các yêu cầu sau:

1. Mức độ rút gọn:
   - Rút ngắn nội dung xuống khoảng 50–60% độ dài bản gốc.
   - Chỉ lược bỏ chi tiết thừa, không làm mất mạch truyện và ý chính.

2. Giữ nguyên cốt truyện:
   - Bảo toàn trình tự sự kiện, bối cảnh và diễn biến chính.
   - Giữ lại các tình tiết quan trọng, cao trào, nút thắt, mở nút.
   - Giữ các đoạn hội thoại quan trọng giữa nhân vật (có thể rút ngắn nhưng không làm thay đổi ý).

3. Văn phong & xưng hô:
   - Giữ văn phong truyện dịch Việt Nam, tự nhiên, dễ đọc.
   - Có thể chỉnh câu cho mượt hơn, nhưng không thay đổi nghĩa.
   - Giữ nguyên xưng hô quen thuộc như: Hắn, Nó, Ta, Ngươi, v.v.

4. Lược bỏ:
   - Cắt giảm mô tả cảnh vật dài dòng, cảm xúc lặp lại, thông tin nền không ảnh hưởng trực tiếp đến cốt truyện.
   - Không thêm nội dung mới, không suy diễn thêm ngoài những gì có trong bản gốc.

5. Định dạng đầu ra:
   - Viết lại thành một bản tóm tắt hoàn chỉnh, mạch lạc, theo dạng văn xuôi bình thường.
   - Không giải thích quy trình, chỉ trả về nội dung chương đã được tóm tắt.`,
  },
]

export const DEFAULT_SETTINGS: AppSettings = {
  COPILOT_API_URL: 'http://localhost:8317/v1/chat/completions',
  COPILOT_MODEL: 'gpt-4.1',
  SUPABASE_ANON_KEY: '',
  PREFETCH_COUNT: '3',
  AI_PROVIDER: 'copilot',
  AI_PROCESS_ACTIONS: DEFAULT_AI_ACTIONS,
  COPILOT_MIN_CHUNK_SIZE: '1300',
}

const isAIAction = (value: unknown): value is AIAction => {
  if (!value || typeof value !== 'object') return false
  const target = value as Record<string, unknown>

  return (
    typeof target.key === 'string' &&
    typeof target.name === 'string' &&
    typeof target.prompt === 'string'
  )
}

export const normalizeAIActions = (value: unknown): AIAction[] => {
  if (Array.isArray(value)) {
    const validActions = value.filter(isAIAction)
    return validActions.length > 0
      ? validActions
      : DEFAULT_SETTINGS.AI_PROCESS_ACTIONS
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return normalizeAIActions(parsed)
    } catch {
      return DEFAULT_SETTINGS.AI_PROCESS_ACTIONS
    }
  }

  return DEFAULT_SETTINGS.AI_PROCESS_ACTIONS
}

const toStringValue = (value: unknown, fallback: string): string => {
  if (typeof value === 'string') return value
  return fallback
}

export const sanitizeSettings = (value: unknown): AppSettings => {
  const input = (value || {}) as Partial<Record<keyof AppSettings, unknown>>

  return {
    COPILOT_API_URL: toStringValue(
      input.COPILOT_API_URL,
      DEFAULT_SETTINGS.COPILOT_API_URL,
    ),
    COPILOT_MODEL: toStringValue(
      input.COPILOT_MODEL,
      DEFAULT_SETTINGS.COPILOT_MODEL,
    ),
    SUPABASE_ANON_KEY: toStringValue(
      input.SUPABASE_ANON_KEY,
      DEFAULT_SETTINGS.SUPABASE_ANON_KEY,
    ),
    PREFETCH_COUNT: toStringValue(
      input.PREFETCH_COUNT,
      DEFAULT_SETTINGS.PREFETCH_COUNT,
    ),
    AI_PROVIDER: 'copilot',
    AI_PROCESS_ACTIONS: normalizeAIActions(input.AI_PROCESS_ACTIONS),
    COPILOT_MIN_CHUNK_SIZE: toStringValue(
      input.COPILOT_MIN_CHUNK_SIZE,
      DEFAULT_SETTINGS.COPILOT_MIN_CHUNK_SIZE,
    ),
  }
}

export const migratePersistedSettings = (persisted: unknown): AppSettings => {
  return sanitizeSettings({ ...DEFAULT_SETTINGS, ...(persisted as object) })
}
