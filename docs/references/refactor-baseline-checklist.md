# Refactor Baseline Checklist

Use this checklist before and after architecture refactors.

## Automated Checks
- [ ] `pnpm run lint`
- [ ] `pnpm run tsc-check`
- [ ] Targeted tests for changed modules

## Manual Smoke Checks
- [ ] App startup route decision works (`/` vs `/reading` resume)
- [ ] Open a book and navigate chapters (next/previous)
- [ ] Reading offset restore still works
- [ ] AI modes `none/translate/summary` return expected content
- [ ] Prefetch updates progress and does not crash when mode/chapter changes
- [ ] Add-book flow: fetch list, download, import, back to library
- [ ] Cache manager clear actions complete without stale UI

## Architecture Regression Checks
- [ ] No direct `fetch` calls inside `app/*`
- [ ] Route files contain composition/navigation only
- [ ] Service functions return normalized result/error shape where added
- [ ] Store persistence changes include versioned migration
