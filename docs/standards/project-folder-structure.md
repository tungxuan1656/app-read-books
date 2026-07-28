# Project Folder Structure (Expo React Native)

## 1) Canonical Structure

```text
app/
  _layout.tsx
  index.tsx
  reading/index.tsx
  add-book/index.tsx
  settings/index.tsx
  setting-editor/index.tsx
  references/index.tsx
  common/

components/
  *.tsx
  reading/*.tsx
  network-logger/

hooks/
  use-*.ts

services/
  *.service.ts
  *.ts                   (content-processor, ai-provider-registry, etc.)
  ai-providers/
    *.provider.ts

controllers/
  mmkv.ts                (MMKV adapter)
  settings-schema.ts     (AppSettings type, defaults, sanitize/migrate)
  stores/
    index.ts             (re-exports all stores and actions)
    store.types.ts
    store.helpers.ts
    books.store.ts
    reading.store.ts
    settings.store.ts
    typography.store.ts
    prefetch.store.ts
    ui-runtime.store.ts

constants/
  *.ts

utils/
  *.helpers.ts
  logger.ts

assets/
  fonts/
  images/
  app-*.ts

@types/
  *.d.ts

harness/
  manifest.json
  checks.json
  progress.md
  schemas/
  scripts/
```

## 2) Layer Responsibilities

- `app/`: route screens only (UI composition + route behavior).
- `components/`: reusable UI blocks.
- `hooks/`: screen-level orchestration logic and lifecycle handling.
- `services/`: business logic, IO, AI processing, cache integration.
- `controllers/`: app-level state (Zustand stores), persistence schema, migration.
- `constants/`: app constants, style tokens.
- `utils/`: pure helpers and filesystem-level helpers.
- `@types/`: shared project type declarations.
- `harness/`: canonical feature tracking and quality gates.

## 3) Placement Rules

- Do not put heavy business logic in `app/*` or `components/*`.
- Do not call remote APIs directly from components; go through `services/*`.
- Use hooks to orchestrate services, store state, and component interaction.
- Keep cache/persistence logic in `services/*` or `controllers/*`, not in UI files.
- New feature screen path must live under `app/<feature>/index.tsx`.
- New stores go in `controllers/stores/<name>.store.ts` and re-exported from `controllers/stores/index.ts`.

## 4) Import Rules

- Prefer alias imports `@/...`.
- Keep imports grouped:
  - third-party packages
  - blank line
  - internal `@/...` imports
- Reuse existing modules before adding new top-level folders.

## 5) Checklist

- [ ] New route added under `app/` with Expo Router naming.
- [ ] Business logic implemented in `services/`, not screen component.
- [ ] State updates use store actions/selectors from `controllers/stores/index.ts`.
- [ ] Utility logic extracted to `utils/` when reused.
- [ ] New types are added in `@types/` or colocated service type blocks.
