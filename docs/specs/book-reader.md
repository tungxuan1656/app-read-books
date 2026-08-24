# Feature: book-reader

## Behavior

Reader renders raw HTML chapters from local storage, tracks the current chapter index per book, and restores scroll position when reopening. Navigation is next/previous with auto-trigger on scroll boundaries.

## Flow

1. Open `app/reading/index.tsx` with `bookId` param → `hooks/use-reading-content.ts` loads chapter via `services/reading.service.ts` → `getReadingContent(bookId, chapterNumber, readingAIMode)`. For `none` mode this is direct `utils/book.helpers.ts` → `getBookChapterContent(bookId, chapter)` → `new File(books/<bookId>/chapters/chapter-N.html).text()`; AI modes go through cache/provider (see ai-reading).
2. Content is wrapped by `getChapterHtml` and rendered in `components/content-display.tsx` (`RenderHTML` with `useTypographyStore` styles). `ScrollView` scroll throttle 300 ms.
3. Navigation: `hooks/use-reading-navigation.ts` → `booksActions.updateReadingChapter / nextReadingChapter / previousReadingChapter` update `useBooksStore.id2BookReadingChapter[bookId]`. `handleScroll` saves offset debounced (500 ms) via `readingActions.updateReading({offset})` and auto-advances: `offset > contentHeight + 70` → `nextChapter(500)`, `offset < -80` → `previousChapter(500)`. Debounce guard `refCanChangeChapter` (1 s lock).
4. Restore: on mount, `Reading` effect reads `useReadingStore.reading.offset` and `scrollTo` after 200 ms; on `chapter.index` change, scroll resets to top.

## Contract

| Area | Contract |
|---|---|
| Chapter file | `Paths.document/books/<bookId>/chapters/chapter-<N>.html` |
| Store: position | `useBooksStore.id2BookReadingChapter[bookId]: number` (1-based, default 1) |
| Store: scroll | `useReadingStore.reading: { bookId, onScreen, offset }` (`@types/settings.ts` → `ReadingState`) |
| Render | `ContentDisplay` uses `RenderHTML` with `typography` (`font`, `fontSize`, `lineHeight`, `letterSpacing`) |
| Navigation bounds | Caller must prevent `chapter < 1` or `> references.length`; store actions handle clamping (verify in `books.store`). |

## Notes

- Evidence: `hooks/use-reading-content.ts` (load + `getChapterHtml`), `hooks/use-reading-navigation.ts` (next/prev, `handleScroll`, `saveOffset`), `app/reading/index.tsx` (offset save/restore, `useChapterPrefetch` trigger), `components/content-display.tsx`, `utils/book.helpers.ts` (`getBookChapterContent`).
- Open question: Scroll restore is global (`reading.offset`) not per-book — does reopening a different book restore the wrong offset? Check if `reading.bookId` guards it.

## Acceptance criteria
- [a1] App reads raw HTML chapter contents from local directory and renders them correctly.
- [a2] Next and previous chapter navigation works, updating reading state in books.store.
- [a3] Scroll offset position is saved to store and restored when reopening the book.
