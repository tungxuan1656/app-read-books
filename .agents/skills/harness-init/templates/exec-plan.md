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

# ExecPlan: <plan-id>

This plan is self-contained. The executor needs only the current repository, repo-local
knowledge, the canonical spec, and this plan; it does not depend on hidden instructions. Update
the plan during execution. The target file must be named
`YYYY-MM-DD--plan--<subject-id>--<intent>.md` under `docs/plans/`.

Valid plan statuses are exactly `draft`, `ready`, `active`, `blocked`, `paused`,
`completed`, `cancelled`, and `superseded`. Compatibility with the parent feature: feature
`proposed` allows only plan `draft`; `planned` allows `draft` or `ready`; `active` allows
`draft`, `ready`, `active`, `blocked`, or `paused`; features that are `completed`, `cancelled`,
or `superseded` may not have a nonterminal plan. An `active` or `blocked` plan requires an
`active` parent feature; a `ready` plan requires a `planned` or `active` parent. Every hard
`dependsOnPlans` must point to a `completed` plan.

## Purpose / Big picture

State the problem, user/operator value, feature ID, observable outcome, and measurable goals.
Link the canonical spec at `docs/specs/<feature-id>.md`.

## Context and orientation

Record the root, AGENTS, architecture, references, manifest entry, spec, work, code path,
constraints, and commands read/run during recon. State clearly which assumptions are repo-local.

## Plan of work

Describe the smallest approach that satisfies the spec, scope, non-goals, invariants, and high-level work order.

## Concrete steps

List the steps in order, specifying the file/artifact, input, output, owner, transition condition,
and how the next step checks the result. Do not hide work behind “etc.”.

## Validation and acceptance

Map each acceptance ID from the spec to a command, expected exit/status, and evidence path. Record
the negative case, anti-cheat check, and effect flag requiring approval.

## Idempotence and recovery

Describe safe reruns, dry-run, cleanup, rollback, and recovery after a timeout or interrupted
session. Identify which operations must not be automated.

## Artifacts and notes

List the files, fixtures, receipts, snapshots, documents, and gate artifacts to be created or updated.
An artifact is not evidence without a specific way to verify it.

## Interfaces and dependencies

Describe the API, CLI argv, schema, boundary, interface compatibility, and repository prerequisites.
State the required external services/capabilities; do not hide effects.

## Progress

Record entries with the date, status, owner, command, result, evidence, and next action. This is
an execution log and does not replace the work JSON.

## Surprises & discoveries

Record unexpected discoveries, failure modes, new constraints, and their impact on the plan/spec.
Do not delete the discovery history.

## Decision log

Record the decision, date, decision-maker, rejected options, and rationale. If an acceptance
changes, update the canonical spec in the same change and record the reason/evidence.

## Outcomes & retrospective

Compare the goals with the observable results, achieved acceptance/evidence, missing pieces,
remaining risks, follow-up, and final handoff/lifecycle conditions.
