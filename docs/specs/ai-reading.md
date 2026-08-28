# Feature: ai-reading

## Behavior

Chapters can be read in three modes: `none` (raw HTML), `translate`, or `summary`. AI modes process raw content through an OpenAI-compatible provider, chunking long chapters, merging custom headers/extra body from settings, and caching results in SQLite for instant reuse.

## Flow

1. Mode switch: `useReadingStore.readingAIMode` (`none` | `translate` | `summary` — keys from `AI_PROCESS_ACTIONS` default `translate`/`summary`) changes → `hooks/use-reading-content.ts` `useEffect` reloads via `services/reading.service.ts` → `getReadingContent(bookId, chapter, actionKey)`.
2. `getReadingContent`: if `none` return raw `getBookChapterContent`; else resolve prompt via `services/ai-actions.service.ts` → `getActionByKey(actionKey)` and delegate to `services/content-processor.ts` → `processChapterContent({bookId, chapterNumber, actionKey, prompt})`.
3. `processChapterContent`: check `services/database.service.ts` → `dbService.getProcessedChapter(bookId, chapter, actionKey)` (cache hit → return `cached.content`); else load raw, get `getAIProviderByType('openai')` → `provider.processContent(prompt, rawContent)`, convert markdown to HTML (`simpleMdToHtml`), then `dbService.saveProcessedChapter(...)` with `UNIQUE(book_id, chapter_number, mode)` upsert. Pending dedup via `pendingRequests` map (`bookId_chapter_actionKey`).
4. Provider `services/ai-providers/openai.provider.ts` → `createOpenAIProvider().processContent`: rewrite prompt (`file original_content.txt` → `nội dung bên dưới`), split via `splitContentIntoChunks(content, AI_MIN_CHUNK_SIZE)`, then call `callOpenAIAPI` per chunk (parallel `Promise.all`), joining with `<br><br>` and `cleanProviderResponse`.

## Contract

### AI provider (OpenAI-compatible)

| Item | Value |
|---|---|
| Endpoint | `useSettingsStore.settings.OPENAI_API_URL` → `getOpenAIApiUrl()` fallback `http://localhost:8317/v1/chat/completions`; default `https://copilot.tungxuan.io.vn/v1/chat/completions` |
| Model | `useSettingsStore.settings.OPENAI_MODEL` → `getOpenAIModel()` fallback `gpt-4.1`; default `gpt-4o` |
| Request | `POST` `apiUrl`, headers `{ "Content-Type":"application/json", ...getSharedCustomHeaders() }`, body `JSON.stringify({ model, messages, ...getSharedExtraBody() })` where `messages: [{role:"system", content: adjustedPrompt}, {role:"user", content: "Đây là nội dung cần xử lý…\n\n"+chunk}]` (chunked variant adds `(phần i/n)`). `extraBody` merges verbatim (default `{"thinking":{"type":"disabled"},"stream":false}`). |
| Custom headers | `AI_CUSTOM_HEADERS` JSON object string → `getSharedCustomHeaders('OpenAIProvider')`; invalid / non-object → `{}` with warn log |
| Extra body | `AI_EXTRA_BODY` JSON object string → `getSharedExtraBody('OpenAIProvider')`; invalid / non-object → `{}` |
| Response | JSON `data.choices[0].message.content` (string); missing → throw `Không nhận được response từ OpenAI` |
| Retry | 3 attempts, exponential backoff `2^attempt * 1000 ms`; throws last error after final attempt |

### Chunking (`services/ai-providers/provider-shared.ts`)

| Item | Value |
|---|---|
| Split key | `<br><br>` |
| Min chunk size | `getSharedMinChunkSize()` parses `AI_MIN_CHUNK_SIZE` (default `1300`), fallback `1300` if NaN/≤0 |
| Algorithm | Split by `splitKey`, then `groupPartsIntoChunks` trying `maxChunks=10` down to `1`; picks smallest `numChunks` where `avgChunkSize >= minChunkSize` or `numChunks===1`; if no `splitKey`, returns `[content]` |
| Fan-out | `chunks.length===1` single `callOpenAIAPI`; else parallel `chunks.map(callOpenAIAPI)` with per-chunk `sanitizeAiHtmlContent` then `join('<br><br>')` and `cleanProviderResponse` (strips `<div>`/`</div>`/`<p>`/`</p>`, collapses `(<br>){3,}` → `<br><br>`) |

### SQLite cache (`services/database.service.ts` → `reading_app.db`)

| Item | Value |
|---|---|
| Table | `processed_chapters (id PK, book_id TEXT, chapter_number INT, mode TEXT, content TEXT, content_hash TEXT, created_at INT, updated_at INT, UNIQUE(book_id, chapter_number, mode))` + indexes `idx_chapters_lookup(book_id, chapter_number, mode)`, `idx_chapters_book(book_id)` |
| Writes | `saveProcessedChapter` upsert `ON CONFLICT(book_id, chapter_number, mode) DO UPDATE` |
| Reads | `getProcessedChapter(bookId, chapter, mode)` single; `getChaptersCacheStatus(bookId, chapters[], mode)` batch `IN (...)` |
| Modes | `none` bypasses cache/provider; `translate`/`summary` use `actionKey` as `mode` column |

## Notes

- Evidence: `services/ai.service.ts` / `ai-providers/openai.provider.ts` / `provider-shared.ts`, `services/content-processor.ts`, `services/database.service.ts`, `services/reading.service.ts`, `hooks/use-reading-content.ts`, `controllers/settings-schema.ts`.
- Resolved — HTML pipeline: `openai.provider.ts` `processContent` does per-chunk `sanitizeAiHtmlContent` + final `cleanProviderResponse` (strips `<div>`/`<p>`, collapses `<br>`) which returns HTML-fragment; `content-processor.ts` then applies `simpleMdToHtml` once to convert any markdown remnants (`**bold**`→`<strong>`, `\n\n`→`<br><br>`). Single conversion — no double-HTML risk; `cleanProviderResponse` does not produce Markdown.
- Resolved — chunking fallback: `provider-shared.ts` `splitContentIntoChunks` returns `[content]` when `parts.length <= 1` (no `<br><br>`). Intended: long chapters without split key are sent as one `callOpenAIAPI` request; server token limit governs truncation. With `<br><br>` present, `groupPartsIntoChunks` picks smallest `numChunks ≤10` where `avgChunkSize ≥ minChunkSize` (from `AI_MIN_CHUNK_SIZE`, fallback `1300`). Very large single-chunk payloads rely on retry (3× `2^attempt`) — not chunked further by design.

## Acceptance criteria
- [a1] OpenAI compatible provider handles chat completion payload requests using custom prompts.
- [a2] Reading content hook supports switching reading AIMode (none, translate, summary) dynamically.
- [a3] Processed chapters are saved in local SQLite database and retrieved as cache hit.
