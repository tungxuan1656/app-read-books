# Testing and Validation Pattern

## 1) Baseline Commands

- Type check: `pnpm run tsc-check`
- Lint: `pnpm run lint`
- Tests: `pnpm test` (targeted tests for changed modules)

Both `pnpm run lint` and `pnpm run tsc-check` are configured and required. See `./init.sh`.

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

Manual acceptance checks (device-dependent, cannot be automated via CLI). This table is the canonical copy:

| ID | Description | Gate |
|---|---|---|
| reading-none-mode | Reading screen shows raw chapter HTML in None mode | App launch + chapter open |
| reading-translate-mode | Translate mode calls Copilot API and renders translated HTML | Copilot API configured |
| reading-summary-mode | Summary mode calls Copilot API and renders summary text | Copilot API configured |
| book-download-unzip | Add-book screen downloads zip, unzips, updates library | Supabase Anon Key configured |
| reading-position-restore | Scroll offset persists and restores on reopen | Any book, any chapter |
| prefetch-cache-hit | SQLite cache hit: next chapter loads instantly after prefetch | Translate/Summary mode |
| settings-persist-mmkv | All settings survive app restart via MMKV | Full app restart |
| startup-resume-reading | App resumes to /reading when reading.onScreen is set | Force-quit + reopen |

## 6) Failure Reporting

Include:

- command run
- concise error summary
- impacted module or flow
- reproduction steps
