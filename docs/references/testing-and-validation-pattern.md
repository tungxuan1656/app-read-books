# Testing and Validation Pattern

## 1) Baseline Commands

- Type check: `pnpm run tsc-check`
- Lint: `pnpm run lint`
- Tests: `pnpm test` (targeted tests for changed modules)

Both `pnpm run lint` and `pnpm run tsc-check` are configured and required. See `harness/checks.json`.

## 2) Required Validation Before Merge

- Run `pnpm run lint`.
- Run `pnpm run tsc-check` for every code change.
- Run targeted tests for affected modules.
- For critical flow changes (reading, download), run manual smoke checks on at least one platform (iOS simulator or Android emulator).

## 3) What to Test First

- Hooks with orchestration logic:
  - loading states
  - error propagation
  - cancellation behavior
- Services with side effects:
  - cache hit and miss
  - fallback paths
  - retry and timeout handling
- Store actions:
  - partial updates
  - persistence-sensitive fields

## 4) Verification Workflow (Refactor Baseline)

Use this before and after architecture refactors:

1. Run automated checks: `pnpm run lint`, `pnpm run tsc-check`, targeted tests.
2. Run manual smoke checks (see section 5).
3. Run architecture regression checks:
   - No direct `fetch` calls inside `app/*`
   - Route files contain composition and navigation only
   - Service functions return normalized result or error shape where added
   - Store persistence changes include versioned migration in `controllers/settings-schema.ts`

## 5) Manual Smoke Checklist

Single source for device checks: `harness/progress.md` — Manual acceptance checks table.

That table is the only maintained copy. Do not duplicate it here. Quick summary of what it covers:

- App startup and initial route (`/` vs `/reading` resume)
- Open a book and navigate chapters (next/previous) with offset restore
- AI modes `none/translate/summary` return expected content
- Prefetch updates progress and does not crash when mode or chapter changes
- Add-book flow: fetch list, download, import, back to library
- Cache manager clear actions complete without stale UI

For full device gate steps, open `harness/progress.md`.

## 6) Failure Reporting

Include:

- command run
- concise error summary
- impacted module or flow
- reproduction steps
