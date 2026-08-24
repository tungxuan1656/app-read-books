# Form Pattern (React Native)

> Current baseline: native controlled inputs + per-domain Zustand stores. No mandatory `react-hook-form` / `zod` requirement yet.

## 1) Principles

- Keep form state local to the screen unless global persistence is required.
- Validate inputs before persisting to store or services.
- Keep user feedback clear (Alert or inline message).
- Avoid hidden side-effects in `onChangeText`; commit on explicit save when possible.

## 2) Basic Form Template

```tsx
import { useState } from 'react'
import { Alert, Text, TextInput, View } from 'react-native'

import { Button } from '@/components/button'

const ExampleForm = () => {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const onSave = () => {
    if (!value.trim()) {
      setError('Value is required')
      return
    }
    setError('')
    Alert.alert('Saved')
  }

  return (
    <View>
      <Text>Label</Text>
      <TextInput value={value} onChangeText={setValue} />
      {!!error && <Text>{error}</Text>}
      <Button text='Save' onPress={onSave} />
    </View>
  )
}
```

## 3) Settings Form Pattern (Project-specific)

- Read initial values from per-domain stores:
  - `useSettingsStore` from `controllers/stores/settings.store.ts`
  - `useTypographyStore`, `useBooksStore`, `useReadingStore` as needed
- Edit local draft state inside the screen.
- Persist via per-domain actions, for example `settingsActions.updateSetting` or `settingsActions.updateSettings`.
- Do not use `useAppStore`; it is retired. Use per-domain `use*Store` and `*Actions` from `controllers/stores/index.ts`.
- Show success or failure feedback through toast or alert.

## 4) Dialog and Sheet Interactions

### Choose the right pattern

- **Quick confirmation**: use `Alert.alert`.
- **Rich modal or sheet workflow**: use `@gorhom/bottom-sheet`.
- **Inline form section**: render directly in the screen and save explicitly.

### Confirmation

```tsx
Alert.alert('Delete book', 'Are you sure?', [
  { text: 'Cancel', style: 'cancel' },
  { text: 'Delete', style: 'destructive', onPress: handleDelete },
])
```

Use for destructive actions with no complex inputs.

### Bottom Sheet

- Keep sheet components reusable (`components/sheet-*.tsx`).
- Control open and close via ref from the parent when needed.
- Do not put heavy business logic in the sheet component.

### Form-in-Sheet Rules

- Draft state in component or hook.
- Validate before save.
- Commit through store actions or service calls.
- Close the sheet only after success (or explicit cancel).

## 5) Validation Rules

- Validate required fields before save.
- Validate URL and token format where needed.
- Do not write invalid values into persisted stores.

## 6) Checklist

- [ ] Local state starts from the correct source of truth (per-domain store or prop).
- [ ] Validation runs before save.
- [ ] Save action is explicit and deterministic.
- [ ] Error and success feedback is visible to the user.
- [ ] Destructive actions have confirmation.
- [ ] Sheet logic stays UI-focused; no heavy business logic inside.
