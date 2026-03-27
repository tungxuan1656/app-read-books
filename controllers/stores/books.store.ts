import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

import { MMKVStateStorage } from '@/controllers/mmkv'

import { createSelectors } from './store.helpers'
import { type BooksStoreState } from './store.types'

const initialState: BooksStoreState = {
  bookIds: [],
  id2Book: {},
  id2BookReadingChapter: {},
}

const _useBooksStore = create<BooksStoreState>()(
  devtools(
    persist(() => initialState, {
      name: 'books-storage',
      storage: MMKVStateStorage,
      partialize: (state) => ({
        bookIds: state.bookIds,
        id2Book: state.id2Book,
        id2BookReadingChapter: state.id2BookReadingChapter,
      }),
    }),
    { name: 'books-store' },
  ),
)

export const useBooksStore = createSelectors(_useBooksStore)

export const booksActions = {
  updateBooks: (books: Book[]) => {
    const currentState = _useBooksStore.getState()
    const bookIds = books.map((book) => book.id)
    const id2Book = Object.fromEntries(books.map((book) => [book.id, book]))
    const id2BookReadingChapter = Object.fromEntries(
      books.map((book) => [
        book.id,
        currentState.id2BookReadingChapter[book.id] || 1,
      ]),
    )

    _useBooksStore.setState({ bookIds, id2Book, id2BookReadingChapter })
  },

  updateReadingChapter: (bookId: string, chapter: number) =>
    _useBooksStore.setState((state) => ({
      id2BookReadingChapter: {
        ...state.id2BookReadingChapter,
        [bookId]: chapter,
      },
    })),

  nextReadingChapter: (bookId: string) =>
    _useBooksStore.setState((state) => ({
      id2BookReadingChapter: {
        ...state.id2BookReadingChapter,
        [bookId]: (state.id2BookReadingChapter[bookId] || 1) + 1,
      },
    })),

  previousReadingChapter: (bookId: string) =>
    _useBooksStore.setState((state) => ({
      id2BookReadingChapter: {
        ...state.id2BookReadingChapter,
        [bookId]: Math.max((state.id2BookReadingChapter[bookId] || 1) - 1, 1),
      },
    })),

  resetBooks: () => _useBooksStore.setState(initialState),
}
