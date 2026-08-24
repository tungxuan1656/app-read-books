# Feature: settings-management

## Behavior

App-wide settings define defaults for AI and book import. Keys cover API URLs, AI provider, prompts, prefetch count, and typography. Typography is stored separately from app settings. All values have safe fallbacks in code.

## Flow

1. App launches → `useSettingsStore` (zustand + `persist`) loads `settings-storage` from MMKV via `MMKVStateStorage`.
2. `migrate` and `merge` both call `sanitizeSettings` / `migratePersistedSettings` to normalize persisted data before use (`controllers/stores/settings.store.ts`).
3. User edits in Settings UI → `settingsActions.updateSetting(s)` writes back to MMKV. `persist` `partialize` saves only `settings` + `networkLoggerEnabled`.
4. Typography flow is parallel: `useTypographyStore` persists `typography` under `typography-storage` via same `MMKVStateStorage` (`controllers/stores/typography.store.ts`).

## Contract

### AppSettings keys (`controllers/settings-schema.ts` → `DEFAULT_SETTINGS`, `@types/settings.ts`)

| Key | Type | Default | Source |
|---|---|---|---|
| `OPENAI_API_URL` | string | `https://copilot.tungxuan.io.vn/v1/chat/completions` | OpenAI-compatible endpoint |
| `OPENAI_MODEL` | string | `gpt-4o` | Model name |
| `BOOKS_API_URL` | string | `https://iqtndkcyrsmptlrepaks.supabase.co/functions/v1/get-exported-books` | Supabase function (see book-import) |
| `PREFETCH_COUNT` | string (numeric) | `3` | Prefetch batch size |
| `AI_PROVIDER` | `'openai'` | `openai` | Only `openai` is accepted (`normalizeAIProvider` forces it) |
| `AI_PROCESS_ACTIONS` | `AIAction[]` | 2 defaults: `translate` + `summary` with Vietnamese prompts | Each action `{key, name, prompt}` |
| `AI_MIN_CHUNK_SIZE` | string (numeric) | `1300` | Avg chunk size for AI chunking |
| `AI_CUSTOM_HEADERS` | string (JSON) | `''` | Parsed via `getSharedCustomHeaders` |
| `AI_EXTRA_BODY` | string (JSON) | `{"thinking":{"type":"disabled"},"stream":false}` | Parsed via `getSharedExtraBody` |

Legacy keys mapped in `sanitizeSettings`: `COPILOT_CUSTOM_HEADERS` → `AI_CUSTOM_HEADERS`, `COPILOT_MIN_CHUNK_SIZE` → `AI_MIN_CHUNK_SIZE`.

### Persistence

| Aspect | Value |
|---|---|
| Store | `MMKV` (`react-native-mmkv`) wrapped by `MMKVStorage` / `MMKVStateStorage` (`controllers/mmkv.ts`, keys prefixed `MMKV-`) |
| Settings key | `settings-storage`, version `APP_STORE_VERSION = 5` |
| Typography key | `typography-storage`, version `1`, default `{font:'Inter', fontSize:24, lineHeight:1.5, letterSpacing:0}` |
| Sanitization | `sanitizeSettings(value)` coerces every field to string via `toStringValue`; `normalizeAIActions` accepts array or JSON string, falls back to defaults if empty/invalid |

## Notes

- Evidence: `controllers/settings-schema.ts` (defaults, `sanitizeSettings`, `migratePersistedSettings`, sanitization of legacy keys), `controllers/mmkv.ts` (`MMKVStateStorage`), `controllers/stores/settings.store.ts` and `typography.store.ts`.
- `AI_PROVIDER` is locked to `openai`; picker UI exists but value is normalized away — intentional until new providers are added.
- Resolved — `BOOKS_API_URL` validation: `sanitizeSettings` accepts any non-empty string via `toStringValue`; no HTTPS/Supabase-shape enforcement — intentional for configurability (any `POST` endpoint allowed). Invalid URL surfaces as `FETCH_EXPORTED_BOOKS_FAILED` at fetch time; enforcement would require product/tech decision.

## Acceptance criteria
- [a1] App settings schema defines default API URLs, prefetch count, AI provider, prompts, and typography rules.
- [a2] App settings are persisted to MMKV storage and successfully restored upon app launch.
- [a3] Input settings are sanitized and migrated from older schema formats correctly.
