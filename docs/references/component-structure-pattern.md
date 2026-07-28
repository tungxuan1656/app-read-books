# Component Structure Pattern (Screen vs Reusable Component)

## 1) Required Rules

- **Screen route file** (`app/**/index.tsx`): `const ScreenName = () => {}` + `export default ScreenName`.
- **Reusable component** (`components/**`): `export const ComponentName = (...) => {}`.
- Keep component props typed and explicit.

## 2) Screen Template

```tsx
// app/feature/index.tsx
import { Screen } from '@/components/screen'
import { Text, View } from 'react-native'

const FeatureScreen = () => {
  return (
    <Screen>
      <View>
        <Text>Feature</Text>
      </View>
    </Screen>
  )
}

export default FeatureScreen
```

## 3) Reusable Component Template

```tsx
// components/feature-card.tsx
import { Text, View } from 'react-native'

type FeatureCardProps = {
  title: string
}

export const FeatureCard = ({ title }: FeatureCardProps) => {
  return (
    <View>
      <Text>{title}</Text>
    </View>
  )
}
```

## 4) Logic Split Rules

- UI rendering in components.
- Lifecycle orchestration in hooks.
- Business/IO in services.
- Do not mix all three layers in one file.

## 5) File Size and Complexity

- If file exceeds ~200 lines, consider split by concern:
  - presentational component
  - hook for orchestration
  - helper/service extraction

## 6) Naming

- Keep kebab-case filenames.
- Hooks must start with `use-`.
- Service files should end with `.service.ts`.

## 7) Checklist

- [ ] Screen files are route-focused and lightweight.
- [ ] Reusable component is stateless or minimally stateful.
- [ ] Side-effects are extracted from component body when possible.
- [ ] No direct IO calls inside presentational components.
