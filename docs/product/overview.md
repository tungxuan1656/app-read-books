# Product Overview — rn-read-books

> **Scope owner:** This file owns the product behavior overview. It describes what the app does, how users experience it, and the product rules that shape that behavior. For system topology, layer maps, and invariants see [ARCHITECTURE.md](../../ARCHITECTURE.md). For quickstart and scripts see [README.md](../../README.md). For checkable behavior see `docs/specs/<id>.md`.

## Purpose

rn-read-books is a React Native app built with Expo SDK 54. It helps users read books and novels on device. It adds AI features — translation and summarization — through a configurable OpenAI-compatible endpoint.

The app works offline after download. It stores books on the device file system. It caches AI results in SQLite so repeated reads are fast.

Default AI endpoint is `https://copilot.tungxuan.io.vn/v1/chat/completions` with model `gpt-4o`. The name is OpenAI-compatible to reflect the standard chat completion contract.

## Features

Features map one-to-one to tracked specs. This section summarizes behavior only. It does not repeat acceptance text.

- **Import via Supabase ZIP** — Fetch the list of available books from a remote Supabase Function. Download the selected book as a ZIP. Unzip it into the local app folder. Parse chapter references. Delete the ZIP after success. See [`book-import` spec](../specs/book-import.md).

- **Library list with swipe delete and BottomSheet** — Show all downloaded books with name, author, chapter count, and cover. Swipe left to delete a book and its folder. Open a BottomSheet to view metadata and the chapter index. See [`book-library` spec](../specs/book-library.md).

- **Reader with HTML render, navigation, and offset persistence** — Read raw chapter HTML in a WebView. Move between chapters with Previous and Next. Save scroll offset and restore it on reopen. Offer a quick-scroll to bottom. See [`book-reader` spec](../specs/book-reader.md).

- **AI reading modes with SQLite cache** — Support three modes: `none` (original text), `translate` (translate to natural Vietnamese), and `summary` (shorten to 50–60% length). Check SQLite first. On cache miss, read raw text, call the OpenAI-compatible provider, convert the result to HTML, save it, then render. See [`ai-reading` spec](../specs/ai-reading.md).

- **Chapter prefetch batch N=3, sequential and cancellable** — After the current chapter loads, prefetch the next N chapters (default 3). Batch-check SQLite to skip cached chapters. Process missing chapters one by one. Cancel the run if the user changes chapter or AI mode. See [`chapter-prefetch` spec](../specs/chapter-prefetch.md).

- **Settings management** — Configure AI, download, prefetch, and typography settings. Persist to MMKV and restore on launch. Sanitize and migrate older formats. See [`settings-management` spec](../specs/settings-management.md).

## UX Flows

### 4.1 App Launch and Initialization

This flow restores state and routes the user.

1. App starts. `app/_layout.tsx` shows the splash screen while it loads fonts (`APP_FONT_SOURCES`).
2. Zustand restores persisted state from MMKV via `controllers/mmkv.ts` and `controllers/stores/*`.
3. The layout checks `reading.onScreen` from `controllers/stores/reading.store.ts`:
   - If `true`, it pushes `/reading` with the saved `bookId` and hides the splash.
   - If `false`, it hides the splash and shows `/` (home library).
4. No network call happens at launch.

Code: `app/_layout.tsx`, `controllers/stores/reading.store.ts`, `controllers/mmkv.ts`

### 4.2 Book Download Flow

This flow adds a new book to the local library.

1. User opens Add Book at `app/add-book/index.tsx`.
2. Hook `hooks/use-add-book.ts` calls `services/book-import.service.ts` (`fetchExportedBooks`) to fetch the list. It POSTs JSON to `BOOKS_API_URL` and expects `{ success, data, message }`.
3. User picks a book. The app calls `services/book-import.service.ts` (`importBookFromExportUrl`):
   - Ensure the books folder exists (`utils` → `createFolderBooks`).
   - Download the ZIP to the cache path (`services/download.service.ts` → `downloadFile`, `getPathSaveZipBook`).
   - Unzip into the books folder (`react-native-zip-archive` → `unzip` to `getFolderBooks()`).
   - Delete the ZIP file (`deleteDownloadFile`).
