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
  SUMMARY_PROMPT: string
  TRANSLATE_PROMPT: string
  CAPCUT_TOKEN: string
  CAPCUT_WS_URL: string
  SUPABASE_ANON_KEY: string
  PREFETCH_COUNT: string
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
          GEMINI_MODEL: '',
          SUMMARY_PROMPT: '',
          TRANSLATE_PROMPT: '',
          CAPCUT_TOKEN: '',
          CAPCUT_WS_URL: '',
          SUPABASE_ANON_KEY: '',
          PREFETCH_COUNT: '3',
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
