# book-library — Book library

## Goal

Display locally imported books on Home with name, author, chapter count and cover; support swipe-to-delete and BottomSheet details with chapter index.

## Scope

- Home list (`app/index.tsx`) rendering `FlatList` of book IDs from `useBooksStore.id2Book` via `components/home-book-item.tsx`; data sourced from `utils/book.helpers.ts` → `readFolderBooks()` scanning `Paths.document/books` and reading `book.json`
- Swipe-to-delete via `components/item-swipeable.tsx` (`ItemSwipeable`) → `utils/book.helpers.ts` → `deleteBook(bookPath)` (`new Directory(bookPath).delete()`) and `books.store` update
- Details BottomSheet `components/sheet-book-info.tsx` (`SheetBookInfo`) showing metadata (name, author, description/synopsis, cover) and scrollable `references` array
- Depends on `book-import` for local `books/<bookId>` folders (see `feature_index.json` `depends_on`)

## Non-goals

- Remote fetch or ZIP import (owned by `book-import`)
- Reader rendering, navigation, or scroll persistence (owned by `book-reader`)
- SQLite cache clearing on delete (open question in spec)

## Acceptance

- [x] a1 Home screen displays list of downloaded books with name, author, chapter count, and cover image.
- [x] a2 Swipe-to-delete gesture removes the selected book and all its associated directory files from local storage.
- [x] a3 Book details are shown in a Bottom Sheet including chapter index list.

## Relevant docs

- `docs/specs/book-library.md`
- `app/index.tsx`
- `components/home-book-item.tsx`
- `components/item-swipeable.tsx`
- `components/sheet-book-info.tsx`
- `utils/book.helpers.ts`
- `ARCHITECTURE.md`

## Plan

<!-- Bounded (default): 1-3 files, 1 workspace, <200 lines. Substantial: >=4 files or >=2 workspaces, DB migration/breaking API, or needs phases/rollback -> use docs/plans/book-library.md (needs >=2 substantial signals). -->

1. Implement filesystem scan + Home FlatList rendering (`book.helpers.ts`, `app/index.tsx`, `home-book-item.tsx`) — completed.
2. Add swipe-to-delete (`item-swipeable.tsx`) and BottomSheet details (`sheet-book-info.tsx`) — completed.
3. Verify via `./init.sh` (lint, tsc-check, jest) — completed.

## Verify

- `./init.sh` — lint (`pnpm run lint:fix`), build (`pnpm run tsc-check`), test (`pnpm exec jest --watchAll=false`)

## Handoff

- State: done
- Evidence: Terminal evidence from `harness/work/book-library.json` at `f17ba81` — a1: "Verified in app/index.tsx (Home renders FlatList of bookIds and HomeBookItem) and components/home-book-item.tsx."; a2: "Verified in components/item-swipeable.tsx (ItemSwipeable) and components/home-book-item.tsx (onDeleteBook deletes the book directory via FileSystem and updates books.store)."; a3: "Verified in components/sheet-book-info.tsx (SheetBookInfo displays metadata, author, description, and list of references/chapters)." Verified 2026-07-28 (`completion.verifiedAt` 2026-07-28T10:10:00Z, `completedAt` 2026-07-28T10:10:00Z). Archived via git history `f17ba81` (`harness/work/book-library.json`). Re-verified 2026-08-24 via `./init.sh` (migration commit `f320581`) — PASS (lint fix, tsc-check, jest 3 suites 13 tests).
- Blockers: none
- Next: — (repo idle, 0 active; downstream `book-reader` depends on this feature)

<!-- harness-slim 1.4.0 · generated 2026-08-24 -->
