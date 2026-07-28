# Architecture Ownership Map

## Goal
Define clear ownership boundaries to keep screens lean and enforce service-first architecture.

## Layer Ownership
- `app/*`: Route composition, navigation, screen wiring, and UI-only concerns.
- `components/*`: Reusable presentational and interaction components.
- `hooks/*`: Screen orchestration, lifecycle control, cancellation, and store/service coordination.
- `services/*`: Business logic, network IO, file/database IO, provider integrations.
- `controllers/stores/*`: App-level Zustand state, persistence adapters, and schema migrations.
- `utils/*`: Pure helpers and non-domain shared utilities.

## Rules
- Route files MUST NOT call remote APIs directly.
- Route files MUST NOT contain business workflows (download pipeline, AI processing orchestration, cache mutation flow).
- Hooks SHOULD be the only place that composes UI events + store actions + services.
- Services SHOULD return stable result contracts (`ok/data` or `ok/error`) for UI orchestration.
- Persistence schema changes MUST include migration handling in `controllers/settings-schema.ts`.

## Current Module Mapping

### Reading pipeline
- `hooks/use-reading-content.ts` — orchestrates mode selection, loads chapter content
- `hooks/use-chapter-prefetch.ts` — background prefetch for N next chapters into SQLite
- `hooks/use-reading-navigation.ts` — next/previous chapter navigation
- `services/reading.service.ts` — dispatches to raw read or AI processing
- `services/content-processor.ts` — cache-first AI processing (dedup pending requests)
- `services/database.service.ts` — SQLite CRUD for `processed_chapters` cache

### AI integration
- `services/ai.service.ts` — provider registry facade
- `services/ai-provider-registry.ts` — lazy singleton registry
- `services/ai-providers/openai.provider.ts` — OpenAI-compatible chat completion
- `services/ai-actions.service.ts` — resolves `AIAction` prompts from settings

### Book management
- `hooks/use-add-book.ts` — import flow orchestration
- `services/book-import.service.ts` — fetch list from Supabase endpoint + download/unzip

### State
- `controllers/stores/books.store.ts` — book list, reading chapter per book (MMKV-persisted)
- `controllers/stores/reading.store.ts` — readingAIMode, reading session (MMKV-persisted)
- `controllers/stores/settings.store.ts` — app settings (MMKV-persisted)
- `controllers/stores/typography.store.ts` — font size, line height (MMKV-persisted)
- `controllers/stores/prefetch.store.ts` — prefetch progress (runtime only)
- `controllers/stores/ui-runtime.store.ts` — transient UI flags (e.g. contentReloadToken)

### Settings schema
- `controllers/settings-schema.ts` — `AppSettings` defaults, `sanitizeSettings`, `migratePersistedSettings`
