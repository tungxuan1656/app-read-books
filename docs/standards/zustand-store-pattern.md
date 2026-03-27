# Zustand Store Pattern (RN + MMKV)

## 1) Canonical Pattern (Current)

- Do not use a monolithic app store.
- Create one store per domain in `controllers/stores`.
- Store file naming must be `<name>.store.ts`.
- Each store must export:
  - `use<Name>Store` (selector-enhanced hook)
  - `<name>Actions` (imperative action object)
- Aggregate exports from `controllers/stores/index.ts`.

## 2) Required Architecture Rules

- Separate `state` and `actions`:
  - `state` lives inside Zustand store.
  - `actions` are exported as top-level objects that call `setState`.
- Keep domain ownership clear:
  - `typography.store.ts`
  - `reading.store.ts`
  - `books.store.ts`
  - `prefetch.store.ts`
  - `settings.store.ts`
  - `ui-runtime.store.ts`
- Prefer `useXStore.use.field()` for UI subscription to stable top-level fields.
- Use inline selectors only when field-level helper is not enough for param-based selection.

## 3) Selector Helper Pattern

Use shared helper in `controllers/stores/store.helpers.ts`.

```ts
import { createSelectors } from './store.helpers'

const _useSettingsStore = create<SettingsStoreState>()(...)

export const useSettingsStore = createSelectors(_useSettingsStore)
```

Usage:

```ts
const settings = useSettingsStore.use.settings()
settingsActions.updateSetting('COPILOT_MODEL', 'gpt-4.1')
```

## 4) Persistence Pattern (Per Store Key)

- Persist by store domain with dedicated key names.
- Use shared MMKV `StateStorage` adapter (`MMKVStateStorage`).
- Persist only necessary state via `partialize`.
- Keep `version` + `migrate` where needed (especially settings schema).

```ts
persist(() => initialState, {
  name: 'settings-storage',
  storage: MMKVStateStorage,
  version: APP_STORE_VERSION,
  migrate: (persistedState) => ({ ... }),
  partialize: (state) => ({ settings: state.settings }),
})
```

## 5) Data Lifecycle Policy

- Legacy monolithic key `appstore` is deprecated.
- New architecture does not depend on old persisted schema.
- Persisted data is isolated per store key for safer maintenance and reset.

## 6) Checklist

- [ ] New state belongs to an existing domain store or a new dedicated store.
- [ ] Store file follows `<name>.store.ts` naming.
- [ ] Store exports both `useXStore` and `xActions`.
- [ ] Persist key is domain-specific and `partialize` is explicit.
- [ ] UI code reads via selector helper (`useXStore.use.field()`) when possible.
- [ ] Business logic uses action objects instead of direct mutation.

## 7) Official References

- Zustand slices pattern: <https://zustand.docs.pmnd.rs/guides/slices-pattern>
- Zustand persist middleware: <https://zustand.docs.pmnd.rs/integrations/persisting-store-data>
- Zustand auto-generating selectors: <https://zustand.docs.pmnd.rs/guides/auto-generating-selectors>