4. The library updates. The new book appears on `app/index.tsx` via `controllers/stores/books.store.ts`.

Code: `app/add-book/index.tsx`, `hooks/use-add-book.ts`, `services/book-import.service.ts`, `services/download.service.ts`, `utils/*`

### 4.3 Reading and AI Processing Flow

This flow renders a chapter and applies AI when needed.

1. User opens the reader at `app/reading/index.tsx` with `bookId`. The current chapter comes from `controllers/stores/books.store.ts` (`id2BookReadingChapter[bookId]`).
2. Hook `hooks/use-reading-content.ts` runs:
   - It reads `readingAIMode` from `controllers/stores/reading.store.ts`.
   - If mode is `none`, it calls `services/reading.service.ts` → `getReadingContent`, which reads raw HTML from the file system (`utils` → `getBookChapterContent`).
   - If mode is `translate` or `summary`, it calls `services/content-processor.ts` → `processChapterContent`:
     1. Query SQLite for a cached `ProcessedChapter` (`services/database.service.ts` → `getProcessedChapter`). On hit, return it.
     2. On miss, read raw content from the file system.
     3. Call the OpenAI-compatible provider (`services/ai-providers/openai.provider.ts` via `services/ai.service.ts` → `getAIProviderByType('openai')` → `processContent(prompt, rawContent)`). The provider chunks text by `AI_MIN_CHUNK_SIZE` and merges `AI_CUSTOM_HEADERS` and `AI_EXTRA_BODY` into the request.
     4. Convert the result to HTML (`utils/string.helpers.ts` → `simpleMdToHtml`).
     5. Save to SQLite (`saveProcessedChapter`) and return it.
3. The hook wraps the result with `getChapterHtml` and sets it to state. The screen renders it in a WebView.
4. Navigation (`hooks/use-reading-navigation.ts`) updates the chapter index in `books.store.ts`.
5. Scroll offset saves to the reading store and restores on reopen.
6. After the chapter is ready, `hooks/use-chapter-prefetch.ts` may run (see next section).

Code: `app/reading/index.tsx`, `hooks/use-reading-content.ts`, `hooks/use-reading-navigation.ts`, `services/reading.service.ts`, `services/content-processor.ts`, `services/database.service.ts`, `services/ai-providers/openai.provider.ts`, `utils/string.helpers.ts`

### 4.4 Prefetch Flow (Background)

1. `hooks/use-chapter-prefetch.ts` triggers only when the current chapter is ready, the book exists, and `readingAIMode` is not `none`.
2. It computes the next N chapters (`N = PREFETCH_COUNT`, default `3`) from `controllers/settings-schema.ts` via `controllers/stores/settings.store.ts`.
3. It batch-checks SQLite (`dbService.getChaptersCacheStatus`) for those chapters.
4. It filters out cached chapters and processes the rest one by one via `services/reading.service.ts` → `getReadingContent`.
5. It updates progress in `controllers/stores/prefetch.store.ts` and stops early if the chapter or mode changes (`isCancelled` flag and `runIdRef`).

Code: `hooks/use-chapter-prefetch.ts`, `services/database.service.ts`, `services/reading.service.ts`, `controllers/stores/prefetch.store.ts`

## Product Rules

These rules shape product behavior. They come from `controllers/settings-schema.ts`. For storage and layer invariants see `ARCHITECTURE.md`.

