# settings-management — Settings management

## Goal

Provide a validated AppSettings schema with safe defaults, persisted via MMKV and restored on launch, with sanitize and migration for legacy formats.

## Scope

- AppSettings keys, defaults, and validation in `controllers/settings-schema.ts` (`DEFAULT_SETTINGS`, `APP_STORE_VERSION = 5`, `sanitizeSettings`, `migratePersistedSettings`, `normalizeAIProvider`, `normalizeAIActions`, legacy key mapping `COPILOT_CUSTOM_HEADERS` → `AI_CUSTOM_HEADERS`)
- MMKV persistence via `controllers/mmkv.ts` (`MMKVStateStorage` wrapping `react-native-mmkv` with `MMKV-` prefix) and Zustand `persist` in `controllers/stores/settings.store.ts` (`settings-storage`) and `controllers/stores/typography.store.ts` (`typography-storage`)
- Settings UI write-back via `settingsActions.updateSetting(s)` and `persist` `partialize` (`settings` + `networkLoggerEnabled`)

## Non-goals

- Book download, library, reader, or AI processing behavior (owned by downstream features)
- Provider logic beyond settings normalization (provider selection locked to `openai`)
- Typography rendering beyond persistence of `typography` defaults

## Acceptance

- [x] a1 App settings schema defines default API URLs, prefetch count, AI provider, prompts, and typography rules.
- [x] a2 App settings are persisted to MMKV storage and successfully restored upon app launch.
- [x] a3 Input settings are sanitized and migrated from older schema formats correctly.

## Relevant docs

- `docs/specs/settings-management.md`
- `controllers/settings-schema.ts`
- `controllers/mmkv.ts`
- `controllers/stores/settings.store.ts`
- `controllers/stores/typography.store.ts`
- `ARCHITECTURE.md`
- `docs/product/overview.md`

## Plan

<!-- Bounded (default): 1-3 files, 1 workspace, <200 lines. Substantial: >=4 files or >=2 workspaces, DB migration/breaking API, or needs phases/rollback -> use docs/plans/settings-management.md (needs >=2 substantial signals). -->

1. Define AppSettings schema, defaults, and sanitize/migrate in `controllers/settings-schema.ts` — completed.
2. Wire MMKV persistence via `controllers/mmkv.ts` and Zustand stores `settings.store.ts` / `typography.store.ts` — completed.
3. Verify via `./init.sh` (lint, tsc-check, jest) — completed.

## Verify

- `./init.sh` — lint (`pnpm run lint:fix`), build (`pnpm run tsc-check`), test (`pnpm exec jest --watchAll=false`)

## Handoff

- State: done
- Evidence: Terminal evidence from `harness/work/settings-management.json` at `f17ba81` — a1: "Verified in controllers/settings-schema.ts (DEFAULT_SETTINGS defines OPENAI_API_URL, OPENAI_MODEL, BOOKS_API_URL, PREFETCH_COUNT) and controllers/stores/settings.store.ts / typography.store.ts."; a2: "Verified in controllers/mmkv.ts (MMKVStateStorage wrapper around MMKV instance) and persistent stores using MMKVStateStorage."; a3: "Verified in controllers/settings-schema.ts (sanitizeSettings and migratePersistedSettings sanitize legacy keys like COPILOT_CUSTOM_HEADERS)." Verified 2026-07-28 (`completion.verifiedAt` 2026-07-28T10:00:00Z, `completedAt` 2026-07-28T10:00:00Z). Archived via git history `f17ba81` (`harness/work/settings-management.json`). Re-verified 2026-08-24 via `./init.sh` (migration commit `f320581`) — PASS (lint fix, tsc-check, jest 3 suites 13 tests).
- Blockers: none
- Next: — (repo idle, 0 active; no dependencies — root feature)

<!-- harness-slim 1.4.0 · generated 2026-08-24 -->
