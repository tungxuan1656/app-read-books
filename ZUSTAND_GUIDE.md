# Zustand Store + MMKV Usage Guide

## Quick Start

### Reading Settings
```typescript
import useAppStore from '@/controllers/store'

// Get a setting value
const apiKey = useAppStore.getState().settings.geminiApiKey
const offset = useAppStore.getState().settings.currentReadingOffset

// Subscribe to changes (in components)
const isReading = useAppStore(state => state.settings.isReading)
```

### Updating Settings
```typescript
import { storeActions } from '@/controllers/store'

// Update single setting
storeActions.updateSetting('isReading', true)
storeActions.updateSetting('capcutToken', 'new-token')
storeActions.updateSetting('currentReadingOffset', 500)

// Update multiple settings at once
storeActions.updateSettings({
  geminiApiKey: 'your-key',
  geminiModel: 'gemini-2.5-flash-lite',
  isReading: false
})
```

## Available Settings

| Setting | Type | Purpose |
|---------|------|---------|
| `isReading` | boolean | Track if user is currently reading |
| `currentReadingOffset` | number | Save scroll position in chapter |
| `currentBookId` | string | Track which book is being read |
| `geminiApiKey` | string | Gemini API authentication |
| `geminiModel` | string | Selected Gemini model |
| `geminiSummaryPrompt` | string | Custom summary instruction |
| `geminiTranslatePrompt` | string | Custom translation instruction |
| `capcutToken` | string | Capcut TTS authentication |
| `capcutWsUrl` | string | Capcut WebSocket endpoint |

## React Hooks Pattern

```typescript
import useAppStore from '@/controllers/store'

function MyComponent() {
  // Subscribe to specific setting
  const isReading = useAppStore(state => state.settings.isReading)
  
  // Subscribe to all settings
  const settings = useAppStore(state => state.settings)
  
  // Get entire state
  const store = useAppStore()
  
  return <div>Status: {isReading ? 'Reading' : 'Not reading'}</div>
}
```

## Service Usage

### In Services (Gemini, TTS, etc)
```typescript
import useAppStore from '@/controllers/store'

const getGeminiApiKey = () => {
  return useAppStore.getState().settings.geminiApiKey || ''
}

const getCapcutToken = () => {
  return useAppStore.getState().settings.capcutToken
}
```

## Persistence

Settings are automatically persisted to MMKV storage and restored when the app starts.

```typescript
// Data is automatically saved when you call updateSetting/updateSettings
storeActions.updateSetting('geminiApiKey', 'key-123')
// ✅ Persisted to MMKV immediately
```

## Migration Examples

### Before (MMKV Direct)
```typescript
import { MMKVStorage } from '@/controllers/mmkv'
import { MMKVKeys } from '@/constants'

const token = MMKVStorage.get(MMKVKeys.CAPCUT_TOKEN)
MMKVStorage.set(MMKVKeys.IS_READING, true)
```

### After (Zustand Store)
```typescript
import useAppStore, { storeActions } from '@/controllers/store'

const token = useAppStore.getState().settings.capcutToken
storeActions.updateSetting('isReading', true)
```

## Best Practices

1. **Use getState() for immediate access**: Use when you don't need reactivity
   ```typescript
   const value = useAppStore.getState().settings.geminiApiKey
   ```

2. **Use hooks in React components**: Subscribe to specific values
   ```typescript
   const isReading = useAppStore(state => state.settings.isReading)
   ```

3. **Update related settings together**:
   ```typescript
   // Good: Batch updates
   storeActions.updateSettings({
     geminiApiKey: key,
     geminiModel: model
   })
   
   // Avoid: Multiple individual updates
   storeActions.updateSetting('geminiApiKey', key)
   storeActions.updateSetting('geminiModel', model)
   ```

4. **No need to check for initialization**: Settings have default values

## Debugging

Check current settings state:
```typescript
console.log(useAppStore.getState().settings)
```

Subscribe to all changes:
```typescript
const unsubscribe = useAppStore.subscribe(state => {
  console.log('Settings changed:', state.settings)
})
```

## Notes

- MMKV persistence layer is still used (no external databases)
- Settings automatically hydrate on app startup
- All settings are typed for better IDE support
- Thread-safe operations (inherited from Zustand)
