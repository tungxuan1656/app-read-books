# Engineering Standards (React Native + Expo)

This folder defines coding and architecture standards for this repository.
All standards align to the current stack: Expo SDK 54, React Native 0.81, React 19, Expo Router, Zustand + MMKV.

Product behavior is owned by `docs/product/overview.md`. System topology and invariants are owned by `ARCHITECTURE.md`. This folder owns implementation rules only.

## Index by Task

### Project setup and structure
- `project-folder-structure.md` — where files go and import rules
- `architecture-ownership-map.md` — who owns which module (links to `ARCHITECTURE.md` for layer map)

### Naming and types
- `naming-and-conventions-pattern.md` — file, export, import, and type naming (includes DTO/Request/Response rules)

### UI and styling
- `component-structure-pattern.md` — screen vs reusable component rules
- `color-guide.md` — color tokens and Tailwind usage
- `typography-guide.md` — type scale and reading screen exception

### State, data, and storage
- `zustand-store-pattern.md` — per-domain Zustand stores and persistence
- `service-hook-pattern.md` — service + hook + cache pattern
- `cache-and-storage-pattern.md` — MMKV, FileSystem, and SQLite cache

### Navigation and forms
- `expo-router-navigation-pattern.md` — file-based routing and param safety
- `form-pattern.md` — forms, validation, and dialog/sheet interactions

### Quality and delivery
- `testing-and-validation-pattern.md` — checks, validation workflow, and smoke checklist
- `code-review-guide.md` — review priorities and checklist
- `i18n-label-pattern.md` — label rules (Status: Proposed, not yet implemented)

## Retired

These guides were merged to keep each file scoped and to remove duplicates:

- `type-naming-pattern.md` → merged into `naming-and-conventions-pattern.md`
- `dialog-and-form-pattern.md` → merged into `form-pattern.md`
- `refactor-baseline-checklist.md` → merged into `testing-and-validation-pattern.md`

Do not link to retired files. Update links to the absorbing file above.

## How to Use

Read the relevant standard before you start work. Follow existing project patterns before adding new abstractions or dependencies.

## Quality Gates

- `pnpm run lint` — ESLint (configured, see `./init.sh`)
- `pnpm run tsc-check` — TypeScript (see `./init.sh`)
- Route layer guardrail: direct `fetch` in `app/*` is blocked by lint.

## Links

- Product overview → `docs/product/overview.md`
- Architecture → `ARCHITECTURE.md`
- Feature specs → `docs/specs/<id>.md`
- Feature inventory → `feature_index.json`
- Checks → `./init.sh`
- Manual device checks → `progress.md` (see `testing-and-validation-pattern.md` §5)
