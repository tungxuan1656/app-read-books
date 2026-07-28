# Project Description — App Read Books

## 1. Introduction
**App Read Books** is a mobile application built using React Native (Expo) that allows users to read books and novels with advanced AI features such as machine translation and summarization using a Copilot-compatible API.

## 2. Core Features

### 2.1. Book Library Management
- **Book List:** Displays all downloaded novels/books.
- **Add Book:**
  - Fetches the list of available books from a remote Supabase backend.
  - Downloads the book as a `.zip` archive and unzips it into the local app filesystem.
- **Delete Book:** Allows deleting books from the device via a swipe-left gesture on the book list.
- **Book Details:** Displays metadata, chapters, and description in a Bottom Sheet.

### 2.2. Book Reader
- **Content Rendering:** Renders chapter text formatted as HTML inside a WebView.
- **Navigation:**
  - Navigate between chapters (Previous/Next).
  - Automatically persists the current reading position (scroll offset) and restores it when reopened.
  - Quick-scroll to bottom of the page button.
- **AI Reading Modes:**
  - **Default (None):** Renders the original text of the book.
  - **Translation (Translate):** Leverages Copilot API to translate chapter content to Vietnamese with custom target constraints.
  - **Summary (Summary):** Summarizes the chapter content to 50-60% length.

### 2.3. Settings Management
- Configure crucial parameters:
  - **AI (OpenAI-compatible):** Custom API URL (`OPENAI_API_URL`), Model (`OPENAI_MODEL`), Custom Headers, Extra Body parameters, and custom AI actions (translation and summary prompts).
  - **Books Download:** Books API URL (`BOOKS_API_URL`) to fetch available books from Supabase Functions.
  - **Prefetch:** The number of chapters to prefetch ahead (`PREFETCH_COUNT`, default is 3).
- Reading Layout controls (Typography): font family, font size, and line height.

## 3. Architecture & Technologies

### 3.1. Tech Stack
- **Framework:** React Native (Expo SDK 54).
- **Language:** TypeScript.
- **State Management:** Zustand (with MMKV integration for persistence).
- **Navigation:** Expo Router.
- **Storage:** MMKV (settings & simple states), Expo File System (book folders), and SQLite (`expo-sqlite`) for processed AI cache.
- **AI Integration:** OpenAI-compatible chat completion provider endpoint.
- **UI Components:** React Native Gesture Handler, Gorhom Bottom Sheet.

### 3.2. Primary Folder Structure
- `app/`: Route screen endpoints and routing layouts (Expo Router).
- `components/`: Reusable UI elements.
- `controllers/stores/`: Zustand stores grouped by concern.
- `services/`: Business workflows, API integrations, and database managers.
- `hooks/`: Screen orchestration hooks and lifecycle controllers.
- `utils/`: Common pure helpers.

### 3.3. Refactored Ownership Boundaries
- `app/*`: Route mapping + UI composition only.
- `hooks/*`: Orchestrating component lifecycle, cancellation, and store-service bindings.
- `services/*`: Core IO, networking, filesystem, database, and AI provider integrations.
- `controllers/*`: State schemas, store initializers, mmkv bridges, and migrations.

## 4. Operational Flows

### 4.1. App Launch & Initialization
1. **Splash Screen:** Shown during assets/fonts loading.
2. **State Restoring:** Zustand reads MMKV state.
3. **State Verification:** Verifies if a book was previously being read (`reading.onScreen`).
   - If true: Navigates directly to the reader route `/reading`.
   - If false: Navigates to `/` (home book library).

### 4.2. Book Download Flow
1. User opens the "Add Book" screen (`app/add-book/index.tsx`).
2. Hook `useAddBook` calls `book-import.service.ts` to fetch available books.
3. User selects a book to download:
   - File `.zip` is downloaded to device cache via `downloadFile`.
   - Extracted to app local folder using `unzip`.
   - ZIP file is deleted automatically upon success.
4. Library list is updated to reflect new downloaded books.

### 4.3. Reading & AI Processing
1. `Reading` screen initialized with `bookId`.
2. Hook `useReadingContent` runs:
   - Resolves active `readingAIMode`.
   - **Mode None:** Reads raw chapter content directly from device FileSystem.
   - **AI Modes (Translate/Summary):**
     - Queries SQLite database for existing cached version.
     - Cache Hit: Returns cached HTML text.
     - Cache Miss: Fetches raw text, constructs OpenAI request, processes it, saves HTML to SQLite, and returns.
3. WebView displays the finalized HTML page.

## 5. Configuration Requirements
To run all functionalities, ensure these parameters are configured in Settings:
- **Books API URL:** Supabase Function endpoint to load book metadata and files. (Codebase provides default).
- **AI API URL / Model:** Target OpenAI-compatible URL/model (defaults to `copilot.tungxuan.io.vn` and `gpt-4o`).
- **AI Min Chunk Size:** Minimum characters count to divide text chunks before sending to the AI model.
