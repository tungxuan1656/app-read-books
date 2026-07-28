# Feature: chapter-prefetch

## Acceptance criteria
- [a1] Background prefetch triggers when current chapter content is fully loaded and ready.
- [a2] Prefetch batch checks cache status in SQLite, filtering out already processed chapters.
- [a3] Prefetch processes missing chapters sequentially and halts safely on chapter or mode change.
