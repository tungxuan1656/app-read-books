import { type StoreApi, type UseBoundStore } from 'zustand'

export type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never

export const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  store: S,
) => {
  const storeWithSelectors = store as WithSelectors<typeof store>

  storeWithSelectors.use = {} as WithSelectors<typeof store>['use']
  for (const key of Object.keys(storeWithSelectors.getState())) {
    ;(storeWithSelectors.use as Record<string, () => unknown>)[key] = () =>
      storeWithSelectors((state) => state[key as keyof typeof state])
  }

  return storeWithSelectors
}
