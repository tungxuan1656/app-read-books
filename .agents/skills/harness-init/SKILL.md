---
name: harness-init
description: Initializes a dependency-free v1.0 harness for Node.js 20+ under a strict JSON contract.
metadata:
  version: "1.0.0"
  license: MIT
---

# Harness Init v1.0

This skill scaffolds the canonical harness for a Node.js 20+ repository. It is
run by the **user**, not called automatically by an agent. It does not install
dependencies, run application migrations, or add data models.

**Key guarantees:** missing-only (never overwrites), dry-run before real run.

## Usage

Always dry-run first, then run for real with the same flags:

```sh
node harness-init/scripts/create-harness.mjs /path/to/repo \
  --repo-name my-repo \
  --purpose "Repository purpose" \
  --verification-command "node --test" \
  --dry-run

node harness-init/scripts/create-harness.mjs /path/to/repo \
  --repo-name my-repo \
  --purpose "Repository purpose" \
  --verification-command "node --test"
```

To also scaffold the optional `init.mjs` entrypoint:

```sh
node harness-init/scripts/create-harness.mjs /path/to/repo \
  --repo-name my-repo --purpose "Repository purpose" \
  --verification-command "node --test" \
  --with-init \
  --start-argv '["node","server.mjs"]' \
  --smoke-argv '["node","smoke.mjs"]' \
  --readiness-url 'http://127.0.0.1:3000/health'
```

## What gets created

```text
AGENTS.md
harness/
  manifest.json
  checks.json
  progress.md
  schemas/{manifest,checks,work}.schema.json
  scripts/{validate,run-checks}.mjs
```

Optional (only when `--with-init`):

```text
init.mjs
```

Never created automatically: `ARCHITECTURE.md`, `docs/`, `harness/work/`,
`harness/work/receipts/`. Create these only when they have real content.

## Anti-cheat

Do not mark `met: true` without checkable evidence. Do not change acceptance
IDs, swallow stderr, use `|| true`, or modify the validator to bypass a gate.
See `harness/scripts/validate.mjs` for the enforced rules.

## Local testing

```sh
node --check harness-init/scripts/create-harness.mjs
node --check harness-init/templates/harness/scripts/validate.mjs
node --check harness-init/templates/harness/scripts/run-checks.mjs
node harness-init/scripts/create-harness.mjs . \
  --repo-name harness-init --purpose "skill package" \
  --verification-command "node --check" --dry-run
```

## References

Read these only when the task involves the specific topic:

- `references/manifest-and-schemas.md` — manifest, work, checks, and spec format
- `references/tree-and-gates.md` — canonical layout and gate rules
- `references/exec-plan-guide.md` — 12-section ExecPlan format and lifecycle
