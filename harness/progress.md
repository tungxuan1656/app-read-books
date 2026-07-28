# Harness progress

This log records brief, dated operational updates. The canonical feature state is in
`harness/manifest.json`; acceptance evidence is in `harness/work/<id>.json`.

## Current focus

- No tracked features have been admitted yet.
- Run `node harness/scripts/validate.mjs .` after adding a feature to the manifest.
- Run `node harness/scripts/run-checks.mjs . --profile quick` to verify lint + tsc.

## Manual acceptance checks (device-dependent, cannot be automated via CLI)

These checks require a physical device or simulator and are verified manually:

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

## Updates

### 2026-07-28 — Harness bootstrap

- Deleted old `AGENTS.md` (verbose rule-set format) and `docs/setup-eslint-nativewind.md` (surplus setup guide for other projects).
- Scaffolded canonical v1.0 harness via `harness-init` skill.
- `harness/checks.json`: 2 automatable CLI checks (lint, tsc). Manual checks documented above.
- `harness/manifest.json`: empty — no features tracked yet.
- Harness validation: **passed** (`node harness/scripts/validate.mjs .` → exit 0).
