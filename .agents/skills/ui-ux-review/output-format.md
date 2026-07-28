# UI/UX Review Output Format

Use this exact structure.

## Overall Score

`x/10`

## Verdict

Choose one:
- Ship
- Ship with minor fixes
- Needs revision
- Redesign required

## Summary

One short paragraph summarizing the UI quality and main risk.

## Top Issues

### 1. [Issue title]

Severity: Critical / High / Medium / Low / Nit

Evidence:
- What in the UI shows this problem?

Why it matters:
- Explain the user impact.

Recommended fix:
- Concrete change the builder agent can apply.

### 2. [Issue title]

Severity:

Evidence:

Why it matters:

Recommended fix:

### 3. [Issue title]

Severity:

Evidence:

Why it matters:

Recommended fix:

## Scores

| Category | Score | Notes |
|---|---:|---|
| Task support | x/10 | ... |
| Information hierarchy | x/10 | ... |
| Clarity | x/10 | ... |
| Mobile usability | x/10 | ... |
| Navigation | x/10 | ... |
| Visual consistency | x/10 | ... |
| Accessibility | x/10 | ... |
| Responsive readiness | x/10 | ... |
| State handling | x/10 | ... |
| Implementation risk | x/10 | ... |

## What Works Well

- ...
- ...
- ...

## Do Not Change

- ...
- ...
- ...

## Recommended Next Patch

Give implementation-ready instructions.

Example:

```text
1. Rename header from `Home` to `Tong quan`.
2. Change the KPI label from `Tong quan hom nay` to `Tong chi thang nay`.
3. Format `2026-05` as `Thang 05/2026`.
4. Replace mobile table with transaction cards below `md`.
5. Add `pb-24` to the page container so FAB does not overlap content.
```

## Missing Context

List missing inputs that may limit the review.

If nothing is missing, write:

`No critical context missing.`
