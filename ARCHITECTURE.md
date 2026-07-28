# Architecture — rn-read-books

React Native (Expo SDK 54) app for reading books/novels with AI-powered translation and summarization.

## Stack

| Concern | Technology |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Language | TypeScript |
| Navigation | Expo Router (file-based, `app/`) |
| State | Zustand + MMKV persistence |
| Storage: settings/state | MMKV (`react-native-mmkv`) |
| Storage: book files | Expo File System |
| Storage: AI cache | SQLite (`expo-sqlite`) |
| AI | OpenAI-compatible chat completion (configurable URL/model) |
| UI | NativeWind (TailwindCSS), Gesture Handler, BottomSheet |

## Layer Map

```
app/               Route screens — composition + navigation only
  _layout.tsx      Root layout, font loading, startup routing
  index.tsx        Home: book list
  reading/         Reading screen
  add-book/        Download book screen
  settings/        App settings
  setting-editor/  Inline editor for AI actions/prompts
  references/      Chapter index/reference viewer

components/        Reusable presentational components
hooks/             Screen orchestration, lifecycle, cancellation
services/          Business logic, IO, AI processing, SQLite cache
controllers/
  mmkv.ts          MMKV Zustand storage adapter
  settings-schema.ts  AppSettings type, defaults, sanitize, migrate
  stores/          One Zustand store per domain
utils/             Pure helpers, logger, file system helpers
constants/         App-level constants, font sources
@types/            Shared TypeScript declarations
```

## Key Stores (`controllers/stores/`)

| Store | Persisted | Description |
|---|---|---|
| `books.store.ts` | MMKV | Book list, reading chapter per book |
| `reading.store.ts` | MMKV | readingAIMode, reading session (bookId, offset, onScreen) |
| `settings.store.ts` | MMKV | AI and app settings (AppSettings) |
| `typography.store.ts` | MMKV | Font size, line height |
| `prefetch.store.ts` | no | Prefetch progress (runtime only) |
| `ui-runtime.store.ts` | no | Transient UI flags (contentReloadToken) |

## Reading Pipeline

```
useReadingContent (hook)
  → reading.service.ts → mode dispatch
    · "none"  → getChapterHtml() from FileSystem
    · "translate" / "summary"
        → content-processor.ts
            1. dbService.getProcessedChapter() — SQLite cache hit?
            2. getBookChapterContent() — read raw HTML from FileSystem
            3. getAIProviderByType('openai').processContent() — call AI
            4. dbService.saveProcessedChapter() — write cache
```

### Prefetch
- `useChapterPrefetch` runs after current chapter is ready
- Batch-checks SQLite for next N chapters (configurable via `PREFETCH_COUNT`)
- Processes only missing chapters, sequentially
- Cancels on mode/chapter change via `isCancelled` flag

## Startup Routing

`_layout.tsx` (after fonts loaded):
- Reads `reading.onScreen` from `useReadingStore`
- If `true` → `router.push('/reading', { bookId })` then hide splash
- If `false` → hide splash, show `/` (home)

## Settings Keys (`AppSettings`)

| Key | Default | Description |
|---|---|---|
| `OPENAI_API_URL` | `https://copilot.tungxuan.io.vn/v1/chat/completions` | AI endpoint |
| `OPENAI_MODEL` | `gpt-4o` | AI model |
| `AI_CUSTOM_HEADERS` | `""` | Extra request headers (JSON) |
| `AI_EXTRA_BODY` | `{"thinking":…}` | Extra request body fields |
| `BOOKS_API_URL` | Supabase Function URL | Book list + download endpoint |
| `PREFETCH_COUNT` | `"3"` | Chapters to prefetch ahead |
| `AI_PROVIDER` | `"openai"` | Provider key (currently only openai) |
| `AI_PROCESS_ACTIONS` | `[translate, summary]` | Configurable AI action prompts |
| `AI_MIN_CHUNK_SIZE` | `"1300"` | Min characters before chunking |

## Invariants

- Route files MUST NOT call remote APIs directly.
- All IO goes through `services/`.
- Hooks orchestrate UI + store + service; no raw `fetch` in hooks.
- Every store change that affects persistence needs a `sanitize`/`migrate` path in `settings-schema.ts`.
- SQLite `processed_chapters` is the only AI cache layer — no duplicates in MMKV.

## References

- `docs/references/` — coding and pattern standards
- `docs/PROJECT_DOCS.md` — product description (Vietnamese)
- `harness/manifest.json` — feature inventory
- `harness/checks.json` — automated quality gates
