# Color Guide (Tailwind-First)

## 1) Source of Truth

- Tailwind default palette classes are the first choice for UI colors.
- `AppColors` from `assets/app-colors.ts` is the only raw color token object.

## 2) Rules

- Prefer className for UI colors:
  - `text-gray-900`
  - `bg-white`
  - `border-slate-200`
  - `bg-red-500`
- Use `AppColors.<tailwindLikeKey>` only when a component requires a raw color value:
  - icon `color` prop
  - third-party style props
  - dynamic inline style values that cannot be represented as classes
- Avoid legacy semantic class aliases and token names.

## 3) Allowed Raw Color Cases

- Third-party APIs that only accept style objects/colors.
- Runtime-calculated color values.
- Existing APIs that expose `color?: string` but no `className`.
