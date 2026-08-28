# book-import — Book import

## Goal

Enable discovery and local import of remotely exported books via Supabase Function: fetch list → download ZIP → unzip to `books/` → parse references → delete ZIP.

## Scope

- Fetch exported book list from `BOOKS_API_URL` (`POST` to Supabase Function `https://iqtndkcyrsmptlrepaks.supabase.co/functions/v1/get-exported-books`, envelope `{ success, data, message }`) via `services/book-import.service.ts` → `fetchExportedBooks`
- Import pipeline in `services/book-import.service.ts` → `importBookFromExportUrl`: ensure `books/` + `download_books/` (`utils/file-system.helpers.ts` → `createFolderBooks`), derive filename (`getFilenameOfUrl`), build `zipUri` (`getPathSaveZipBook`), download (`services/download.service.ts` → `downloadFile` via `expo-file-system` `File.downloadFileAsync`), unzip (`react-native-zip-archive` `unzip` to `getFolderBooks()`), delete ZIP (`deleteDownloadFile`)
- Hook orchestration `hooks/use-add-book.ts` (auto-fetch on mount, retry, `handleDownloadExport`) and UI `app/add-book/index.tsx`
- Depends on `settings-management` for `BOOKS_API_URL` (see `feature_index.json` `depends_on`)

## Non-goals

- Library list rendering or swipe-delete (owned by `book-library`)
- Chapter reading or AI processing
- Auth or custom endpoint validation beyond non-empty string check

## Acceptance

- [x] a1 App queries the available books list from the remote Supabase function endpoint.
- [x] a2 Selected book file (ZIP) is downloaded to local device filesystem storage.
- [x] a3 ZIP file is extracted, references are parsed, and the raw ZIP archive is cleaned up automatically.

## Relevant docs

- `docs/specs/book-import.md`
- `services/book-import.service.ts`
- `services/download.service.ts`
- `hooks/use-add-book.ts`
- `utils/file-system.helpers.ts`
- `controllers/settings-schema.ts`
- `ARCHITECTURE.md`

## Plan

<!-- Bounded (default): 1-3 files, 1 workspace, <200 lines. Substantial: >=4 files or >=2 workspaces, DB migration/breaking API, or needs phases/rollback -> use docs/plans/book-import.md (needs >=2 substantial signals). -->

1. Implement fetch + import pipeline (`book-import.service.ts`, `download.service.ts`, filesystem helpers) — completed.
2. Wire hook `use-add-book.ts` and `app/add-book` screen for list + download UX — completed.
3. Verify via `./init.sh` (lint, tsc-check, jest) — completed.

## Verify

- `./init.sh` — lint (`pnpm run lint:fix`), build (`pnpm run tsc-check`), test (`pnpm exec jest --watchAll=false`)

## Handoff

- State: done
- Evidence: Terminal evidence from `harness/work/book-import.json` at `f17ba81` — a1: "Verified in services/book-import.service.ts (fetchBooks list queries BOOKS_API_URL)."; a2: "Verified in services/download.service.ts (downloadFile utilizes Expo FileSystem to download the ZIP file)."; a3: "Verified in services/book-import.service.ts (importBook calls unzip from react-native-zip-archive, parses references, and deletes the zip file via FileSystem.deleteAsync)." Verified 2026-07-28 (`completion.verifiedAt` 2026-07-28T10:05:00Z, `completedAt` 2026-07-28T10:05:00Z). Archived via git history `f17ba81` (`harness/work/book-import.json`). Re-verified 2026-08-24 via `./init.sh` (migration commit `f320581`) — PASS (lint fix, tsc-check, jest 3 suites 13 tests).
- Blockers: none
- Next: — (repo idle, 0 active; downstream `book-library` depends on this feature)

<!-- harness-slim 1.4.0 · generated 2026-08-24 -->
