# Code Review Guide (React Native Project)

## 1) Review Priorities

1. Correctness and regressions
2. Data flow and state safety
3. Performance and UX stability
4. Maintainability and consistency

## 2) Functional Review

- Does the change solve the intended behavior?
- Any route/param edge case not handled?
- Any error path silently swallowed?

## 3) Architecture Review

- UI in `app/components`, business logic in `services`, orchestration in `hooks`.
- No new anti-pattern where screen directly owns heavy side-effects.
- Store updates remain explicit and predictable.

## 4) Mobile-Specific Quality Checks

- Heavy loops/IO kept off UI-critical path.
- Long lists and rendering behavior remain responsive.
- Proper cleanup for listeners/timers/subscriptions.

## 5) Data and Cache Review

- Cache-first behavior preserved where expected.
- Clear invalidation/cleanup paths exist.
- No duplicate persistence of same data without reason.

## 6) Readability and Consistency

- Naming follows standards.
- Imports are clean and grouped.
- Comments are in English and actionable.

## 7) Reviewer Checklist

- [ ] Behavior validated against acceptance intent.
- [ ] No obvious regression in reading/download critical paths.
- [ ] Layering rule respected (UI vs hook vs service vs store).
- [ ] Error handling is explicit.
- [ ] Type safety maintained (`tsc-check` passes).
