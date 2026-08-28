# Naming and Conventions Pattern

## 1) File Naming

- Use `kebab-case` for all files.
- Route screens: `app/<route>/index.tsx`.
- Hooks: `hooks/use-<feature>.ts`.
- Services: `services/<feature>.service.ts`.
- Provider implementations: `services/ai-providers/<provider>.provider.ts`.
- Helpers: `utils/<domain>.helpers.ts`.

## 2) Export Convention

- Route screen: `const XScreen = () => {}` + `export default XScreen`.
- Reusable component: `export const X = () => {}`.
- Hooks/services/helpers: named exports.

## 3) Import Convention

- Prefer alias imports `@/...`.
- Import order:
  - third-party packages
  - blank line
  - internal imports (`@/...`)
- Merge duplicate imports from the same module path.

## 4) Constants and Keys

- Use descriptive names for config constants.
- Global constants: `UPPER_SNAKE_CASE`.
- Map/object constants may use `camelCase` or `PascalCase` based on usage context.

## 5) Type Naming

### Boundary suffixes

- Remote transport shape: suffix `DTO`.
- Input payload to API/provider/service boundary: suffix `Request`.
- Output payload from API/provider/service boundary: suffix `Response`.

### Domain naming

- Keep domain terms clear: `Book`, `Chapter`, `Reading`, `AIAction`.
- Avoid vague names (`Data`, `Payload`, `Result`) unless a boundary type requires them.

### Store types

- Store slices use clear names: `Typography`, `Settings`, `Reading`.
- Keep interface names singular and meaningful.

### Example

```ts
export type BookDTO = {
  id: string
  name: string
  references: string[]
}

export type ProcessChapterRequest = {
  bookId: string
  chapterNumber: number
  actionKey: string
}

export type ProcessChapterResponse = {
  content: string
  cached: boolean
}
```

## 6) Comments

- Write comments in English.
- Use TODO with clear action:
  - `// TODO: replace with <real source>`
  - `// TODO: remove fallback after <condition>`

## 7) Checklist

- [ ] New file follows kebab-case.
- [ ] Import order is consistent.
- [ ] Boundary types use DTO/Request/Response consistently.
- [ ] Domain models have clear names; no ambiguous `Data` or `Payload`.
- [ ] Comments are actionable and in English.
