# Feature: book-library

## Behavior

Home lists all locally imported books. Each item shows name, author, chapter count, and cover. User can delete a book (swipe) and view details (bottom sheet with metadata + chapter index).

## Flow

1. Home (`app/index.tsx`) reads `id2Book` from `useBooksStore` and renders `FlatList` of book IDs via `components/home-book-item.tsx`. Data comes from `utils/book.helpers.ts` → `readFolderBooks()` which scans `Paths.document/books`, reads each `book.json`, and drops invalid directories.
2. Swipe-to-delete: `components/item-swipeable.tsx` (`ItemSwipeable`) wraps each row; `onDeleteBook` calls `utils/book.helpers.ts` → `deleteBook(bookPath)` (`new Directory(bookPath).delete()`) and updates `books.store`.
3. Tap item → `components/sheet-book-info.tsx` (`SheetBookInfo`) shows `book.json` fields (name, author, description/synopsis, cover) and a list of `references` (chapter index).

## Contract

| Area | Contract |
|---|---|
| Source of truth | Filesystem `books/<bookId>/book.json` + `books/<bookId>/chapters/chapter-N.html`. No network after import. |
| List model | `Book` from `book.json` (fields mirror `BookMeta` but local). Displayed fields: name, author, chapterCount (`references.length`), cover image. |
| Delete | `deleteBook(bookPath)` deletes the entire `books/<bookId>` directory; success toast `Xoá thành công!`, failure toast `Không thể xóa sách` and rethrows. SQLite `processed_chapters` rows for that `bookId` remain (become unreachable) — per BR-10 exception; explicit clear via `dbService.clearBookCache(bookId)` is available in Settings → Cache Manager but not auto-called on delete. |
| Details sheet | Bottom sheet renders static metadata + scrollable `references` array. |

## Notes

- Evidence: `app/index.tsx` (Home FlatList), `components/home-book-item.tsx`, `components/item-swipeable.tsx`, `components/sheet-book-info.tsx`, `utils/book.helpers.ts` (`readFolderBooks`, `getBook`, `deleteBook`), `services/database.service.ts` `clearBookCache`.
- Resolved — orphan cache: delete intentionally leaves `processed_chapters` rows (BR-10 "become unreachable"); `clearBookCache(bookId)` / `clearAllCache` exists for manual GC via Cache Manager. Auto-delete on swipe would add IO failure mode; current reachability-only behavior is documented.
- Resolved — cover: `home-book-item.tsx` renders `book.json` `cover` if local file path else fallback; remote URL not used after import.

## Acceptance criteria
- [a1] Home screen displays list of downloaded books with name, author, chapter count, and cover image.
- [a2] Swipe-to-delete gesture removes the selected book and all its associated directory files from local storage.
- [a3] Book details are shown in a Bottom Sheet including chapter index list.
