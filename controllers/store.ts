import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { MMKVStorage } from './mmkv'

interface AppState {
  // Font settings
  font: string
  fontSize: number
  lineHeight: number
  setFont: (font: string) => void
  setFontSize: (size: number) => void
  setLineHeight: (height: number) => void

  isSummaryMode: boolean
  toggleSummaryMode: () => void

  // Reading context
  readingOptions: Options
  setReadingOptions: (options: Options) => void
  updateReadingOptions: (options: Partial<Options>) => void

  // Books context
  books: Book[]
  setBooks: (books: Book[]) => void
  addBook: (book: Book) => void
  removeBook: (bookId: string) => void
  getBookById: (bookId: string) => Book | null
}

const defaultReadingOptions: Options = {
  currentBook: '',
  books: {},
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

        // Reading context
        readingOptions: defaultReadingOptions,
        setReadingOptions: (options: Options) => set({ readingOptions: options }),
        updateReadingOptions: (options: Partial<Options>) =>
          set((state) => ({
            readingOptions: { ...state.readingOptions, ...options },
          })),

        // Books context
        books: [],
        setBooks: (books: Book[]) => set({ books }),
        addBook: (book: Book) =>
          set((state) => ({
            books: [...state.books.filter((b) => b.id !== book.id), book],
          })),
        removeBook: (bookId: string) =>
          set((state) => ({
            books: state.books.filter((b) => b.id !== bookId),
          })),
        getBookById: (bookId: string) => {
          const state = get()
          return state.books.find((book) => book.id === bookId) || null
        },

        isSummaryMode: false,
        toggleSummaryMode: () => set((state) => ({ isSummaryMode: !state.isSummaryMode })),
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

export default useAppStore
