---
name: ui-ux-review
description: Review UI/UX outputs against task support, clarity, consistency, accessibility, responsive behavior, and project design rules without redesigning from scratch.
---

# UI/UX Review

Use this skill to review rendered UI, screenshots, HTML mockups, or implemented screens objectively.

The goal is not to decide whether an interface is personally beautiful. The goal is to decide whether it helps the target user complete the stated task clearly, consistently, accessibly, and effectively on the target device.

## When To Use

Use this skill when:
- creating a new screen or substantial UI section
- changing a major layout or navigation pattern
- reviewing mobile or responsive screenshots
- checking whether AI-generated UI is too generic or unclear
- reviewing important UI before merge
- verifying a desktop-to-mobile layout conversion

Do not use it for:
- small text-only edits
- logic bugs with no UI change
- simple icon swaps
- backend or refactor-only changes

## Inputs Expected

Ask for or gather as many of these as practical:
- Screenshot, rendered HTML, or UI mockup
- Page goal
- Target user
- Primary user task
- Target device: mobile, desktop, or responsive
- Project design rules such as `docs/frontend/ui-system.md` and nearby feature docs
- Reference screenshots or URLs
- Component/library constraints
- Known business or domain constraints

If important context is missing, state what is missing and continue with a limited review.

## Required Reading

Before reviewing, read only the files that match the provided context:
- `rubric.md`
- `output-format.md`
- `anti-bias.md`
- relevant checklist files from `checklists/`
- project design rules only when supplied or clearly relevant

Do not read the whole codebase or long chat history just to review a screenshot.

## Review Priorities

Review in this order:
1. Task support
2. Information hierarchy
3. Clarity of labels and data meaning
4. Mobile usability
5. Navigation and wayfinding
6. Visual consistency
7. Accessibility
8. Responsive behavior
9. State handling: empty, loading, error, success
10. Implementation risk

## Core Rules

- Do not invent a new design system.
- Do not apply personal aesthetic preferences as objective criticism.
- Do not say "make it beautiful" or "make it premium" without concrete usability reasoning.
- Do not suggest new features unless they directly support the page goal.
- Do not rewrite product strategy.
- Do not critique missing elements outside the requested scope.
- Do not assume desktop patterns work on mobile.
- Do not reward visual complexity.
- Do not give vague feedback without a concrete fix.
- Separate usability problems from taste preferences.

## Evidence Standard

Every major issue must include:
- What is wrong
- Evidence from the screenshot, mockup, or rendered UI
- Why it matters
- Concrete fix

Bad feedback:

> The card is not beautiful.

Good feedback:

> The summary card shows `333.000 đ` without saying whether it is total spending, balance, or income. This can cause users to misunderstand financial data. Add a label such as `Tong chi thang nay`.

## Severity Levels

- Critical: blocks the user task or causes serious misunderstanding
- High: likely to confuse users or create repeated friction
- Medium: noticeable usability or consistency issue
- Low: polish issue
- Nit: minor wording, spacing, or visual refinement

## Final Decision

End every review with one of:
- Ship
- Ship with minor fixes
- Needs revision
- Redesign required

## Output

Use the exact structure in `output-format.md`.

## Related Runtime Persona

Use `.agents/agents/ui-ux-reviewer.md` when spawning or instructing a fresh review-only sub-agent. The reviewer should receive only the minimal task brief and visible UI output, not builder reasoning or unrelated project context.
