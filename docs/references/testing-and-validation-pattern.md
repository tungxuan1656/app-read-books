# Testing and Validation Pattern

## 1) Baseline Commands

- Type check: `pnpm run tsc-check`
- Tests: `pnpm test`
- Lint: `pnpm run lint` (when ESLint is fully configured in this repo)

## 2) Required Validation Before Merge

- Run `pnpm run tsc-check` for every code change.
- Run targeted tests for affected modules.
- For critical flow changes (reading, download), run manual smoke checks on
  at least one platform (iOS simulator or Android emulator).

## 3) What to Test First

- Hooks with orchestration logic:
  - loading states
  - error propagation
  - cancellation behavior
- Services with side effects:
  - cache hit/miss
  - fallback paths
  - retry/timeout handling
- Store actions:
  - partial updates
  - persistence-sensitive fields

## 4) Manual Smoke Checklist

- [ ] App startup + initial route works.
- [ ] Open book and switch chapters.
- [ ] AI mode (none/translate/summary) loads expected content.
- [ ] Cache manager actions complete without crash.

## 5) Failure Reporting

- Include:
  - command run
  - concise error summary
  - impacted module/flow
  - reproduction steps
