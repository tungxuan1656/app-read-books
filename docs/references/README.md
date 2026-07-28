# Mobile Standards (React Native + Expo)

This folder defines coding and architecture standards for this repository.
All standards are aligned to the current stack:

- Expo SDK 54
- React Native 0.81
- React 19
- Expo Router (file-based routes in `app/`)
- Zustand + MMKV persistence
- Service-first business logic (`services/`) + orchestration hooks (`hooks/`)

## Standards Index

- `project-folder-structure.md`
- `component-structure-pattern.md`
- `naming-and-conventions-pattern.md`
- `type-naming-pattern.md`
- `service-hook-pattern.md` (service + hook + cache pattern for this project)
- `zustand-store-pattern.md`
- `form-pattern.md`
- `dialog-and-form-pattern.md`
- `i18n-label-pattern.md`
- `expo-router-navigation-pattern.md`
- `cache-and-storage-pattern.md`
- `color-guide.md`
- `typography-guide.md`
- `testing-and-validation-pattern.md`
- `code-review-guide.md`
- `architecture-ownership-map.md`
- `refactor-baseline-checklist.md`

## Usage Rule

When implementing new work, read the relevant standards first and follow existing
project patterns before introducing new abstractions or dependencies.

## Notes

- Use `pnpm run lint` and `pnpm run tsc-check` as baseline quality gates.
- Route layer guardrail: direct `fetch` in `app/*` is disallowed by lint.
