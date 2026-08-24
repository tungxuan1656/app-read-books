# Decisions Log — rn-read-books

> **Append-only.** Add a new dated entry for each consequential decision. Do not rewrite or delete history. Mark reconstructed rationale as such. This file records historical lifecycle; the harness (`harness/manifest.json`, `harness/work/`) remains the canonical current lifecycle source.

## How to use

- One entry per decision. Keep entries short, evidence-based, and link to source commit or file.
- Required fields per entry: **Date**, **Context**, **Decision**, **Consequence**.
- If rationale is not in commit message or code comment, label it `Reconstructed from git history` and cite evidence only.
- Latest entry at the bottom.

---

### 1. Single SQLite cache layer `processed_chapters`

- **Date:** 2025-11-21 (first introduced in `91028ff`), schema stabilized by 2026-03-27 — *Reconstructed from git history*
- **Context:** AI translation and summarization are costly and repeated across reading sessions and prefetch. Early code cached processed chapters in dispersed helpers (`utils/cache-manager.ts`, `utils/summary-cache.ts`). The project needed one indexed, queryable cache shared across all AI modes without duplicating data in MMKV.
- **Decision:** Use a single SQLite table `processed_chapters` via `services/database.service.ts` (`expo-sqlite`, DB `reading_app.db`) as the only AI cache layer. Schema: `id INTEGER PK`, `book_id TEXT`, `chapter_number INTEGER`, `mode TEXT`, `content TEXT`, `content_hash TEXT`, `created_at INTEGER`, `updated_at INTEGER`, unique constraint `(book_id, chapter_number, mode)` plus indexes `idx_chapters_lookup` and `idx_chapters_book`. All modes (`translate`, `summary`) share the table; `mode` is the discriminator. See `ARCHITECTURE.md` Invariants and `docs/references/cache-and-storage-pattern.md` §3–4.
- **Consequence:** `services/content-processor.ts` checks `dbService.getProcessedChapter()` before any FileSystem read or AI call, deduplicates concurrent requests via `pendingRequests`, and writes with `saveProcessedChapter()` (upsert on conflict). No AI cache in MMKV (`ARCHITECTURE.md:129`). Prefetch batch-checks via `getChaptersCacheStatus()`. User-facing clear via `clearBookCache(bookId, mode?)` / `clearAllCache()` in Settings → Cache Manager.

### 2. Per-domain Zustand stores replacing monolithic `appstore`

- **Date:** 2026-03-27 (commit `12fdf2a` `refactor(store): restructure Zustand stores`) — *Reconstructed from git history*
- **Context:** `controllers/store.ts` held a single large store under MMKV key `appstore`. Growth made ownership, persistence, and reset hard to reason about. `docs/references/zustand-store-pattern.md` required focused domain ownership and per-key persistence.
- **Decision:** Split into one store per domain in `controllers/stores/`: `books.store.ts`, `reading.store.ts`, `settings.store.ts`, `typography.store.ts`, `prefetch.store.ts`, `ui-runtime.store.ts`. Each exports `use<Name>Store` (enhanced via `store.helpers.ts` `createSelectors`) and `<name>Actions`. Aggregate via `controllers/stores/index.ts`. Legacy `appstore` key deprecated (`Data Lifecycle Policy`). Migration keeps no dependency on old schema.
- **Consequence:** Persisted vs transient is explicit: `books`, `reading`, `settings`, `typography` persisted via `MMKVStateStorage` with domain key (`settings-storage`, etc.), `partialize`, and `version`+`migrate` (settings uses `controllers/settings-schema.ts`); `prefetch` and `ui-runtime` are runtime-only (`ARCHITECTURE.md` Key Stores table). UI reads via `useXStore.use.field()`; business logic uses action objects, not direct mutation.

### 3. OpenAI-only migration — single OpenAI-compatible provider

- **Date:** 2026-05-28 (commit `fecf228` `feat(ai): migrate to OpenAI provider; remove Copilot and DeepSeek support`)
- **Context:** Codebase maintained two providers — Copilot (`COPILOT_API_URL`/`COPILOT_MODEL`) and DeepSeek (`DEEPSEEK_API_URL`/`DEEPSEEK_MODEL`) — with `AI_PROVIDER` switching between `copilot` | `deepseek` (`4af2d4f`, `e0c7a40`). Maintenance cost and the need for a configurable OpenAI-compatible endpoint motivated consolidation. Endpoint `https://copilot.tungxuan.io.vn/v1/chat/completions` was kept but renamed.
- **Decision:** Remove `services/ai-providers/copilot.provider.ts` and `deepseek.provider.ts`. Introduce single provider `services/ai-providers/openai.provider.ts` (`createOpenAIProvider`) registered via `services/ai-provider-registry.ts` and accessed as `getAIProviderByType('openai')`. `AI_PROVIDER` locked to `'openai'` (`normalizeAIProvider` returns `'openai'`; `AIProviderType = 'openai'`). `controllers/settings-schema.ts` `DEFAULT_SETTINGS` now exposes `OPENAI_API_URL` (default `https://copilot.tungxuan.io.vn/v1/chat/completions`) and `OPENAI_MODEL` (default `gpt-4o`), sanitized via `toStringValue`.
- **Consequence:** Call path `reading.service.ts` → `content-processor.ts` → `getAIProviderByType('openai').processContent()` is the only AI path. `openai.provider.ts` merges `AI_CUSTOM_HEADERS` (JSON string → headers) via `getSharedCustomHeaders` and `AI_EXTRA_BODY` (JSON → body, added in `e531284`) via `getSharedExtraBody`, supports `AI_MIN_CHUNK_SIZE` chunking and HTML sanitization. Docs reference the endpoint as OpenAI-compatible since `fecf228` (`AGENTS.md:5`).

### 4. Service-first architecture — no TanStack Query

- **Date:** 2026-07-28 codified (commit `f17ba81` `docs: initialize canonical v1.0 harness`); pattern in use since at least 2025-11-21 — *Reconstructed from git history*
- **Context:** The project needed a clear rule for data fetching and caching that fits Expo + Zustand + MMKV/SQLite without adding a server-state library. `docs/references/service-hook-pattern.md:3` states the expectation explicitly.
- **Decision:** Do not use TanStack React Query. Use service-first: IO lives in `services/` (`<domain>.service.ts`, `ai-providers/*.provider.ts`, `database.service.ts`, `content-processor.ts`), orchestration in `hooks/` (`use-<domain>.ts`), file helpers in `utils/`. `ARCHITECTURE.md` Dependency Direction forbids `app/*` direct `fetch` and `hooks/*` raw `fetch`; `services/*` must not import `hooks/*` or `app/*`.
- **Consequence:** Screens consume hooks, not raw services (except small local actions). Services own network/FileSystem/SQLite and cache-first logic; hooks manage loading/error/lifecycle and cancellation. AI cache reuse from §1 and store persistence from §2 compose without an extra query cache. Lint guards the route-layer `fetch` prohibition (`docs/references/README.md` Quality Gates).
