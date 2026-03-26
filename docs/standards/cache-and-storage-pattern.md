# Cache and Storage Pattern

## 1) Storage Layers in This Project

- **MMKV**: lightweight persisted app state/config (`controllers/mmkv.ts`, `controllers/store.ts`).
- **File System**: books, chapters, generated audio files (`utils/file-system.helpers.ts`).
- **SQLite**: processed chapter cache/index (`services/database.service.ts`).

## 2) Rules

- Choose storage by data type:
  - settings/preferences -> MMKV
  - large files/binary -> FileSystem
  - indexed/queryable processed content -> SQLite
- Do not duplicate the same cached data in multiple layers without reason.
- Always check cache before expensive AI/TTS processing.

## 3) Cache Lifecycle

- On read:
  1. check memory/local cache
  2. fallback to persistent cache
  3. fallback to remote processing
- On write:
  - write atomically when possible
  - avoid partial writes for critical records
- On clear:
  - provide user-triggered cleanup path in settings
  - keep clear methods scoped (`clearChapterCache`, `clearBookCache`, etc.)

## 4) Error Handling

- Cache miss is not an error by itself.
- Distinguish:
  - cache miss
  - recoverable storage error
  - corrupted data
- Log technical error details; show concise message to users.

## 5) Checklist

- [ ] Correct storage layer selected.
- [ ] Cache-first read path implemented.
- [ ] Clear/invalidate path exists and is testable.
- [ ] Error handling differentiates miss vs failure.
