# Canonical tree and gates

## Standard tree

```text
AGENTS.md
ARCHITECTURE.md                                      # optional
init.mjs                                              # optional root entrypoint
harness/
  manifest.json
  checks.json
  progress.md
  schemas/{manifest,checks,work}.schema.json
  scripts/{validate,run-checks}.mjs
  work/<id>.json
  work/receipts/*.json                                # only after a check has actually run
docs/
  specs/<id>.md
  plans/YYYY-MM-DD--plan--<subject-id>--<intent>.md
  references/<topic>.md
```

Do not create empty `ARCHITECTURE.md`, docs, work, or receipts. A directory
appears only as the result of a file with content. `work/<id>.json` is created
from a manifest entry; receipts are created by the runner only after execution.

## Recon gate

The creator must confirm that the target exists and is a directory, then check:

1. `.agents/harness` and `cairn` are the only two recognized old layouts.
2. If the root `harness` is absent, scaffold the canonical tree.
3. If the root `harness` exists but `manifest.json` is not an object with
   `schemaVersion: 1` and a `features` array, it is malformed/unrecognized and
   the creator must stop.
4. A standalone schemaVersion file outside `harness/manifest.json` does not
   count as a layout.

Old layouts are processed only with `--migrate-old-layout`. This is an
intentional action that only adds the canonical tree and preserves old data for
owner review; it does not delete or silently convert content.

## Manifest and work gates

- The manifest top level has exactly `schemaVersion`, `mode`, and `features`; schemaVersion is 1.
- Each entry has exactly `id`, `order`, `status`, `owners`, `dependsOn`, `spec`.
- IDs are unique kebab-case; order is a strictly increasing positive integer.
- Owners are non-empty; prerequisites exist, are unique, and do not point to themselves.
- The spec is always `docs/specs/<id>.md`, exists, contains `# Feature: <id>`, and has acceptance lines.
- Work is always derived at `harness/work/<id>.json` and does not repeat title/prose/status.
- Acceptance IDs in work must match the exact sequence in the spec.
- Active/blocked requires a next action; completed/cancelled/superseded requires a completion object with the correct lifecycle and corresponding evidence.
- Sequential mode allows at most one active/blocked feature; hard prerequisites of active/blocked/completed features must be completed, and orders before an active feature must be terminal.

## Check gates

A check has exactly `id`, `argv`, `cwd`, `quick`, `requiredByDefault`, `timeoutMs`,
and `declaredEffects`. Effects are an exact boolean set of `network`, `writes`,
`services`, `installs`, and `secrets`. `quick: true` is valid only when every
effect is false.

`quick` runs only quick-safe checks. `full` runs only required-by-default
checks; every true effect requires the corresponding flag
(`--allow-network`, `--allow-writes`, `--allow-services`, `--allow-installs`,
`--allow-secrets`). The runner spawns argv with `shell:false`, uses a finite
timeout, keeps cwd inside the root, makes output visible, and writes receipts
only under `harness/work/receipts/`. An empty registry is incomplete and the
runner returns nonzero.
