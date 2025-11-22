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
  isReading: boolean
  currentReadingOffset: number
  currentBookId: string
  geminiApiKey: string
  geminiModel: string
  geminiSummaryPrompt: string
  geminiTranslatePrompt: string
  capcutToken: string
  capcutWsUrl: string
}

interface AppState {
  //typography
  typography: Typography
  setTypography: (typography: Typography) => void
  // Reading mode
  readingAIMode: ReadingAIMode
  setReadingAIMode: (mode: ReadingAIMode) => void

  // Prefetch status
  isPrefetching: boolean
  setPrefetching: (status: boolean) => void

  // home
  isEditingBook: boolean
  setIsEditingBook: (isEditing: boolean) => void

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
          font: 'Inter-Regular',
          fontSize: 24,
          lineHeight: 1.5,
        },
        setTypography: (typography: Typography) => set({ typography }),
        // Reading mode
        readingAIMode: 'none',
        setReadingAIMode: (mode: ReadingAIMode) => set({ readingAIMode: mode }),

        // Prefetch
        isPrefetching: false,
        setPrefetching: (status: boolean) => set({ isPrefetching: status }),

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

        isEditingBook: false,
        setIsEditingBook: (isEditing: boolean) => set({ isEditingBook: isEditing }),

        // Settings (persisted via MMKV)
        settings: {
          isReading: false,
          currentReadingOffset: 0,
          currentBookId: '',
          geminiApiKey: '',
          geminiModel: '',
          geminiSummaryPrompt: '',
          geminiTranslatePrompt: '',
          capcutToken: '',
          capcutWsUrl: '',
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
  setPrefetching,
  nextReadingChapter,
  previousReadingChapter,
  setIsEditingBook,
  updateSetting,
  updateSettings,
  setTypography,
} = useAppStore.getState()

export const storeActions = {
  updateReadingChapter,
  updateBooks,
  setReadingAIMode,
  setPrefetching,
  nextReadingChapter,
  previousReadingChapter,
  setIsEditingBook,
  updateSetting,
  updateSettings,
  setTypography,
}

export default useAppStore
