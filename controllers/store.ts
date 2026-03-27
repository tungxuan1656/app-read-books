import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

import { type ReadingAIMode } from '@/@types/common'
import {
  type AppSettings,
  type ReadingState,
  type Typography,
} from '@/@types/settings'

import { MMKVStorage } from './mmkv'
import {
  APP_STORE_VERSION,
  DEFAULT_SETTINGS,
  migratePersistedSettings,
} from './settings-schema'
import { createSelectors } from './types'

interface PrefetchState {
  isRunning: boolean
  currentBookId: string | null
  totalChapters: number
  processedChapters: number
  message: string
  errors: string[]
}

interface TypographySlice {
  typography: Typography
  setTypography: (typography: Partial<Typography>) => void
}

interface ReadingSlice {
  readingAIMode: ReadingAIMode
  setReadingAIMode: (mode: ReadingAIMode) => void
  reading: ReadingState
  updateReading: (newReading: Partial<ReadingState>) => void
}

interface BooksSlice {
  bookIds: string[]
  id2Book: Record<string, Book>
  id2BookReadingChapter: Record<string, number>
  updateBooks: (books: Book[]) => void
  updateReadingChapter: (bookId: string, chapter: number) => void
  nextReadingChapter: (bookId: string) => void
  previousReadingChapter: (bookId: string) => void
}

interface PrefetchSlice {
  prefetchState: PrefetchState
  updatePrefetchState: (state: Partial<PrefetchState>) => void
}

interface SettingsSlice {
  settings: AppSettings
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void
  updateSettings: (partialSettings: Partial<AppSettings>) => void
}

interface UIRuntimeSlice {
  contentReloadToken: number
  triggerContentReload: () => void
}

export type AppState = TypographySlice &
  ReadingSlice &
  BooksSlice &
  PrefetchSlice &
  SettingsSlice &
  UIRuntimeSlice

const defaultTypography: Typography = {
  font: 'Inter',
  fontSize: 24,
  lineHeight: 1.5,
}

const defaultReading: ReadingState = {
  bookId: '',
  onScreen: false,
  offset: 0,
}

const defaultPrefetchState: PrefetchState = {
  isRunning: false,
  currentBookId: null,
  totalChapters: 0,
  processedChapters: 0,
  message: '',
  errors: [],
}

const initialState: Omit<
  AppState,
  | 'setTypography'
  | 'setReadingAIMode'
  | 'updateReading'
  | 'updateBooks'
  | 'updateReadingChapter'
  | 'nextReadingChapter'
  | 'previousReadingChapter'
  | 'updatePrefetchState'
  | 'updateSetting'
  | 'updateSettings'
  | 'triggerContentReload'
> = {
  typography: defaultTypography,
  readingAIMode: 'none',
  reading: defaultReading,
  bookIds: [],
  id2Book: {},
  id2BookReadingChapter: {},
  prefetchState: defaultPrefetchState,
  settings: DEFAULT_SETTINGS,
  contentReloadToken: 0,
}

const _useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        setTypography: (typography: Partial<Typography>) =>
          set((state) => ({
            typography: {
              ...state.typography,
              ...typography,
            },
          })),

        setReadingAIMode: (mode: ReadingAIMode) => set({ readingAIMode: mode }),

        updateReading: (newReading: Partial<ReadingState>) =>
          set((state) => ({
            reading: {
              ...state.reading,
              ...newReading,
            },
          })),

        updateBooks: (books: Book[]) => {
          const state = get()
          const bookIds = books.map((book) => book.id)
          const id2Book = Object.fromEntries(
            books.map((book) => [book.id, book]),
          )
          const id2BookReadingChapter = Object.fromEntries(
            books.map((book) => [
              book.id,
              state.id2BookReadingChapter[book.id] || 1,
            ]),
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
              [bookId]: Math.max(
                (state.id2BookReadingChapter[bookId] || 1) - 1,
                1,
              ),
            },
          })),

        updatePrefetchState: (newState: Partial<PrefetchState>) =>
          set((state) => ({
            prefetchState: {
              ...state.prefetchState,
              ...newState,
            },
          })),

        updateSetting: <K extends keyof AppSettings>(
          key: K,
          value: AppSettings[K],
        ) =>
          set((state) => ({
            settings: {
              ...state.settings,
              [key]: value,
            },
          })),
        updateSettings: (partialSettings: Partial<AppSettings>) =>
          set((state) => ({
            settings: {
              ...state.settings,
              ...partialSettings,
            },
          })),

        triggerContentReload: () =>
          set((state) => ({
            contentReloadToken: state.contentReloadToken + 1,
          })),
      }),
      {
        name: 'appstore',
        version: APP_STORE_VERSION,
        migrate: (persistedState) => {
          const incoming = (persistedState || {}) as Partial<AppState>

          return {
            ...incoming,
            settings: migratePersistedSettings(incoming.settings),
            prefetchState: defaultPrefetchState,
            contentReloadToken: 0,
          }
        },
        partialize: (state): Partial<AppState> => ({
          typography: state.typography,
          readingAIMode: state.readingAIMode,
          reading: state.reading,
          bookIds: state.bookIds,
          id2Book: state.id2Book,
          id2BookReadingChapter: state.id2BookReadingChapter,
          settings: state.settings,
        }),
        storage: {
          getItem: (name) => MMKVStorage.get(name),
          setItem: (name, value) => MMKVStorage.set(name, value),
          removeItem: (name) => MMKVStorage.remove(name),
        },
      },
    ),
    { name: 'app-store' },
  ),
)

const useAppStore = createSelectors(_useAppStore)

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
  triggerContentReload,
} = _useAppStore.getState()

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
  triggerContentReload,
}

export default useAppStore
