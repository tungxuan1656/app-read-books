import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { MMKVStorage } from './mmkv'
import { ReadingAIMode } from '@/@types/common'

interface Typography {
  font: string
  fontSize: number
  lineHeight: number
}

interface Settings {
  GEMINI_API_KEY: string
  GEMINI_API_KEY_INDEX: number
  GEMINI_MODEL: string
  COPILOT_API_URL: string
  COPILOT_MODEL: string
  CAPCUT_TOKEN: string
  CAPCUT_WS_URL: string
  SUPABASE_ANON_KEY: string
  PREFETCH_COUNT: string
  AI_PROVIDER: 'gemini' | 'copilot'
  AI_PROCESS_ACTIONS: string // JSON string of AIAction[]
  COPILOT_MIN_CHUNK_SIZE: string
}

interface Reading {
  bookId: string
  onScreen: boolean
  offset: number
}

interface AppState {
  //typography
  typography: Typography
  setTypography: (typography: Partial<Typography>) => void
  // Reading mode
  readingAIMode: ReadingAIMode
  setReadingAIMode: (mode: ReadingAIMode) => void

  // Prefetch status
  prefetchState: {
    isRunning: boolean
    currentBookId: string | null
    totalChapters: number
    processedChapters: number
    message: string
    errors: string[]
  }
  updatePrefetchState: (state: Partial<AppState['prefetchState']>) => void

  // reading
  reading: Reading
  updateReading: (newReading: Partial<Reading>) => void
  // books
  bookIds: string[]
  id2Book: Record<string, Book>
  id2BookReadingChapter: Record<string, number>
  updateBooks: (books: Book[]) => void
  updateReadingChapter: (bookId: string, chapter: number) => void
  nextReadingChapter: (bookId: string) => void
  previousReadingChapter: (bookId: string) => void

  // Settings (persisted via MMKV)
  settings: Settings
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  updateSettings: (partialSettings: Partial<Settings>) => void
}

const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // typo
        typography: {
          font: 'Inter',
          fontSize: 24,
          lineHeight: 1.5,
        },
        setTypography: (typography: Partial<Typography>) =>
          set((state) => ({
            typography: {
              ...state.typography,
              ...typography,
            },
          })),
        // Reading mode
        readingAIMode: 'none',
        setReadingAIMode: (mode: ReadingAIMode) => set({ readingAIMode: mode }),

        // Prefetch
        prefetchState: {
          isRunning: false,
          currentBookId: null,
          totalChapters: 0,
          processedChapters: 0,
          message: '',
          errors: [],
        },
        updatePrefetchState: (newState: Partial<AppState['prefetchState']>) =>
          set((state) => ({
            prefetchState: {
              ...state.prefetchState,
              ...newState,
            },
          })),

        // reading
        reading: {
          bookId: '',
          onScreen: false,
          offset: 0,
        },
        updateReading: (newReading: Partial<Reading>) =>
          set((state) => ({
            reading: {
              ...state.reading,
              ...newReading,
            },
          })),

        // books
        bookIds: [],
        id2Book: {},
        id2BookReadingChapter: {},
        updateBooks: (books: Book[]) => {
          const state = get()
          const bookIds = books.map((book) => book.id)
          const id2Book = Object.fromEntries(books.map((book) => [book.id, book]))
          const id2BookReadingChapter = Object.fromEntries(
            books.map((book) => [book.id, state.id2BookReadingChapter[book.id] || 1]),
          )
          set({ bookIds, id2Book, id2BookReadingChapter })
        },
        updateReadingChapter: (bookId: string, chapter: number) =>
          set((state) => ({
            id2BookReadingChapter: {
              ...state.id2BookReadingChapter,
              [bookId]: chapter,
            },
          })),
        nextReadingChapter: (bookId: string) =>
          set((state) => ({
            id2BookReadingChapter: {
              ...state.id2BookReadingChapter,
              [bookId]: (state.id2BookReadingChapter[bookId] || 1) + 1,
            },
          })),
        previousReadingChapter: (bookId: string) =>
          set((state) => ({
            id2BookReadingChapter: {
              ...state.id2BookReadingChapter,
              [bookId]: Math.max((state.id2BookReadingChapter[bookId] || 1) - 1, 1),
            },
          })),

        // Settings (persisted via MMKV)
        settings: {
          GEMINI_API_KEY: '',
          GEMINI_API_KEY_INDEX: 0,
          GEMINI_MODEL: 'gemini-2.0-flash-exp',
          COPILOT_API_URL: 'http://localhost:8317/v1/chat/completions',
          COPILOT_MODEL: 'gpt-4.1',
          CAPCUT_TOKEN: '',
          CAPCUT_WS_URL: '',
          SUPABASE_ANON_KEY: '',
          PREFETCH_COUNT: '3',
          AI_PROVIDER: 'gemini',
          AI_PROCESS_ACTIONS: JSON.stringify([
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
          ]),
          COPILOT_MIN_CHUNK_SIZE: '1300',
        },
        updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) =>
          set((state) => ({
            settings: {
              ...state.settings,
              [key]: value,
            },
          })),
        updateSettings: (partialSettings: Partial<Settings>) =>
          set((state) => ({
            settings: {
              ...state.settings,
              ...partialSettings,
            },
          })),
      }),
      {
        name: 'appstore',
        storage: {
          getItem: (name) => MMKVStorage.get(name),
          setItem: (name, value) => MMKVStorage.set(name, value),
          removeItem: (name) => MMKVStorage.remove(name),
        },
      },
    ),
  ),
)

const {
  updateReadingChapter,
  updateBooks,
  setReadingAIMode,
  updatePrefetchState,
  nextReadingChapter,
  previousReadingChapter,
  updateReading,
  updateSetting,
  updateSettings,
  setTypography,
} = useAppStore.getState()

export const storeActions = {
  updateReadingChapter,
  updateBooks,
  setReadingAIMode,
  updatePrefetchState,
  nextReadingChapter,
  previousReadingChapter,
  updateReading,
  updateSetting,
  updateSettings,
  setTypography,
}

export default useAppStore
