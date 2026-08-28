# ai-reading — AI reading

## Goal

Support three reading modes (`none`, `translate`, `summary`) via OpenAI-compatible provider with custom headers/extra body, chunking, and SQLite cache for instant reuse.

## Scope

- Provider `services/ai-providers/openai.provider.ts` → `createOpenAIProvider().processContent`: endpoint `OPENAI_API_URL` (`https://copilot.tungxuan.io.vn/v1/chat/completions`), model `OPENAI_MODEL` (`gpt-4o`), headers `AI_CUSTOM_HEADERS` (`getSharedCustomHeaders`), body `AI_EXTRA_BODY` (`getSharedExtraBody`), chunking via `services/ai-providers/provider-shared.ts` (`AI_MIN_CHUNK_SIZE` default `1300`, `splitContentIntoChunks`, parallel `Promise.all` per chunk, `cleanProviderResponse`)
- Mode dispatch `hooks/use-reading-content.ts` reacting to `useReadingStore.readingAIMode` → `services/reading.service.ts` → `getReadingContent` → `services/ai-actions.service.ts` (`getActionByKey`) → `services/content-processor.ts` → `processChapterContent` (cache check, raw load, provider call, `simpleMdToHtml`, `saveProcessedChapter` with dedup `pendingRequests`)
- SQLite cache `services/database.service.ts` (`reading_app.db`, `processed_chapters` with `UNIQUE(book_id, chapter_number, mode)`, `getProcessedChapter` / `getChaptersCacheStatus` / `saveProcessedChapter`)
- Depends on `book-reader` + `settings-management` (see `feature_index.json` `depends_on`)

## Non-goals

- Prefetch orchestration beyond single-chapter processing (owned by `chapter-prefetch`)
- Non-OpenAI providers (locked to `openai` via `normalizeAIProvider`)
- UI for editing prompts beyond existing `setting-editor`

## Acceptance

- [x] a1 OpenAI compatible provider handles chat completion payload requests using custom prompts.
- [x] a2 Reading content hook supports switching reading AIMode (none, translate, summary) dynamically.
- [x] a3 Processed chapters are saved in local SQLite database and retrieved as cache hit.

## Relevant docs

- `docs/specs/ai-reading.md`
- `services/ai-providers/openai.provider.ts`
- `services/ai-providers/provider-shared.ts`
- `services/content-processor.ts`
- `services/database.service.ts`
- `services/reading.service.ts`
- `hooks/use-reading-content.ts`
- `controllers/settings-schema.ts`

## Plan

<!-- Bounded (default): 1-3 files, 1 workspace, <200 lines. Substantial: >=4 files or >=2 workspaces, DB migration/breaking API, or needs phases/rollback -> use docs/plans/ai-reading.md (needs >=2 substantial signals). -->

1. Implement OpenAI provider with headers/body merging, chunking, retry, and response cleaning — completed.
2. Implement `content-processor` + SQLite cache + `reading.service` mode dispatch and `use-reading-content` hook — completed.
3. Verify via `./init.sh` (lint, tsc-check, jest) — completed.

## Verify

- `./init.sh` — lint (`pnpm run lint:fix`), build (`pnpm run tsc-check`), test (`pnpm exec jest --watchAll=false`)

## Handoff

- State: done
- Evidence: Terminal evidence from `harness/work/ai-reading.json` at `f17ba81` — a1: "Verified in services/ai-providers/openai.provider.ts (processContent constructs fetch requests with custom headers/extra bodies to copilot API endpoint)."; a2: "Verified in hooks/use-reading-content.ts (loadChapter effect reacts to readingAIMode changes and gets appropriate content using getReadingContent service)."; a3: "Verified in services/content-processor.ts (checks SQLite cache with dbService.getProcessedChapter, processes with AI on cache miss, and writes back using saveProcessedChapter) and services/database.service.ts." Verified 2026-07-28 (`completion.verifiedAt` 2026-07-28T10:20:00Z, `completedAt` 2026-07-28T10:20:00Z). Archived via git history `f17ba81` (`harness/work/ai-reading.json`). Re-verified 2026-08-24 via `./init.sh` (migration commit `f320581`) — PASS (lint fix, tsc-check, jest 3 suites 13 tests).
- Blockers: none
- Next: — (repo idle, 0 active; downstream `chapter-prefetch` depends on this feature)

<!-- harness-slim 1.4.0 · generated 2026-08-24 -->