| Key | Default | Rule |
|---|---|---|
| `OPENAI_API_URL` | `https://copilot.tungxuan.io.vn/v1/chat/completions` | OpenAI-compatible chat completion endpoint. The app POSTs chat completion payloads here. |
| `OPENAI_MODEL` | `gpt-4o` | Model name sent in each AI request. |
| `AI_CUSTOM_HEADERS` | `""` (empty JSON string) | If set, parse as JSON and merge into request headers. |
| `AI_EXTRA_BODY` | `{"thinking":{"type":"disabled"},"stream":false}` | If set, parse as JSON and merge into the request body. |
| `BOOKS_API_URL` | `https://iqtndkcyrsmptlrepaks.supabase.co/functions/v1/get-exported-books` | Supabase Function endpoint for book list. The app POSTs JSON and handles `{ success, data, message }`. |
| `PREFETCH_COUNT` | `"3"` | Number of upcoming chapters to prefetch. Stored as a string. |
| `AI_PROVIDER` | `"openai"` | Provider key. Only `openai` is active. The app normalizes any value to `openai`. |
| `AI_PROCESS_ACTIONS` | Two actions: `translate` and `summary` | Each action has `key`, `name`, and `prompt`. Prompts define translation and summarization rules. Users can edit them in settings (`app/setting-editor/index.tsx`). |
| `AI_MIN_CHUNK_SIZE` | `"1300"` | Minimum characters per chunk before sending to the AI. Stored as a string. |
| `APP_STORE_VERSION` | `5` | Schema version. The app sanitizes and migrates older persisted settings on launch (`sanitizeSettings`, `migratePersistedSettings`). |

Other rules:

- AI translation keeps all honorifics (ta, nguoi, han, etc.) unchanged, replaces Sino-Vietnamese syntax with natural Vietnamese, and keeps names, places, and terms intact.
- AI summary keeps plot order, keeps key events and key dialog, and cuts only long descriptions and repeated emotions.
- Prefetch never runs for mode `none`.
- SQLite table `processed_chapters` is the only AI cache layer.

## Glossary

| Term | Definition |
|---|---|
| **Book** | A downloaded novel. It has an id, name, author, cover, description, and a list of chapter names (`references`). Stored as a folder on device. |
| **Chapter** | One unit of a book. It has an index (1-based) and HTML content on disk. The current chapter per book is tracked in `books.store.ts`. |
| **AIMode** | The reading mode. Values: `none` (original), `translate`, `summary` (keys from `AI_PROCESS_ACTIONS`). Stored in `reading.store.ts` as `readingAIMode`. |
| **AIAction** | A configurable AI operation. Shape: `{ key, name, prompt }`. Defaults are `translate` and `summary`. |
| **ProcessedChapter** | AI result for one chapter and one mode. Stored in SQLite with `bookId`, `chapterNumber`, `actionKey`, and HTML content. |
| **Prefetch** | Background work that prepares the next N chapters for the current AI mode. It checks cache, processes missing items in sequence, and can cancel. |
| **Reading Session** | Persisted state in `reading.store.ts`: `bookId`, `chapterNumber`, `scrollOffset`, and `onScreen`. It drives launch routing. |
| **MMKV** | Fast key-value storage for settings and small state. Used for `books`, `reading`, `settings`, `typography` stores. |
| **SQLite** | Local database (`expo-sqlite`) that caches processed AI chapters. |
| **OpenAI-compatible** | A chat completion API that matches the OpenAI request and response format. The app sends `OPENAI_MODEL`, `prompt`, and raw content through this contract. |

## Links

- **Architecture and topology:** [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — layer map, dependency direction, stores, reading pipeline, invariants.
- **Quickstart and scripts:** [`README.md`](../../README.md) — install, run, lint, type-check, Fastlane lanes.
- **Engineering standards:** [`docs/references/README.md`](../references/README.md) — patterns for hooks, services, stores, and navigation.
- **Feature specs (behavior source of truth):**
  - [`settings-management`](../specs/settings-management.md) — settings schema, persistence, sanitize and migrate
  - [`book-import`](../specs/book-import.md) — fetch list, download ZIP, unzip, parse, clean up
  - [`book-library`](../specs/book-library.md) — list display, swipe delete, BottomSheet details
  - [`book-reader`](../specs/book-reader.md) — HTML render, chapter nav, scroll offset
  - [`ai-reading`](../specs/ai-reading.md) — provider payload, mode switch, SQLite cache
  - [`chapter-prefetch`](../specs/chapter-prefetch.md) — trigger, batch cache check, sequential run, cancel on change
- **Feature inventory:** [`harness/manifest.json`](../../harness/manifest.json)
