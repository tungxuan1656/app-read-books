import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { MMKVStorage } from './mmkv'

export type ReadingMode = 'normal' | 'translate' | 'summary'

interface AppState {
  // Font settings
  font: string
  fontSize: number
  lineHeight: number
  setFont: (font: string) => void
  setFontSize: (size: number) => void
  setLineHeight: (height: number) => void

  // Reading mode
  readingMode: ReadingMode
  setReadingMode: (mode: ReadingMode) => void
  cycleReadingMode: () => void

  // TTS state per chapter
  id2ChapterTTSGenerating: Record<string, boolean> // key: `${bookId}_${chapter}`
  setTTSGenerating: (bookId: string, chapter: number, generating: boolean) => void

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
}

const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Font settings
        font: 'Inter-Regular',
        fontSize: 24,
        lineHeight: 1.5,
        setFont: (font: string) => set({ font }),
        setFontSize: (fontSize: number) => set({ fontSize }),
        setLineHeight: (lineHeight: number) => set({ lineHeight }),

        // Reading mode
        readingMode: 'normal',
        setReadingMode: (mode: ReadingMode) => set({ readingMode: mode }),
        cycleReadingMode: () =>
          set((state) => {
            const modes: ReadingMode[] = ['normal', 'translate', 'summary']
            const currentIndex = modes.indexOf(state.readingMode)
            const nextIndex = (currentIndex + 1) % modes.length
            return { readingMode: modes[nextIndex] }
          }),

        // TTS state
        id2ChapterTTSGenerating: {},
        setTTSGenerating: (bookId: string, chapter: number, generating: boolean) =>
          set((state) => ({
            id2ChapterTTSGenerating: {
              ...state.id2ChapterTTSGenerating,
              [`${bookId}_${chapter}`]: generating,
            },
          })),

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
  setFont,
  setFontSize,
  setLineHeight,
  setReadingMode,
  cycleReadingMode,
  setTTSGenerating,
  setPrefetching,
  nextReadingChapter,
  previousReadingChapter,
  setIsEditingBook,
} = useAppStore.getState()

export const storeActions = {
  updateReadingChapter,
  updateBooks,
  setFont,
  setFontSize,
  setLineHeight,
  setReadingMode,
  cycleReadingMode,
  setTTSGenerating,
  setPrefetching,
  nextReadingChapter,
  previousReadingChapter,
  setIsEditingBook,
}

export default useAppStore
