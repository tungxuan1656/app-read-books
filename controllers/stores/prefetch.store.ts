import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import { createSelectors } from './store.helpers'
import { type PrefetchState, type PrefetchStoreState } from './store.types'

const defaultPrefetchState: PrefetchState = {
  isRunning: false,
  currentBookId: null,
  totalChapters: 0,
  processedChapters: 0,
  message: '',
  errors: [],
}

const initialState: PrefetchStoreState = {
  prefetchState: defaultPrefetchState,
}

const _usePrefetchStore = create<PrefetchStoreState>()(
  devtools(() => initialState, { name: 'prefetch-store' }),
)

export const usePrefetchStore = createSelectors(_usePrefetchStore)

export const prefetchActions = {
  updatePrefetchState: (newState: Partial<PrefetchState>) =>
    _usePrefetchStore.setState((state) => ({
      prefetchState: {
        ...state.prefetchState,
        ...newState,
      },
    })),

  resetPrefetchState: () => _usePrefetchStore.setState(initialState),
}
