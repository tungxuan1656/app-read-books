import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import { createSelectors } from './store.helpers'
import { type UIRuntimeStoreState } from './store.types'

const initialState: UIRuntimeStoreState = {
  contentReloadToken: 0,
}

const _useUIRuntimeStore = create<UIRuntimeStoreState>()(
  devtools(() => initialState, { name: 'ui-runtime-store' }),
)

export const useUIRuntimeStore = createSelectors(_useUIRuntimeStore)

export const uiRuntimeActions = {
  triggerContentReload: () =>
    _useUIRuntimeStore.setState((state) => ({
      contentReloadToken: state.contentReloadToken + 1,
    })),

  resetUIRuntime: () => _useUIRuntimeStore.setState(initialState),
}
