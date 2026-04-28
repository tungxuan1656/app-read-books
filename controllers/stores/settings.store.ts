import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

import { type AppSettings } from '@/@types/settings'
import {
  APP_STORE_VERSION,
  DEFAULT_SETTINGS,
  migratePersistedSettings,
} from '@/controllers/settings-schema'

import { MMKVStateStorage } from '../mmkv'
import { createSelectors } from './store.helpers'
import { type SettingsStoreState } from './store.types'

const initialState: SettingsStoreState = {
  settings: DEFAULT_SETTINGS,
  networkLoggerEnabled: false,
}

const _useSettingsStore = create<SettingsStoreState>()(
  devtools(
    persist(() => initialState, {
      name: 'settings-storage',
      version: APP_STORE_VERSION,
      storage: MMKVStateStorage,
      merge: (persistedState, currentState) => {
        const incoming = (persistedState || {}) as Partial<SettingsStoreState>

        return {
          ...currentState,
          ...incoming,
          settings: migratePersistedSettings(
            incoming.settings ?? currentState.settings,
          ),
        }
      },
      migrate: (persistedState) => {
        const incoming = (persistedState || {}) as Partial<SettingsStoreState>

        return {
          ...incoming,
          settings: migratePersistedSettings(incoming.settings),
        }
      },
      partialize: (state) => ({
        settings: state.settings,
        networkLoggerEnabled: state.networkLoggerEnabled,
      }),
    }),
    { name: 'settings-store' },
  ),
)

export const useSettingsStore = createSelectors(_useSettingsStore)

export const settingsActions = {
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    _useSettingsStore.setState((state) => ({
      settings: {
        ...state.settings,
        [key]: value,
      },
    })),

  updateSettings: (partialSettings: Partial<AppSettings>) =>
    _useSettingsStore.setState((state) => ({
      settings: {
        ...state.settings,
        ...partialSettings,
      },
    })),

  setNetworkLoggerEnabled: (enabled: boolean) =>
    _useSettingsStore.setState({
      networkLoggerEnabled: enabled,
    }),

  toggleNetworkLogger: () =>
    _useSettingsStore.setState((state) => ({
      networkLoggerEnabled: !state.networkLoggerEnabled,
    })),

  resetSettings: () => _useSettingsStore.setState(initialState),
}
