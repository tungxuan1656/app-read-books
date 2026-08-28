# Architecture — rn-read-books

React Native (Expo SDK 54) app for reading books/novels with AI-powered translation and summarization via OpenAI-compatible endpoint.

## Stack

| Concern | Technology |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Language | TypeScript 5.9 |
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

This file is the sole owner of the layer map, dependency direction, and invariants. See `docs/references/architecture-ownership-map.md` for subsystem ownership details only — it must not duplicate invariants or layer definitions.

## Dependency Direction

Allowed:

- `app/*` → `hooks/*` → `services/*` → storage/network (FileSystem, SQLite, fetch)
- `app/*` → `components/*`
- `hooks/*` → `controllers/stores/*` → `controllers/mmkv.ts` + `controllers/settings-schema.ts`
- `services/*` → `controllers/settings-schema.ts` (read config), `utils/*`

Forbidden:

- `app/*` ✕ direct `fetch`/remote API calls (all IO through `services/`)
- `app/*` ✕ business workflows (download, AI orchestration, cache mutation)
- `hooks/*` ✕ raw `fetch` (use `services/`)
- `components/*` ✕ `services/*` or stores (receive props/callbacks only)
- `services/*` ✕ `hooks/*` or `app/*` imports

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

## Settings Keys (`AppSettings` — `controllers/settings-schema.ts`)

| Key | Default | Description |
|---|---|---|
| `OPENAI_API_URL` | `https://copilot.tungxuan.io.vn/v1/chat/completions` | OpenAI-compatible endpoint |
| `OPENAI_MODEL` | `gpt-4o` | Model name |
| `AI_CUSTOM_HEADERS` | `""` | Extra request headers (JSON string) |
| `AI_EXTRA_BODY` | `{"thinking":…}` | Extra request body fields (merged) |
| `BOOKS_API_URL` | Supabase Function URL | Book list + download endpoint |
| `PREFETCH_COUNT` | `"3"` | Chapters to prefetch ahead |
| `AI_PROVIDER` | `"openai"` | Provider key (currently only openai) |
| `AI_PROCESS_ACTIONS` | `[translate, summary]` | Configurable AI action prompts |
| `AI_MIN_CHUNK_SIZE` | `"1300"` | Min characters before chunking |

## Integrations

| Integration | Contract | Config source | Spec |
|---|---|---|---|
| Supabase book API | POST JSON to `BOOKS_API_URL`; response `{ success, data, message }`; list → download ZIP → unzip → parse references | `controllers/settings-schema.ts` → `DEFAULT_SETTINGS.BOOKS_API_URL`, `sanitizeSettings` | `docs/specs/book-import.md` |
| OpenAI-compatible AI | POST chat completion to `OPENAI_API_URL` with `OPENAI_MODEL`; merges `AI_CUSTOM_HEADERS` (JSON) into headers and `AI_EXTRA_BODY` (JSON) into body; chunks by `AI_MIN_CHUNK_SIZE`; provider `openai` via `services/ai-providers/openai.provider.ts` | `controllers/settings-schema.ts` → `OPENAI_API_URL`, `OPENAI_MODEL`, `AI_CUSTOM_HEADERS`, `AI_EXTRA_BODY`, `AI_MIN_CHUNK_SIZE`, `AI_PROCESS_ACTIONS` | `docs/specs/ai-reading.md` |

## Invariants

- Route files MUST NOT call remote APIs directly.
- All IO goes through `services/`.
- Hooks orchestrate UI + store + service; no raw `fetch` in hooks.
- Every store change that affects persistence needs a `sanitize`/`migrate` path in `settings-schema.ts`.
- SQLite `processed_chapters` is the only AI cache layer — no duplicates in MMKV.

## Related Docs

- Product overview → `docs/product/overview.md`
- Engineering standards → `docs/references/README.md`
- Feature inventory → `feature_index.json`
- Quality gates → `./init.sh`
