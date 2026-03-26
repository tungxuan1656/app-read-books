# Naming & Conventions Pattern

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

- DTO for transport payloads.
- `Request` for input payloads.
- `Response` for output payloads.
- Domain entities should use clear domain names (`Book`, `ReadingState`, `TTSQueueItem`).

## 6) Comments

- Write comments in English.
- Use TODO with clear action:
  - `// TODO: replace with <real source>`
  - `// TODO: remove fallback after <condition>`

## 7) Checklist

- [ ] New file follows kebab-case.
- [ ] Import order is consistent.
- [ ] No ambiguous type names like `Data`, `Payload`, `Result`.
- [ ] Comments are actionable and in English.
