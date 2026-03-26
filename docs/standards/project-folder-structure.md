# Project Folder Structure (Expo React Native)

## 1) Canonical Structure

```text
app/
  _layout.tsx
  index.tsx
  reading/index.tsx
  add-book/index.tsx
  settings/index.tsx
  settings/cache-manager.tsx
  ...

components/
  *.tsx
  reading/*.tsx

hooks/
  use-*.ts

services/
  *.service.ts
  ai-providers/*.provider.ts

controllers/
  store.ts
  mmkv.ts

constants/
  *.ts

utils/
  *.helpers.ts

assets/
  fonts/
  images/
  app-*.ts

@types/
  *.d.ts
```

## 2) Layer Responsibilities

- `app/`: route screens only (UI composition + route behavior).
- `components/`: reusable UI blocks.
- `hooks/`: screen-level orchestration logic and lifecycle handling.
- `services/`: business logic, IO, AI/TTS, cache integration, player integration.
- `controllers/`: app-level state and storage adapters.
- `constants/`: app constants, style tokens, settings schema descriptors.
- `utils/`: pure helpers and filesystem-level helpers.
- `@types/`: shared project type declarations.

## 3) Placement Rules

- Do not put heavy business logic in `app/*` or `components/*`.
- Do not call remote APIs directly from components; go through `services/*`.
- Use hooks to orchestrate services, store state, and component interaction.
- Keep cache/persistence logic in `services/*` or `controllers/*`, not in UI files.
- New feature screen path must live under `app/<feature>/index.tsx`.

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
- [ ] State updates use store actions/selectors from `controllers/store.ts`.
- [ ] Utility logic extracted to `utils/` when reused.
- [ ] New types are added in `@types/` or colocated service type blocks.
