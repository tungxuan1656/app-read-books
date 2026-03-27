# Typography Guide (Tailwind-First)

## 1) Source of Truth

- Typography in UI uses Tailwind utility classes.
- `constants/app-typo.ts` and `typo-*` utilities are removed and must not be reintroduced.
- Reading content keeps the runtime typography exception from user settings.

## 2) Standard Scale

Use these defaults in className:

- `title` -> `text-5xl font-bold`
- `h1` -> `text-3xl`
- `h2` -> `text-2xl`
- `h3` -> `text-xl`
- `h4` -> `text-lg`
- `headline` -> `text-base`
- `body` -> `text-sm`
- `footnote` -> `text-ssm`
- `caption` -> `text-xs`
- `mini` -> `text-xss`

## 3) Rules

- Prefer `className` for `fontSize`, `fontWeight`, and `lineHeight` in regular UI.
- Avoid ad-hoc inline font styles unless required by runtime behavior.
- Keep typography consistent across shared components.

## 4) Reading Screen Exception

The reading content renderer must keep using user-configured typography:

- `font`
- `fontSize`
- `lineHeight`

This is intentionally inline/runtime-driven and should not be replaced by static classes.

## 5) Quick Checks

- `rg "AppTypo|typo-" app components constants hooks services utils`
- Review remaining inline text styles and confirm they are dynamic/required.
