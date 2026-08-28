# i18n Label Pattern

> **Status: Proposed — pending product owner decision.** No implementation has started. Do not treat this as active code standard.

## 1) Current State

- The app uses Vietnamese-first hardcoded UI strings.
- Strings are written directly in screens and components.
- No i18n library is installed and no locale files exist.
- Full i18n infrastructure is not yet implemented.

## 2) Rule for Current Development

- For existing screens, keep wording consistent with the current Vietnamese-first style.
- For new features, do not scatter duplicate strings. Group copy per screen or module so future migration is easier.
- Avoid string concatenation that is hard to translate. Keep dynamic text template-friendly.

## 3) Migration Target (When Approved)

When the product owner approves i18n, use this structure:

```text
i18n/
  index.ts
  locales/
    vi.json
    en.json
```

Key style:

- `common.actions.save`
- `settings.labels.openaiApiUrl`
- `reading.errors.loadFailed`

Rules for the migration:

- Keep keys grouped by feature.
- Update all locales together.
- Extract repeated strings to a module copy map.

## 4) Checklist

- [ ] New UI copy is grouped by feature or screen.
- [ ] Repeated strings are extracted to a shared constant or module map.
- [ ] Dynamic text is written in a translation-friendly way.
- [ ] No i18n code is added until the status above changes to active.
