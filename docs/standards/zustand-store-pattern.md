# Zustand Store Pattern (RN + MMKV)

## 1) Current Project Pattern

- Store lives in `controllers/store.ts`.
- Persistence uses Zustand `persist` middleware with custom MMKV adapter from
  `controllers/mmkv.ts`.
- Actions are exposed via `storeActions` object for imperative updates.

## 2) Required Conventions

- Keep state interfaces explicit (`Typography`, `Settings`, `Reading`, ...).
- Use partial update helpers for nested state (`set((state) => ({ ... }))`).
- Persist only necessary state; avoid persisting transient runtime flags when not required.
- Keep state mutation centralized through store methods/actions.

## 3) MMKV Persistence Pattern

```ts
persist(
  (set, get) => ({
    // state + actions
  }),
  {
    name: 'appstore',
    storage: {
      getItem: (name) => MMKVStorage.get(name),
      setItem: (name, value) => MMKVStorage.set(name, value),
      removeItem: (name) => MMKVStorage.remove(name),
    },
  },
)
```

## 4) Action Export Pattern

```ts
const { updateReading, updateSetting } = useAppStore.getState()

export const storeActions = {
  updateReading,
  updateSetting,
}
```

## 5) Checklist

- [ ] New state field has clear interface/type.
- [ ] Update function is added for mutable state branches.
- [ ] Persist behavior is intentional and reviewed.
- [ ] No direct mutation of nested objects.
