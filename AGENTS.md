# Mobile App Guidelines

You are a programming assistant specializing in TypeScript, React 19, React Native 0.81 (Expo SDK 54), Expo Router, Zustand, MMKV, NativeWind, ESLint, and Google GenAI integration. Always respond in English.

## General Rules

- **Autonomy**: Focus on execution first. Keep explanations short unless asked.
- **Dependencies**: Prefer existing Expo/React Native stack. Add new packages only when necessary.
- **Code hygiene**: After code changes, run `pnpm run lint` (or `pnpm lint`) and `pnpm run tsc-check`.
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
| **System Overview** | [docs/PROJECT_DOCS.md](./docs/PROJECT_DOCS.md) | Product scope, architecture, and operational flows (startup, download, reading AI). |
| **App Boot & Navigation** | [app/_layout.tsx](./app/_layout.tsx) | Root initialization, splash handling, reading resume flow, and global providers. |
| **State & Persistence** | [controllers/store.ts](./controllers/store.ts), [controllers/mmkv.ts](./controllers/mmkv.ts) | Zustand store shape, settings contracts, and MMKV persistence pattern. |
| **Reading Pipeline** | [hooks/use-reading-content.ts](./hooks/use-reading-content.ts), [services/reading.service.ts](./services/reading.service.ts), [services/content-processor.ts](./services/content-processor.ts) | How chapters are loaded, processed (none/translate/summary), and rendered. |
| **AI Provider Pattern** | [services/ai.service.ts](./services/ai.service.ts), [services/ai-providers/gemini.provider.ts](./services/ai-providers/gemini.provider.ts), [services/ai-providers/copilot.provider.ts](./services/ai-providers/copilot.provider.ts) | Provider abstraction and model-specific integration details. |
| **Download & Book Import** | [app/add-book/index.tsx](./app/add-book/index.tsx), [services/download.service.ts](./services/download.service.ts), [utils/book.helpers.ts](./utils/book.helpers.ts) | Supabase listing, zip download/unzip, local library refresh. |
| **Cache & Prefetch** | [services/database.service.ts](./services/database.service.ts), [hooks/use-chapter-prefetch.ts](./hooks/use-chapter-prefetch.ts), [utils/content-cache.helpers.ts](./utils/content-cache.helpers.ts), [app/settings/cache-manager.tsx](./app/settings/cache-manager.tsx) | SQLite processed-content cache, chapter prefetch flow, and cache management UX. |
| **UI Reuse Patterns** | [components/](./components) | Shared primitives and reading-specific controls; prefer reuse over new bespoke components. |
| **Types & Constants** | [@types/](./@types), [constants/](./constants) | Shared data contracts, reading modes, styles, and settings configs. |
| **Standards Index** | [docs/standards/README.md](./docs/standards/README.md) | Entry point for coding standards and implementation patterns. |
| **Navigation Standard** | [docs/standards/expo-router-navigation-pattern.md](./docs/standards/expo-router-navigation-pattern.md) | Canonical routing and navigation conventions. |
| **State Standard** | [docs/standards/zustand-store-pattern.md](./docs/standards/zustand-store-pattern.md) | Store contracts, action patterns, and persistence guidance. |
| **Validation Standard** | [docs/standards/testing-and-validation-pattern.md](./docs/standards/testing-and-validation-pattern.md) | Test/validation workflow and verification checklist. |
| **Naming Standard** | [docs/standards/naming-and-conventions-pattern.md](./docs/standards/naming-and-conventions-pattern.md), [docs/standards/type-naming-pattern.md](./docs/standards/type-naming-pattern.md) | File/type naming and convention rules. |
| **CI/CD Automation** | [fastlane/Fastfile](./fastlane/Fastfile), [fastlane/README.md](./fastlane/README.md) | Delivery lanes for Android/iOS build and distribution. |

## Main Stack (from package.json)

- **App framework**: [Expo SDK 54](https://docs.expo.dev/) + [Expo Router](https://docs.expo.dev/router/introduction/)
- **Runtime**: [React Native 0.81](https://reactnative.dev/) + [React 19](https://react.dev/)
- **Language**: TypeScript 5.9
- **State**: [Zustand](https://zustand.docs.pmnd.rs/) + [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv)
- **Storage & cache**: [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/) + [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **Navigation**: [expo-router](https://docs.expo.dev/router/introduction/) + React Navigation Native
- **AI**: [Google GenAI SDK](https://www.npmjs.com/package/@google/genai) with internal multi-provider service layer
- **UI & styling**: NativeWind + TailwindCSS + `@gorhom/bottom-sheet`
- **UX/platform libs**: `react-native-reanimated`, `react-native-gesture-handler`, `react-native-screens`, `expo-image`
- **Code quality**: ESLint 9 (`eslint-config-expo`, `eslint-plugin-tailwindcss`, `eslint-plugin-unicorn`) + TypeScript noEmit check

## CI/CD (Fastlane)

- **Fastlane is the delivery entry point** for build and distribution automation.
- **Android lanes**: `fastlane android build`, `fastlane android upload`, `fastlane android distribute`.
- **iOS lanes**: `fastlane ios prepare`, `fastlane ios build`, `fastlane ios upload`, `fastlane ios distribute`.
- When modifying release workflows, update both `fastlane/Fastfile` and related project documentation.

## Installed Skills (Current `.agents/skills`)

Use only relevant skills for the task; prefer minimal-sufficient combinations.

- **Core workflow**: `using-superpowers`, `concise-planning`, `writing-plans`, `executing-plans`, `lint-and-validate`, `verification-before-completion`, `kaizen`
- **Debugging & quality**: `systematic-debugging`, `code-review-checklist`, `requesting-code-review`, `receiving-code-review`
- **Frontend/mobile**: `react-best-practices`, `react-patterns`, `frontend-design`, `ui-ux-pro-max`, `tailwind-patterns`, `browser-automation`, `e2e-testing-patterns`
- **Backend/API/security**: `backend-dev-guidelines`, `api-patterns`, `api-security-best-practices`, `auth-implementation-patterns`, `nodejs-best-practices`, `database-design`, `javascript-pro`, `typescript-expert`
- **Security testing**: `ethical-hacking-methodology`, `sql-injection-testing`, `xss-html-injection`, `broken-authentication`
- **Git & collaboration**: `git-pushing`, `using-git-worktrees`, `finishing-a-development-branch`, `subagent-driven-development`, `dispatching-parallel-agents`
- **TDD/testing**: `test-driven-development`
- **Docs & skill authoring**: `writing-skills`

## Code Review Priority (Required)

- **Review-first mindset**: When asked to review, prioritize bugs, regressions, security risks, and missing tests over style-only feedback.
- **Use review skills explicitly**:
  - `code-review-checklist` for systematic findings.
  - `requesting-code-review` before merge-ready changes.
  - `receiving-code-review` when implementing feedback.
  - `systematic-debugging` if a finding indicates runtime or logic failure.
- **Finding format**:
  - Report by severity first (`High`, `Medium`, `Low`).
  - Include exact file path and line reference when possible.
  - Explain impact and proposed fix in 1-3 concise bullets.
- **Minimum validation after applying review fixes**:
  - `pnpm run lint`
  - `pnpm run tsc-check`
