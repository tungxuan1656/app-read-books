# Zustand Store Pattern (Short and Ready to Apply)

## 1) Standard Template

```ts
import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'

import { createSelectors } from './types'

interface ExampleState {
  isReady: boolean
  data: string | null
}

const initialState: ExampleState = {
  isReady: false,
  data: null,
}

const _useExampleStore = create<ExampleState>()(
  devtools(
    persist(
      () => initialState,
      {
        name: 'example-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({ data: s.data }), // persist only required fields
      },
    ),
  ),
)

export const exampleActions = {
  markReady: (isReady = true) => _useExampleStore.setState({ isReady }),
  setData: (data: string | null) => _useExampleStore.setState({ data }),
  reset: () => _useExampleStore.setState(initialState),
}

export const useExampleStore = createSelectors(_useExampleStore)
```

## 2) Required Conventions

- Naming: `_useXStore`, `useXStore`, `xActions`.
- Update state only through `actions`.
- Use key-based selectors: `useXStore.use.field()`.
- If persist is used, always use `partialize`.
- **Do not persist** transient flags (`loading`, `error`, `isSessionChecked`, ...).
- **`reset` action is required** for state re-initialization and test isolation.

## 2a) Testing Requirement (Required)

Each new store **must include a matching test file** in the same PR, including:

- Initial state: verify default values are correct.
- Each action (`setX`, `reset`, ...): at least 1 happy-path case and 1 edge case.
- If the store has derived selectors: include selector coverage tests.

```ts
// stores/shift.store.test.ts
beforeEach(() => { act(() => { shiftActions.reset() }) })
aftEreach(() => { act(() => { shiftActions.reset() }) })

describe('shiftActions.setDateRange', () => {
  it('updates dateRange', () => { ... })
  it('accepts undefined to clear', () => { ... })
})

describe('shiftActions.reset', () => {
  it('restores initial state after mutation', () => { ... })
})
```

Standard test pattern: `src/stores/<feature>.store.test.ts`

## 3) Usage in Components

```ts
const data = useExampleStore.use.data()
const isReady = useExampleStore.use.isReady()

exampleActions.setData('abc')
exampleActions.markReady()
```

## 4) New Store Checklist

- [ ] Has `State` + `initialState`
- [ ] `create(...devtools(persist(...)))`
- [ ] Complete `actions` (`set`, `reset`) with required `reset`
- [ ] Export `useXStore = createSelectors(_useXStore)`
- [ ] Persist only truly necessary fields
- [ ] Has `<domain>.store.test.ts` covering initial state, all actions, and derived selectors
