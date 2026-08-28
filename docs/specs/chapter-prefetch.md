# Feature: chapter-prefetch

## Behavior

After the current chapter is ready, the app prefetches the next `PREFETCH_COUNT` chapters in the background for the active AI mode. Cached chapters are skipped; missing ones are processed sequentially. Prefetch stops on chapter/mode change or unmount.

## Flow

1. Trigger: `app/reading/index.tsx` calls `useChapterPrefetch(bookId, chapter.index, !chapter.isLoading)` (`hooks/use-chapter-prefetch.ts`). Guard: if `!book || readingAIMode==='none' || !isCurrentChapterReady` → set `isRunning:false` and return.
2. Compute range: `start = currentChapter+1`, `end = min(start + PREFETCH_COUNT -1, totalChapters)` from `book.references.length` and `useSettingsStore.settings.PREFETCH_COUNT` (default `"3"`). If `start > end` → no-op.
3. Batch cache check: `chaptersToCheck = [start..end]` → `dbService.getChaptersCacheStatus(bookId, chaptersToCheck, readingAIMode)` (single query). Filter `chaptersToProcess = chaptersToCheck.filter(ch => !cached.has(ch))`. If empty → set `isRunning:false`.
4. Sequential process: set `isRunning:true`, `totalChapters = chaptersToProcess.length`. For each `chapterNum` in order: guard `isCancelled || runIdRef.current !== runId` → break; guard `useReadingStore.readingAIMode !== readingAIMode` → break; call `getReadingContent(bookId, chapterNum, readingAIMode)` (which hits cache or AI). Update `processedChapters` and `message` via `prefetchActions.updatePrefetchState`. On error, append to `prefetchState.errors`. Finish → `isRunning:false, message:'Hoàn tất tải trước'`.
5. Cancellation: `useEffect` cleanup sets `isCancelled=true`; `runIdRef` increments each run so stale runs halt immediately. Also re-runs when `bookId`, `currentChapter`, `readingAIMode`, or `isCurrentChapterReady` change.

## Contract

| Item | Value |
|---|---|
| Setting | `PREFETCH_COUNT` string numeric (default `3`), parsed via `+PREFETCH_COUNT` |
| State | `usePrefetchStore.prefetchState: { isRunning, currentBookId, totalChapters, processedChapters, message, errors[] }` (`controllers/stores/prefetch.store.ts`) |
| Cache check | `dbService.getChaptersCacheStatus(bookId, number[], mode)` → `Set<number>` of cached chapter numbers |
| Processor | `services/reading.service.ts` → `getReadingContent` → `services/content-processor.ts` → `processChapterContent` (reuses same SQLite cache and AI provider as foreground reads) |
| Halt conditions | `isCancelled` (unmount), `runId` mismatch (new effect run), `readingAIMode` changed, `isCurrentChapterReady===false`, mode `none` |
| Concurrency | One prefetch run at a time per hook instance; `pendingRequests` dedup in `content-processor` prevents duplicate AI calls for same `bookId_chapter_mode` |

## Notes

- Evidence: `hooks/use-chapter-prefetch.ts`, `app/reading/index.tsx` (`useChapterPrefetch` call), `services/database.service.ts` (`getChaptersCacheStatus`), `services/reading.service.ts`, `controllers/stores/prefetch.store.ts`, `controllers/settings-schema.ts` (`sanitizeSettings` clamp).
- Resolved — sequential vs parallel: sequential (one chapter at a time, but each chapter parallelizes its own chunks via `Promise.all`) is intentional per `docs/product/decisions.md` D4 and BR-08 — avoids stale writes if mode/chapter changes, reduces quota waste. No global queue needed for N≤3.
- Gap — `PREFETCH_COUNT` string handling: `controllers/settings-schema.ts` `sanitizeSettings` currently stores `PREFETCH_COUNT` as string via `toStringValue` with no `1..10` clamp; `hooks/use-chapter-prefetch.ts:37` parses via `+PREFETCH_COUNT` and computes `end = min(start + count -1, total)`. Non-numeric → `NaN` → `start > end` → no-op prefetch. This diverges from `BR-08` (invalid → `3`). Observed behavior is no-op; clamp to `1..10` is the intended BR-08 rule and should be added to `sanitizeSettings` when next touched.

## Acceptance criteria
- [a1] Background prefetch triggers when current chapter content is fully loaded and ready.
- [a2] Prefetch batch checks cache status in SQLite, filtering out already processed chapters.
- [a3] Prefetch processes missing chapters sequentially and halts safely on chapter or mode change.
