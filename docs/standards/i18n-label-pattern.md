# i18n Label Pattern (Current + Migration)

## 1) Current State

- The app currently uses Vietnamese-first hardcoded UI strings in multiple places.
- Full i18n infrastructure is not yet implemented in this repository.

## 2) Rule for Current Development

- For existing screens, keep wording consistent with current language style.
- For new major features, avoid scattering duplicated strings; centralize copy per
  screen/module to make future i18n migration easier.

## 3) Migration Target (Recommended)

When i18n is introduced, use this structure:

```text
i18n/
  index.ts
  locales/
    vi.json
    en.json
```

Key style:

- `common.actions.save`
- `settings.labels.copilotApiUrl`
- `reading.errors.loadFailed`

## 4) Dynamic Text Rule

- Keep dynamic text template-friendly.
- Avoid hardcoded concatenation patterns that are hard to translate later.

## 5) Checklist

- [ ] New UI copy is grouped by feature/screen.
- [ ] Repeated strings are extracted to constants/module copy map.
- [ ] Dynamic text is written in a translation-friendly style.
- [ ] If i18n is added, all locales must be updated together.
