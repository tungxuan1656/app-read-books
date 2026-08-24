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
| Constant | `BOOKS_API_URL` — duplicated in 3 places (service fallback `GET_EXPORTED_BOOKS_URL`, settings default, settings-config placeholder). Canonical URL: `https://iqtndkcyrsmptlrepaks.supabase.co/functions/v1/get-exported-books` |
| Request | `POST` to `booksApiUrl \|\| GET_EXPORTED_BOOKS_URL`, headers `{ "Content-Type": "application/json" }`, no body, no auth header |
| Response envelope | `ExportedBooksResponse` (`@types/book-import.ts`): `{ success: boolean, data: ExportedBook[], message?: string }` where `ExportedBook { id, bookId, exportUrl, fileSize, exportFormat, exportedAt, updatedAt, book: BookMeta }` and `BookMeta { id, name, slug, author, chapterCount, status, synopsis, lastUpdated }` |
| Success | `response.ok && result.success` → `ok(result.data ?? [])` |
| Failure | `!response.ok \|\| !result.success` → `fail('FETCH_EXPORTED_BOOKS_FAILED', result.message \|\| 'Không thể tải danh sách truyện có sẵn.')`; network/parse exception → `fail('FETCH_EXPORTED_BOOKS_FAILED', toErrorMessage(...))` |
| Import failure | Any step throws → `fail('IMPORT_BOOK_FAILED', toErrorMessage(error, 'Có lỗi xảy ra khi tải truyện.'))` |

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
- The endpoint expects POST with no body — double-check if empty JSON `{}` is ever required by the Supabase function.
- Open question: ZIP extraction overwrites silently if book ID collides — should import check for existing `books/<bookId>` and confirm overwrite?

## Acceptance criteria
- [a1] App queries the available books list from the remote Supabase function endpoint.
- [a2] Selected book file (ZIP) is downloaded to local device filesystem storage.
- [a3] ZIP file is extracted, references are parsed, and the raw ZIP archive is cleaned up automatically.
