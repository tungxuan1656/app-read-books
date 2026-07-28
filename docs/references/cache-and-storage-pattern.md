# Cache and Storage Pattern

## 1) Storage Layers in This Project

| Layer | Library | Used For | Path |
|---|---|---|---|
| **MMKV** | `react-native-mmkv` | App state, settings, preferences | `controllers/mmkv.ts` |
| **File System** | `expo-file-system` | Book zip downloads, chapter HTML files | `utils/file-system.helpers.ts` |
| **SQLite** | `expo-sqlite` | Processed chapter cache (AI translate/summary) | `services/database.service.ts` |

## 2) Rules

- Choose storage by data type:
  - settings/preferences → MMKV (via Zustand persist)
  - large files/binary chapter content → FileSystem
  - indexed/queryable AI-processed content → SQLite (`processed_chapters` table)
- Do not duplicate the same cached data in multiple layers without reason.
- Always check SQLite cache before expensive AI processing (`content-processor.ts` does this automatically).

## 3) SQLite Schema

Table: `processed_chapters`

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `book_id` | TEXT | Book identifier |
| `chapter_number` | INTEGER | 1-based chapter index |
| `mode` | TEXT | AI action key (`translate`, `summary`) |
| `content` | TEXT | Processed HTML content |
| `content_hash` | TEXT | Hash for change detection |
| `created_at` | INTEGER | Unix ms |
| `updated_at` | INTEGER | Unix ms |

Unique constraint: `(book_id, chapter_number, mode)`.

## 4) Cache Lifecycle

- On read:
  1. check SQLite for processed chapter → return immediately if hit
  2. read raw chapter HTML from FileSystem
  3. send to AI provider
  4. save result to SQLite
- On clear:
  - provide user-triggered cleanup in Settings → Cache Manager
  - scoped clear methods: `clearBookCache(bookId, mode?)`, `clearAllCache()`
- Deduplication: `content-processor.ts` uses an in-memory `pendingRequests` map to prevent double-processing the same chapter concurrently

## 5) Error Handling

- Cache miss is not an error.
- Distinguish:
  - cache miss → proceed to fetch/process
  - recoverable storage error → log, return `null`/empty, let caller handle
  - corrupted data → treat as miss
- Log technical details via `logger`; show concise message to users.

## 6) Checklist

- [ ] Correct storage layer selected.
- [ ] Cache-first read path implemented (`dbService.getProcessedChapter` before AI call).
- [ ] Clear/invalidate path exists and is user-accessible.
- [ ] Error handling differentiates miss vs failure.
- [ ] Concurrent requests for the same chapter are deduplicated.
