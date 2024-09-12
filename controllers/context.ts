import { EventKeys } from '@/constants'
import { createContext, useContext } from 'react'
import { DeviceEventEmitter } from 'react-native'

export const defaultOptions: Options = {
  currentBook: '',
  books: {},
}

export const defaultBooks: Book[] = []

export const ReadingContext = createContext(defaultOptions)
export const BooksContext = createContext(defaultBooks)

export const useBookInfo = (bookId: string) => {
  const books = useContext(BooksContext)
  for (let index = 0; index < books.length; index++) {
    const book = books[index]
    if (book.id === bookId) return book
  }

  return null
}

export const useReading = () => {
  const reading = useContext(ReadingContext)
  return reading
}

export const setReadingContext = (data: Options) => {
  DeviceEventEmitter.emit(EventKeys.SET_READING_CONTEXT, data)
}
