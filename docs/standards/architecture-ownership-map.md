# Architecture Ownership Map

## Goal
Define clear ownership boundaries to keep screens lean and enforce service-first architecture.

## Layer Ownership
- `app/*`: Route composition, navigation, screen wiring, and UI-only concerns.
- `components/*`: Reusable presentational and interaction components.
- `hooks/*`: Screen orchestration, lifecycle control, cancellation, and store/service coordination.
- `services/*`: Business logic, network IO, file/database IO, provider integrations.
- `controllers/*`: App-level state, persistence adapters, and state migrations.
- `utils/*`: Pure helpers and non-domain shared utilities.

## Rules
- Route files MUST NOT call remote APIs directly.
- Route files MUST NOT contain business workflows (download pipeline, AI processing orchestration, cache mutation flow).
- Hooks SHOULD be the only place that composes UI events + store actions + services.
- Services SHOULD return stable result contracts (`ok/data` or `ok/error`) for UI orchestration.
- Persistence schema changes MUST include migration handling.

## Current Module Mapping
- Reading pipeline: `hooks/use-reading-content.ts`, `hooks/use-chapter-prefetch.ts`, `services/reading.service.ts`, `services/content-processor.ts`.
- Add-book workflow: `hooks/use-add-book.ts`, `services/book-import.service.ts`.
- Settings schema and migration: `controllers/settings-schema.ts`, `controllers/store.ts`.
