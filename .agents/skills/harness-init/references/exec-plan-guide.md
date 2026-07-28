# ExecPlan guide v1.0

An ExecPlan uses exactly one file in the target:
`docs/plans/YYYY-MM-DD--plan--<subject-id>--<intent>.md`.
Do not use another short name or place the plan in harness. The file must have
the standard frontmatter and the 12 headings below, in the exact order. The
plan is self-contained: link to the spec for traceability, but record enough
context, decisions, commands, and evidence for the implementer.

## Standard frontmatter

```yaml
---
schemaVersion: 1
class: exec-plan
id: <plan-id>
featureId: <feature-id>
title: <title>
status: draft
owner: <owner>
dependsOnPlans: []
---
```

**Lifecycle and compatibility:** Valid plan statuses are exactly `draft | ready | active | blocked | paused | completed |
cancelled | superseded`. Feature-parent compatibility is as follows: `proposed → draft`; `planned
→ draft/ready`; `active → draft/ready/active/blocked/paused`; `completed`, `cancelled`, and
`superseded` have no nonterminal plan. An `active` or `blocked` plan requires an `active` parent
feature; a `ready` plan requires a `planned` or `active` parent. Every hard
`dependsOnPlans` dependency is satisfied only by a `completed` plan.

## Required 12 headings

1. `Purpose / Big picture`
2. `Context and orientation`
3. `Plan of work`
4. `Concrete steps`
5. `Validation and acceptance`
6. `Idempotence and recovery`
7. `Artifacts and notes`
8. `Interfaces and dependencies`
9. `Progress`
10. `Surprises & discoveries`
11. `Decision log`
12. `Outcomes & retrospective`

Each heading must contain specific content or explicitly say “none” with a
reason. Validation maps every acceptance ID to a command and evidence.
Progress records the actual status/owner/next action; it must not turn the plan
into a work record. Rollback, retry, and boundaries must be clear so the plan
can continue after an interrupted session.
