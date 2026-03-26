# Component Structure Pattern (Page vs Child Component)

## 1) Required Rules

- **Page**: declare as `const ComponentName = () => {}` and `export default ComponentName` in the page file.
- **Child component**: use `export const ComponentName = () => {}`.
- **Each child component folder** must have an `index.ts` to aggregate and re-export all components in the folder.

## 2) Page Template

```tsx
// pages/goals-page.tsx
const GoalsPage = () => {
  return <div>Goals page</div>
}

export default GoalsPage
```

## 3) Child Component Template

```tsx
// components/goals/goal-card.tsx
type GoalCardProps = {
  title: string
}

export const GoalCard = ({ title }: GoalCardProps) => {
  return <div>{title}</div>
}
```

## 4) `index.ts` Template in Component Folder

```ts
// components/goals/index.ts  — only export PUBLIC components
export * from './goal-card'
export * from './goal-progress'
export * from './goal-form'

// NOTE: goal-card-skeleton, goal-row-item are internal — intentionally NOT exported here.
```

**Distinguishing public vs internal:**
- **Public**: components used outside the folder → include in `index.ts`.
- **Internal**: components only used within the folder (sub-components of a larger component) → **not** included in `index.ts`, kept as module-private.

## 5) Recommended Import Style

```tsx
import { GoalCard, GoalForm, GoalProgress } from '@/components/goals'
```

## 6) File Size Rules

- Files/components **over 200 lines** must be split by clear concerns (shell, list, mock data, utils, ...).
- Each component/hook should be responsible for **one thing** — do not combine too many concerns in the same file.
- Mock data must be separated into `<domain>.mock.ts` — not embedded directly in components.

## 7) Quick Checklist for New Components

- [ ] Page uses `const XPage` + `export default XPage`
- [ ] Child component uses `export const`
- [ ] Component folder has `index.ts` — only exports public components
- [ ] Internal sub-components are **not** in `index.ts`
- [ ] File under 200 lines; if exceeded, split by concern
- [ ] Consumer imports from folder (not individual files unless necessary)
