import useAppStore from './store'

export const defaultOptions: Options = {
  currentBook: '',
  books: {},
}

export const defaultBooks: Book[] = []

// Zustand-based hooks to replace React Context
export const useBookInfo = (bookId: string) => {
  const getBookById = useAppStore((state) => state.getBookById)
  return getBookById(bookId)
}

export const useReading = () => {
  const readingOptions = useAppStore((state) => state.readingOptions)
  return readingOptions
}

// Direct Zustand update instead of event emission
export const setReadingContext = (data: Partial<Options>) => {
  const { updateReadingOptions } = useAppStore.getState()
  updateReadingOptions(data)
}

// Additional helper hooks for books
export const useBooks = () => {
  const books = useAppStore((state) => state.books)
  return books
}

export const useBooksActions = () => {
  const { setBooks, addBook, removeBook } = useAppStore((state) => ({
    setBooks: state.setBooks,
    addBook: state.addBook,
    removeBook: state.removeBook,
  }))
  return { setBooks, addBook, removeBook }
}
