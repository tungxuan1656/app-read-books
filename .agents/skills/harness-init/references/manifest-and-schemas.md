# Manifest, work, and schemas

Files under `templates/schemas/` are JSON Schema Draft 2020-12 definitions of
the structural shape. The schema does not itself determine file existence,
lifecycle, prerequisites, or correspondence between spec and work;
`harness/scripts/validate.mjs` enforces the semantic/cross-file rules.

## Canonical manifest

```json
{
  "schemaVersion": 1,
  "mode": "sequential",
  "features": [
    {
      "id": "example-feature",
      "order": 1,
      "status": "planned",
      "owners": ["team-example"],
      "dependsOn": [],
      "spec": "docs/specs/example-feature.md"
    }
  ]
}
```

Every manifest entry is a tracked Tier 2/3 feature. Tier 0/Tier 1 features are
not registered. The manifest has no title, behavior, acceptance prose, or work
path. The spec path is always derived from the ID and is the sole source of
truth for the title, behavior, and acceptance.

Valid statuses are `proposed`, `planned`, `active`, `blocked`, `completed`,
`cancelled`, `superseded`. `owners` is a non-empty array of strings.
`dependsOn` is an array of unique IDs; every ID must exist and must not point to
itself. Sequential mode has one active/blocked slot; hard prerequisites of
active/blocked/completed features must be completed.

## Canonical work

The work path is derived as `harness/work/<id>.json`. Its top level has exactly:
`schemaVersion`, `id`, `acceptanceResults`, `nextAction`, `completion`; its
schemaVersion is 1. Each acceptance result has exactly `id`, `met`, `evidence`,
where evidence is a string or null. `nextAction` is a string or null.

Completion is null or an object containing only `verifiedAt`, `completedAt`,
`cancellationSummary`, and `supersededBy`. Active/blocked requires a non-empty
next action. Completed requires `nextAction` null, ISO UTC
`verifiedAt`/`completedAt`, and every acceptance met with evidence. Cancelled
requires `nextAction` null and a non-empty `cancellationSummary`. Superseded
requires `nextAction` null and an existing `supersededBy` that is not the
feature itself. All other statuses require `completion` null.

Work does not repeat the title, behavior, acceptance prose, status, or blocker.
Evidence must be a checkable command/path/result/receipt; spawning a command is
not acceptance.

## Spec and acceptance

A spec has an identity heading and stable lines:

```markdown
# Feature: example-feature

## Acceptance criteria
- [a1] Validator rejects an unknown key.
- [a2] Runner writes an observable receipt.
```

The validator reads IDs in exact order and requires work to match the exact
sequence. To change behavior, change the canonical spec first; do not edit work
to make the gate green.

## Checks

```json
{
  "schemaVersion": 1,
  "checks": [
    {
      "id": "safe-check",
      "argv": ["node", "--test"],
      "cwd": ".",
      "quick": true,
      "requiredByDefault": true,
      "timeoutMs": 120000,
      "declaredEffects": {
        "network": false,
        "writes": false,
        "services": false,
        "installs": false,
        "secrets": false
      }
    }
  ]
}
```

`argv` is a direct array for `spawn`, not a shell string. Quick selects only
safe checks; full selects required-by-default checks and requires explicit
effect flags.
