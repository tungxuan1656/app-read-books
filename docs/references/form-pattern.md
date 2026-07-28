# Form Pattern (React Native)

> Current project baseline: native controlled inputs + store updates.
> No mandatory `react-hook-form` / `zod` requirement yet.

## 1) Principles

- Keep form state local to screen unless global persistence is required.
- Validate inputs before persisting to store/services.
- Keep user feedback explicit (Alert or inline message).
- Avoid hidden side-effects in `onChangeText`; commit on explicit save when possible.

## 2) Basic RN Form Template

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

- Read initial values from `useAppStore`.
- Edit local draft state inside screen.
- Persist via `storeActions.updateSetting` or `storeActions.updateSettings`.
- Show success/failure feedback through toast/alert if needed.

## 4) Validation Rules

- Validate required fields before save.
- Validate URL/token format where applicable.
- Avoid writing invalid values into persisted store.

## 5) Checklist

- [ ] Local state is initialized from source of truth.
- [ ] Validation path is explicit.
- [ ] Save action is explicit and deterministic.
- [ ] Error/success feedback is user-visible.
