import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

import { type Typography } from '@/@types/settings'
import { MMKVStateStorage } from '@/controllers/mmkv'

import { createSelectors } from './store.helpers'
import { type TypographyStoreState } from './store.types'

const defaultTypography: Typography = {
  font: 'Inter',
  fontSize: 24,
  lineHeight: 1.5,
}

const initialState: TypographyStoreState = {
  typography: defaultTypography,
}

const _useTypographyStore = create<TypographyStoreState>()(
  devtools(
    persist(() => initialState, {
      name: 'typography-storage',
      storage: MMKVStateStorage,
      partialize: (state) => ({
        typography: state.typography,
      }),
    }),
    { name: 'typography-store' },
  ),
)

export const useTypographyStore = createSelectors(_useTypographyStore)

export const typographyActions = {
  setTypography: (typography: Partial<Typography>) =>
    _useTypographyStore.setState((state) => ({
      typography: {
        ...state.typography,
        ...typography,
      },
    })),

  resetTypography: () => _useTypographyStore.setState(initialState),
}
