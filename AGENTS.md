# Mobile App Guidelines

You are a programming assistant specializing in TypeScript, React 19, React Native 0.81 (Expo SDK 54), Expo Router, Zustand, MMKV, Google GenAI, and CapCut TTS integration. Always respond in English.

## General Rules

- **Autonomy**: Focus on execution first. Keep explanations short unless asked.
- **Dependencies**: Prefer existing Expo/React Native stack. Add new packages only when necessary.
- **Code hygiene**: After code changes, run `pnpm run lint` and `pnpm run tsc-check`.
- **Routing**: Follow file-based routing in `app/` (`expo-router`).
- **State management**: Use `useAppStore` and `storeActions` from `controllers/store.ts`; avoid ad-hoc global state.
- **Business logic**: Put side-effect/business logic in `services/` and orchestration in `hooks/`; keep screens/components lean.
- **Caching**: Reuse existing cache/database layers (`services/database.service.ts`, `utils/content-cache.helpers.ts`) before introducing new storage.
- **Settings & secrets**: Read/write runtime config via store settings; do not hardcode API keys/tokens.
- **Naming**: Keep kebab-case file naming pattern used across the project.
- **Code comments**: Write comments in English.
- **UI text**: Keep language/style consistent with current app copy (currently Vietnamese-first) unless a task explicitly asks otherwise.

## Reference Documents & Patterns (Required)

When performing tasks, you MUST reference relevant project docs/files below and follow existing patterns:

| Use Case | Reference | Description |
| :-- | :-- | :-- |
| **System Overview** | [docs/PROJECT_DOCS.md](./docs/PROJECT_DOCS.md) | Product scope, architecture, and operational flows (startup, download, reading AI, TTS). |
| **App Boot & Navigation** | [app/_layout.tsx](./app/_layout.tsx) | Root initialization, splash handling, reading resume flow, and global providers. |
| **State & Persistence** | [controllers/store.ts](./controllers/store.ts), [controllers/mmkv.ts](./controllers/mmkv.ts) | Zustand store shape, settings contracts, and MMKV persistence pattern. |
| **Reading Pipeline** | [hooks/use-reading-content.ts](./hooks/use-reading-content.ts), [services/reading.service.ts](./services/reading.service.ts), [services/content-processor.ts](./services/content-processor.ts) | How chapters are loaded, processed (none/translate/summary), and rendered. |
| **AI Provider Pattern** | [services/ai.service.ts](./services/ai.service.ts), [services/ai-providers/gemini.provider.ts](./services/ai-providers/gemini.provider.ts), [services/ai-providers/copilot.provider.ts](./services/ai-providers/copilot.provider.ts) | Provider abstraction and model-specific integration details. |
| **TTS Pipeline** | [services/tts.service.ts](./services/tts.service.ts), [hooks/use-tts-player.ts](./hooks/use-tts-player.ts), [services/audio-player.service.ts](./services/audio-player.service.ts) | CapCut WebSocket TTS conversion, playback lifecycle, and cancellation behavior. |
| **Download & Book Import** | [app/add-book/index.tsx](./app/add-book/index.tsx), [services/download.service.ts](./services/download.service.ts), [utils/book.helpers.ts](./utils/book.helpers.ts) | Supabase listing, zip download/unzip, local library refresh. |
| **Cache & Prefetch** | [services/database.service.ts](./services/database.service.ts), [hooks/use-chapter-prefetch.ts](./hooks/use-chapter-prefetch.ts), [utils/content-cache.helpers.ts](./utils/content-cache.helpers.ts), [app/settings/cache-manager.tsx](./app/settings/cache-manager.tsx) | SQLite processed-content cache, chapter prefetch flow, and cache management UX. |
| **UI Reuse Patterns** | [components/](./components) | Shared primitives and reading-specific controls; prefer reuse over new bespoke components. |
| **Types & Constants** | [@types/](./@types), [constants/](./constants) | Shared data contracts, reading modes, styles, and settings configs. |

## Main Stack (Quick Link)

- **Framework**: [Expo](https://docs.expo.dev/) + [Expo Router](https://docs.expo.dev/router/introduction/)
- **Runtime**: [React Native](https://reactnative.dev/) + [React 19](https://react.dev/)
- **State**: [Zustand](https://zustand.docs.pmnd.rs/) + MMKV persistence
- **Storage**: [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/) + [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **AI**: [Google GenAI SDK](https://www.npmjs.com/package/@google/genai) + internal provider abstraction
- **Audio/TTS**: [react-native-track-player](https://rntp.dev/) + CapCut WebSocket TTS flow
