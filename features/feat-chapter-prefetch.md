# chapter-prefetch — Chapter prefetch

## Goal

Background-prefetch next `PREFETCH_COUNT` chapters (default 3) after current chapter is ready: batch-check SQLite, skip cached, process missing sequentially, cancellable on chapter/mode change.

## Scope

- Trigger `hooks/use-chapter-prefetch.ts` via `app/reading/index.tsx` → `useChapterPrefetch(bookId, chapter.index, !chapter.isLoading)` with guards `!book || readingAIMode==='none' || !isCurrentChapterReady` → no-op
- Range `start = currentChapter+1`, `end = min(start + PREFETCH_COUNT -1, totalChapters)` from `book.references.length` and `useSettingsStore.settings.PREFETCH_COUNT`
- Batch cache check `services/database.service.ts` → `dbService.getChaptersCacheStatus(bookId, chaptersToCheck, readingAIMode)` → `Set<number>`; filter `chaptersToProcess`
- Sequential process: `isRunning:true`, for each `chapterNum` guard `isCancelled || runIdRef.current !== runId || useReadingStore.readingAIMode !== readingAIMode` → break; call `services/reading.service.ts` → `getReadingContent` (reuses `content-processor` cache/provider); progress via `controllers/stores/prefetch.store.ts` (`prefetchState: { isRunning, currentBookId, totalChapters, processedChapters, message, errors }`); completion `Hoàn tất tải trước`; cancellation via `isCancelled` flag + `runIdRef` increment + `useEffect` cleanup
- Depends on `ai-reading` (see `feature_index.json` `depends_on`)

## Non-goals

- Foreground chapter rendering (owned by `book-reader` / `ai-reading`)
- Parallel prefetch or global queue beyond sequential per-hook instance (open question in spec)
- Prefetch for `none` mode (explicitly disabled)

## Acceptance

- [x] a1 Background prefetch triggers when current chapter content is fully loaded and ready.
- [x] a2 Prefetch batch checks cache status in SQLite, filtering out already processed chapters.
- [x] a3 Prefetch processes missing chapters sequentially and halts safely on chapter or mode change.

## Relevant docs

- `docs/specs/chapter-prefetch.md`
- `hooks/use-chapter-prefetch.ts`
- `app/reading/index.tsx`
- `services/database.service.ts`
- `services/reading.service.ts`
- `controllers/stores/prefetch.store.ts`
- `ARCHITECTURE.md`

## Plan

<!-- Bounded (default): 1-3 files, 1 workspace, <200 lines. Substantial: >=4 files or >=2 workspaces, DB migration/breaking API, or needs phases/rollback -> use docs/plans/chapter-prefetch.md (needs >=2 substantial signals). -->

1. Implement `useChapterPrefetch` trigger, range compute, and batch cache check (`getChaptersCacheStatus`) — completed.
2. Implement sequential processing with `isCancelled`/`runIdRef` halt and `prefetch.store` progress — completed.
3. Verify via `./init.sh` (lint, tsc-check, jest) — completed.

## Verify

- `./init.sh` — lint (`pnpm run lint:fix`), build (`pnpm run tsc-check`), test (`pnpm exec jest --watchAll=false`)

## Handoff

- State: done
- Evidence: Terminal evidence from `harness/work/chapter-prefetch.json` at `f17ba81` — a1: "Verified in app/reading/index.tsx (calling useChapterPrefetch with bookId, index, and isCurrentChapterReady hook values)."; a2: "Verified in hooks/use-chapter-prefetch.ts (calling dbService.getChaptersCacheStatus to check next N chapters in one query)."; a3: "Verified in hooks/use-chapter-prefetch.ts (running sequential for-loop to fetch each missing chapter, checking isCancelled and runIdRef.current on every step to halt immediately on unmount or navigation)." Verified 2026-07-28 (`completion.verifiedAt` 2026-07-28T10:25:00Z, `completedAt` 2026-07-28T10:25:00Z). Archived via git history `f17ba81` (`harness/work/chapter-prefetch.json`). Re-verified 2026-08-24 via `./init.sh` (migration commit `f320581`) — PASS (lint fix, tsc-check, jest 3 suites 13 tests).
- Blockers: none
- Next: — (repo idle, 0 active; leaf feature — no downstream dependents)

<!-- harness-slim 1.4.0 · generated 2026-08-24 -->
