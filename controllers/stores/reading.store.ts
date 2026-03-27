import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

import { type ReadingAIMode } from '@/@types/common'
import { type ReadingState } from '@/@types/settings'
import { MMKVStateStorage } from '@/controllers/mmkv'

import { createSelectors } from './store.helpers'
import { type ReadingStoreState } from './store.types'

const defaultReading: ReadingState = {
  bookId: '',
  onScreen: false,
  offset: 0,
}

const initialState: ReadingStoreState = {
  readingAIMode: 'none',
  reading: defaultReading,
}

const _useReadingStore = create<ReadingStoreState>()(
  devtools(
    persist(() => initialState, {
      name: 'reading-storage',
      storage: MMKVStateStorage,
      partialize: (state) => ({
        readingAIMode: state.readingAIMode,
        reading: state.reading,
      }),
    }),
    { name: 'reading-store' },
  ),
)

export const useReadingStore = createSelectors(_useReadingStore)

export const readingActions = {
  setReadingAIMode: (mode: ReadingAIMode) =>
    _useReadingStore.setState({ readingAIMode: mode }),

  updateReading: (newReading: Partial<ReadingState>) =>
    _useReadingStore.setState((state) => ({
      reading: {
        ...state.reading,
        ...newReading,
      },
    })),

  resetReading: () => _useReadingStore.setState(initialState),
}
