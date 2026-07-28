# RN Read Books

A React Native reading app built with Expo that supports local book libraries, chapter-based reading, and AI-assisted translation/summary workflows.

## Key Features

- Import books from remote sources and manage local library
- Read chapter content with resume position support
- AI reading modes: translation and summary
- Processed-content caching and chapter prefetch
- Settings-driven provider/model configuration (no hardcoded secrets)

## Tech Stack

- **Framework**: Expo SDK 54 + Expo Router
- **Runtime**: React Native 0.81, React 19
- **Language**: TypeScript 5.9
- **State**: Zustand + MMKV persistence
- **Storage/Cache**: Expo File System + Expo SQLite
- **AI**: Copilot-compatible chat completion API via internal provider abstraction
- **UI**: NativeWind, Reanimated, Gesture Handler, Bottom Sheet
- **Quality**: ESLint 9 + TypeScript `noEmit` check
- **Delivery**: Fastlane (Android/iOS lanes)

## Project Structure

- `app/`: Expo Router screens and route layouts
- `components/`: reusable UI primitives and reading controls
- `controllers/`: app store/actions and MMKV integration
- `hooks/`: orchestration hooks for reading, prefetch, and flows
- `services/`: business logic (AI, reading pipeline, downloads, database)
- `utils/`: helper modules for books, cache, and content
- `docs/`: architecture and engineering standards
- `fastlane/`: Android/iOS build and distribution automation

## Prerequisites

- Node.js 20+
- pnpm 9+
- Xcode (for iOS local builds)
- Android Studio + SDK (for Android local builds)

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Start the dev server:

```bash
pnpm start
```

3. Run on device/emulator:

```bash
pnpm ios
pnpm android
```

## Available Scripts

- `pnpm start`: start Expo dev server
- `pnpm ios`: run iOS app (`expo run:ios`)
- `pnpm android`: run Android app (`expo run:android`)
- `pnpm web`: start web target
- `pnpm lint`: run ESLint
- `pnpm lint:fix`: run ESLint with autofix
- `pnpm tsc-check`: run TypeScript type check
- `pnpm prebuild`: generate native projects

## Architecture Notes

- Routing is file-based via Expo Router (`app/`)
- Global state is centralized in `controllers/store.ts`
- Persistent settings/state use MMKV (`controllers/mmkv.ts`)
- Reading pipeline is handled by `hooks/use-reading-content.ts` and `services/reading.service.ts`
- AI providers follow abstraction in `services/ai.service.ts` and `services/ai-providers/`
- Caching/prefetch uses `services/database.service.ts` and `hooks/use-chapter-prefetch.ts`

## Validation

Run these before pushing changes:

```bash
pnpm lint
pnpm tsc-check
```

## Fastlane Delivery

### Android

```bash
fastlane android build
fastlane android upload
fastlane android distribute
```

### iOS

```bash
fastlane ios prepare
fastlane ios build
fastlane ios upload
fastlane ios distribute
```

## Reference Docs

- `docs/PROJECT_DOCS.md`: product and architecture overview
- `docs/references/README.md`: engineering standards index
- `docs/references/testing-and-validation-pattern.md`: validation workflow
