# I18n Label Pattern

## Goal

In this project, all labels/text displayed to users **must use i18n** to support multiple languages.

- Do not hardcode text in components/pages.
- Language strings are managed via `json` files.
- Language keys use a nested structure accessed as `x.y.z`.

## Directory Structure

```txt
src/
  lib/
    i18n/
      index.ts
      locales
        vi.json
```

> `i18n.ts` and language files must be placed in `src/lib/i18n`.

## Key Naming Rules

- Keys must be semantic based on the screen/feature context.
- Use nested keys, for example:
  - `common.actions.save`
  - `auth.login.title`
  - `auth.login.form.email.label`

Example `vi.json`:

```json
{
  "common": {
    "actions": {
      "save": "Save",
      "cancel": "Cancel"
    }
  },
  "auth": {
    "login": {
      "title": "Login",
      "form": {
        "email": {
          "label": "Email"
        }
      }
    }
  }
}
```

## Code Usage Rules

- ✅ Correct: use the translation function from i18n, e.g. `t('auth.login.title')`.
- ❌ Wrong: hardcode directly like `"Login"`, `"Save"`, `"Email"` in JSX.
- ✅ Form validation/error messages must use i18n keys — do not embed strings directly in Zod schemas.

Example:

```tsx
<h1>{t('auth.login.title')}</h1>
<label>{t('auth.login.form.email.label')}</label>
<Button>{t('common.actions.save')}</Button>
```

## Calling `t()` Outside Render Context (module scope)

If `t()` is called **outside** the render function (e.g.: default parameter, module-scope constant), **a comment is required** explaining the lifecycle and safety:

```tsx
// ✅ Has explanatory comment
// NOTE: t() is called in default parameter position — evaluated on each call,
// NOT at module-load time. Safe because locale is resolved lazily inside t().
export const MyComponent = ({
  label = t('common.actions.save'),
}: Props) => { ... }
```

```ts
// ❌ Must not use t() at module-level constant if locale may not be loaded:
const LABEL = t('common.actions.save') // Bad — stale if locale not initialized
```

## Locale Completeness (required)

- All new keys must be added **simultaneously** to all locale files (`en.json`, etc.).
- Do not merge a key in one locale while leaving another locale empty — causes silent fallback, hard to debug.
- If translation is not available, use English temporarily and add a `// TODO: translate` comment in the JSON file.

## Interpolation for Numbers, Units, and Time

Strings with quantities, units, or dynamic values must use interpolation — do not concatenate strings manually:

```json
// en.json
{
  "shifts": {
    "stats": {
      "totalDrivers": "/ {{count}} Total"
    }
  }
}
```

```tsx
// ✅ Correct
t('shifts.stats.totalDrivers', { count: totalDrivers })

// ❌ Wrong
`/ ${totalDrivers} Total`
```

## Review Checklist

- [ ] No hardcoded user-facing text in components/pages.
- [ ] Form validation/error messages use i18n keys.
- [ ] All labels have corresponding i18n keys.
- [ ] Keys have clear contextual nested structure (`x.y.z`).
- [ ] All locale files (`en.json`) have synchronized keys.
- [ ] `t()` at default param/module scope has lifecycle comment.
- [ ] Strings with dynamic values use interpolation, no manual concatenation.
- [ ] `i18n.ts` placed at `src/lib/i18n/index.ts`.
