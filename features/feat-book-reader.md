# book-reader — Book reader

## Goal

Render raw HTML chapters from local storage with next/previous navigation updating `books.store` and scroll offset persistence/restore.

## Scope

- Content loading via `hooks/use-reading-content.ts` → `services/reading.service.ts` → `getReadingContent(bookId, chapterNumber, readingAIMode)` for `none` mode using `utils/book.helpers.ts` → `getBookChapterContent` (`new File(books/<bookId>/chapters/chapter-N.html).text()`) wrapped by `getChapterHtml` and rendered in `components/content-display.tsx` (`RenderHTML` with `useTypographyStore` styles)
- Navigation via `hooks/use-reading-navigation.ts` → `booksActions.updateReadingChapter / nextReadingChapter / previousReadingChapter` updating `useBooksStore.id2BookReadingChapter[bookId]`; `handleScroll` with debounced offset save (500 ms) and auto-advance on scroll boundaries
- Offset persistence via `useReadingStore.reading: { bookId, onScreen, offset }` and restore on mount (`app/reading/index.tsx` `scrollTo` after 200 ms, reset on chapter change)
- Depends on `book-library` for book data and local chapter files (see `feature_index.json` `depends_on`)

## Non-goals

- AI translation/summary processing (owned by `ai-reading`)
- Prefetch of upcoming chapters (owned by `chapter-prefetch`)
- Per-book scroll offset granularity beyond global `reading.offset` (open question in spec)

## Acceptance

- [x] a1 App reads raw HTML chapter contents from local directory and renders them correctly.
- [x] a2 Next and previous chapter navigation works, updating reading state in books.store.
- [x] a3 Scroll offset position is saved to store and restored when reopening the book.

## Relevant docs

- `docs/specs/book-reader.md`
- `hooks/use-reading-content.ts`
- `hooks/use-reading-navigation.ts`
- `app/reading/index.tsx`
- `components/content-display.tsx`
- `utils/book.helpers.ts`
- `ARCHITECTURE.md`

## Plan

<!-- Bounded (default): 1-3 files, 1 workspace, <200 lines. Substantial: >=4 files or >=2 workspaces, DB migration/breaking API, or needs phases/rollback -> use docs/plans/book-reader.md (needs >=2 substantial signals). -->

1. Implement content loader + HTML renderer (`use-reading-content.ts`, `content-display.tsx`, `book.helpers.ts`) — completed.
2. Implement navigation + scroll offset save/restore (`use-reading-navigation.ts`, `app/reading/index.tsx`) — completed.
3. Verify via `./init.sh` (lint, tsc-check, jest) — completed.

## Verify

- `./init.sh` — lint (`pnpm run lint:fix`), build (`pnpm run tsc-check`), test (`pnpm exec jest --watchAll=false`)

## Handoff

- State: done
- Evidence: Terminal evidence from `harness/work/book-reader.json` at `f17ba81` — a1: "Verified in hooks/use-reading-content.ts (reads local chapter content via getBookChapterContent helper) and components/content-display.tsx."; a2: "Verified in hooks/use-reading-navigation.ts (updateReadingChapter, nextReadingChapter, previousReadingChapter update books.store and trigger state changes)."; a3: "Verified in app/reading/index.tsx (saving offset dynamically to useReadingStore and restoring it inside the webview using postMessage/injectJavaScript)." Verified 2026-07-28 (`completion.verifiedAt` 2026-07-28T10:15:00Z, `completedAt` 2026-07-28T10:15:00Z). Archived via git history `f17ba81` (`harness/work/book-reader.json`). Re-verified 2026-08-24 via `./init.sh` (migration commit `f320581`) — PASS (lint fix, tsc-check, jest 3 suites 13 tests).
- Blockers: none
- Next: — (repo idle, 0 active; downstream `ai-reading` depends on this feature)

<!-- harness-slim 1.4.0 · generated 2026-08-24 -->
