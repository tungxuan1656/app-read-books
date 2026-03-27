import { type ReadingAIMode } from '@/@types/common'
import {
  type AppSettings,
  type ReadingState,
  type Typography,
} from '@/@types/settings'

export interface PrefetchState {
  isRunning: boolean
  currentBookId: string | null
  totalChapters: number
  processedChapters: number
  message: string
  errors: string[]
}

export interface TypographyStoreState {
  typography: Typography
}

export interface ReadingStoreState {
  readingAIMode: ReadingAIMode
  reading: ReadingState
}

export interface BooksStoreState {
  bookIds: string[]
  id2Book: Record<string, Book>
  id2BookReadingChapter: Record<string, number>
}

export interface PrefetchStoreState {
  prefetchState: PrefetchState
}

export interface SettingsStoreState {
  settings: AppSettings
}

export interface UIRuntimeStoreState {
  contentReloadToken: number
}
