# Naming & Conventions Pattern

## 1) File Naming

- Files use `kebab-case`.
- Page: `<feature>-page.tsx`.
- API Hook: `use-<feature>.ts`.
- Store: `<feature>.store.ts`.
- API: `<feature>.ts`, endpoint registry at `endpoints.ts`.
- Mock: `<feature>.mock.ts` — placed in the same folder as `api/<feature>.ts`, **not** in components.
- Barrel export: `index.ts` in large component/hook folders.

## 2) Export Convention

- Page: `const XPage = () => {}` + `export default XPage`.
- Child component: `export const X = () => {}`.
- Hook/store helpers: named export.

## 3) Type Naming

- DTO: suffix `DTO` (`UserDTO`, `GoalDTO`).
- API input: suffix `Request`.
- API business output: suffix `Response`.
- Unified wrapper: `ApiResponse<T>`.

## 4) React Query Naming

- Query key constant: `*_KEYS` (`DEED_KEYS`, `GOAL_KEYS`).
- Standard key structure: `all`, `list`, `detail`.
- Successful mutations must invalidate by key scope.

## 5) Constant Naming

- Route paths use object `PATHS`.
- Text/copy uses domain-specific objects (`INFO_COPY`, `LABEL_COPY`, `ONBOARDING_CONTENT`).
- General constants use `UPPER_SNAKE_CASE` for single variables, `PascalCase` for types.

## 6) Import Convention

- Prefer absolute alias: `@/...`.
- Do not use long relative paths when alias is available.
- Import child components via barrel `index.ts` if the folder has one.
- **Required import order**: third-party first → blank line → internal `@/` alias. Do not mix the two groups.
- **No duplicate imports from the same path** — merge into a single `import` statement:

```ts
// ❌ Wrong
import { A } from '@/stores/foo'
import { B } from '@/stores/foo'

// ✅ Correct
import { A, B } from '@/stores/foo'
```

## 7) Comment Convention (required)

- **All code comments must be written in English**.
- Declarations for future features: `// planned: <feature description>`.
- Placeholder/mock awaiting API: `// TODO: connect to <API_ENDPOINTS.x.y> once available`.
- Temporary hardcoded values: `// TODO: replace with real data from <source> once <condition>`.
- Stale comments must be updated immediately when related values/behavior change (interval, threshold, field name).

## 8) Project References

- Page default export: [src/pages/goals-page.tsx](../../src/pages/goals-page.tsx)
- Component named export: [src/components/stats/stats-card.tsx](../../src/components/stats/stats-card.tsx)
- Type naming: [src/types/api.ts](../../src/types/api.ts)
- Query key naming: [src/hooks/api/use-deeds.ts](../../src/hooks/api/use-deeds.ts)
- Paths/constants: [src/lib/constants/index.ts](../../src/lib/constants/index.ts)
- Mock file pattern: `src/api/<feature>.mock.ts`
