# Feature: book-import

## Behavior

The app discovers remotely exported books and imports a selected book as a local folder ready for reading. Import is: fetch list → download ZIP → unzip to `books/` → delete ZIP. No authentication is required.

## Flow

1. User opens Add Book → `hooks/use-add-book.ts` reads `BOOKS_API_URL` from `useSettingsStore` and calls `fetchExportedBooks(booksApiUrl)` (`services/book-import.service.ts`). On mount `fetchBooks` runs automatically; user can retry.
2. List renders `ExportedBook[]`. User taps an item → `handleDownloadExport` calls `importBookFromExportUrl(exportUrl)`.
3. `importBookFromExportUrl` ensures `books/` and `download_books/` exist (`createFolderBooks`), derives filename via `getFilenameOfUrl`, builds `zipUri` via `getPathSaveZipBook`, downloads via `downloadFile` (`services/download.service.ts` → `expo-file-system` `File.downloadFileAsync`), unzips with `react-native-zip-archive` `unzip(zipUri, getFolderBooks(), 'UTF-8')`, then deletes ZIP via `deleteDownloadFile`.

## Contract

### Supabase book-list endpoint (`services/book-import.service.ts` → `GET_EXPORTED_BOOKS_URL`, `controllers/settings-schema.ts` → `DEFAULT_SETTINGS.BOOKS_API_URL`, `constants/setting-configs.ts`)

| Item | Value |
|---|---|
| Constant | `BOOKS_API_URL` — canonical source is `controllers/settings-schema.ts` `DEFAULT_SETTINGS.BOOKS_API_URL` = `https://iqtndkcyrsmptlrepaks.supabase.co/functions/v1/get-exported-books`. Mirrored in `services/book-import.service.ts` `GET_EXPORTED_BOOKS_URL` (fallback) and `constants/setting-configs.ts` (UI placeholder). Update all three together; `DEFAULT_SETTINGS` is the source of truth. |
| Request | `POST` to `booksApiUrl \|\| GET_EXPORTED_BOOKS_URL`, headers `{ "Content-Type": "application/json" }`, no body, no auth header |
| Response envelope | `ExportedBooksResponse` (`@types/book-import.ts`): `{ success: boolean, data: ExportedBook[], message?: string }` where `ExportedBook { id, bookId, exportUrl, fileSize, exportFormat, exportedAt, updatedAt, book: BookMeta }` and `BookMeta { id, name, slug, author, chapterCount, status, synopsis, lastUpdated }` |
| Success | `response.ok && result.success` → `ok(result.data ?? [])` |
| Failure | `!response.ok \|\| !result.success` → `fail('FETCH_EXPORTED_BOOKS_FAILED', result.message \|\| 'Không thể tải danh sách truyện có sẵn.')`; network/parse exception → `fail('FETCH_EXPORTED_BOOKS_FAILED', toErrorMessage(...))` |
| Import failure | Any step throws → `fail('IMPORT_BOOK_FAILED', toErrorMessage(error, 'Có lỗi xảy ra khi tải truyện.'))` |
| Idempotency | `unzip(downloadUri, getFolderBooks())` overwrites `books/<bookId>/` silently if same `bookId` re-imported — intentional per `docs/product/integrations.md` §1 Idempotency. Confirm-before-overwrite is product-owner decision; current behavior is replace-with-same-content. |

### Filesystem

| Path | Helper | Purpose |
|---|---|---|
| `Paths.document/books` | `getFolderBooks()` | Unzip destination; each book is a subdirectory with `book.json` + `chapters/` |
| `Paths.document/download_books` | `getFolderDownloadBooks()` | Temp ZIP location |
| `download_books/<filename>` | `getPathSaveZipBook(filename)` | ZIP built from `getFilenameOfUrl(exportUrl)` |

- `downloadFile(url, fileUri)` removes existing file at `fileUri` first, then `File.downloadFileAsync`.
- `deleteDownloadFile(uri)` deletes if exists; errors are logged, not thrown.

## Notes

- Evidence: `services/book-import.service.ts` (`fetchExportedBooks`, `importBookFromExportUrl`), `@types/book-import.ts`, `services/download.service.ts`, `hooks/use-add-book.ts`, `utils/file-system.helpers.ts`.
- Resolved — POST shape: Supabase function expects `POST` with `Content-Type: application/json` and no body (current `fetch` sends no `body`). Empty JSON `{}` is also accepted by the function but not sent — either succeeds; current no-body is canonical per service evidence.
- Resolved — overwrite: silent overwrite on `bookId` collision is intentional idempotent behavior (see Contract Idempotency row); change requires product-owner approval.

## Acceptance criteria
- [a1] App queries the available books list from the remote Supabase function endpoint.
- [a2] Selected book file (ZIP) is downloaded to local device filesystem storage.
- [a3] ZIP file is extracted, references are parsed, and the raw ZIP archive is cleaned up automatically.
