# Hệ Thống Gemini AI Content Processing & TTS Integration (v2)

## 📋 Tổng Quan

Hệ thống xử lý nội dung chương truyện bằng Gemini AI (dịch/tóm tắt) và chuyển đổi sang audio TTS. Hoạt động theo 3 modes:

- **Normal**: Hiển thị HTML gốc (không xử lý, không cache)
- **Translate**: Dịch sang tiếng Việt + cache SQLite + TTS on-demand
- **Summary**: Tóm tắt nội dung + cache SQLite + TTS on-demand

## 🎯 Tính Năng Chính

✅ **SQLite Cache** - Thay thế MMKV, cache nội dung đã xử lý và TTS metadata  
✅ **3 Reading Modes** - Normal/Translate/Summary với mode cycling button  
✅ **Debouncing** - 500ms delay khi chuyển mode tránh spam API  
✅ **Prefetch** - Tự động tạo nội dung cho 10 chương tiếp theo  
✅ **TTS On-Demand** - Nút TTS riêng để generate audio khi cần  
✅ **Auto Migration** - Tự động xóa MMKV cache cũ, chỉ chạy một lần  

---

## 🏗️ Kiến Trúc

### Database Schema

```sql
-- Nội dung đã xử lý (translate/summary)
CREATE TABLE processed_chapters (
  id INTEGER PRIMARY KEY,
  book_id TEXT,
  chapter_number INTEGER,
  mode TEXT CHECK(mode IN ('translate', 'summary')),
  content TEXT,
  content_hash TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  UNIQUE(book_id, chapter_number, mode)
);

-- TTS audio metadata
CREATE TABLE tts_audio_cache (
  id INTEGER PRIMARY KEY,
  book_id TEXT,
  chapter_number INTEGER,
  mode TEXT CHECK(mode IN ('normal', 'translate', 'summary')),
  sentence_index INTEGER,
  sentence_text TEXT,
  file_path TEXT,
  file_size INTEGER,
  created_at INTEGER,
  UNIQUE(book_id, chapter_number, mode, sentence_index)
);

-- Prefetch queue
CREATE TABLE prefetch_queue (
  id INTEGER PRIMARY KEY,
  book_id TEXT,
  chapter_number INTEGER,
  mode TEXT,
  status TEXT CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 0,
  error_message TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  UNIQUE(book_id, chapter_number, mode)
);
```

### File Structure

```
tts_audio/
  {bookId}/
    {chapter}/
      normal/
        sentence_0.mp3
        sentence_1.mp3
      translate/
        sentence_0.mp3
      summary/
        sentence_0.mp3
```

---

## 📦 Core Services

### 1. Database Service (`/services/database-service.ts`)

Quản lý SQLite database cho cache và prefetch.

**Key Methods:**
- `getProcessedChapter(bookId, chapter, mode)` - Lấy nội dung đã xử lý
- `saveProcessedChapter(bookId, chapter, mode, content)` - Lưu cache
- `getTTSAudios(bookId, chapter, mode)` - Lấy danh sách TTS audio
- `saveTTSAudio(bookId, chapter, mode, index, text, path)` - Lưu TTS metadata
- `addToPrefetchQueue()` - Thêm chapter vào hàng đợi prefetch
- `getPendingPrefetchTasks(limit)` - Lấy tasks cần xử lý

### 2. Gemini Service (`/services/gemini-service.ts`)

Call Gemini AI API cho translation và summarization.

```typescript
// Dịch sang tiếng Việt
export const translateChapter = async (content: string): Promise<string> => {
  const prompt = MMKVStorage.get(MMKVKeys.GEMINI_TRANSLATE_PROMPT) 
    || DEFAULT_TRANSLATE_PROMPT
  // Call Gemini API...
  return translatedContent
}

// Tóm tắt nội dung
export const summarizeChapter = async (content: string): Promise<string> => {
  const prompt = MMKVStorage.get(MMKVKeys.GEMINI_SUMMARY_PROMPT) 
    || DEFAULT_SUMMARY_PROMPT
  // Call Gemini API...
  return summary
}
```

**Default Prompts:**
- **Translate**: "Hãy dịch nội dung sau sang tiếng Việt..."
- **Summary**: "Hãy tóm tắt nội dung chương truyện sau một cách ngắn gọn..."

### 3. TTS Service (`/services/tts-service.ts`)

Quản lý TTS audio generation và database storage.

```typescript
class TTSService {
  // Generate TTS cho nội dung
  async generateTTS(bookId, chapter, mode, content) {
    // 1. Split content into sentences
    const sentences = breakSummaryIntoLines(content)
    
    // 2. Create directory: tts_audio/{bookId}/{chapter}/{mode}/
    
    // 3. For each sentence:
    //    - Generate audio file
    //    - Save to database
    
    // 4. Emit event for audio player
    this.emitExistingTTS(bookId, chapter, mode)
  }
  
  // Load TTS từ database
  async loadExistingTTS(bookId, chapter, mode): Promise<TTSAudio[]> {
    return await dbService.getTTSAudios(bookId, chapter, mode)
  }
}
```

---

## 🎣 Core Hooks

### 1. useContentProcessor (`/hooks/use-content-processor.ts`)

Xử lý nội dung cho translate và summary modes.

```typescript
const { processContent, isProcessing } = useContentProcessor()

// Usage
const processedContent = await processContent(bookId, chapter, rawContent, mode)
```

**Flow:**
1. Check SQLite cache → Return nếu có
2. Call Gemini API (translateChapter hoặc summarizeChapter)
3. Save to database
4. Return processed content

### 2. usePrefetch (`/hooks/use-prefetch.ts`)

Background prefetch cho 10 chương tiếp theo.

```typescript
usePrefetch(bookId, currentChapter, readingMode, isActive)
```

**Configuration:**
- Prefetch 10 chương tiếp theo
- Max 2 concurrent API calls
- 2 seconds delay giữa các batch
- Abort khi user inactive

**Flow:**
1. Calculate range: [current+1 ... current+10]
2. Filter cached chapters
3. Add to prefetch queue
4. Process queue với rate limiting
5. Update status (pending → processing → completed/failed)

### 3. useReadingChapter (`/hooks/use-reading-chapter.ts`)

Quản lý chapter loading với debouncing.

```typescript
const { content, isLoading } = useReadingChapter(bookId)
```

**Features:**
- **500ms debouncing** khi chuyển mode
- Separate effects cho chapter change vs mode change
- Auto load nội dung khi bookId/chapter thay đổi
- Call `processContent()` cho translate/summary modes

---

## 🎨 UI Components

### 1. Reading Button Top Navigation

4 buttons: **[Translate]** **[Summary]** **[← →]** **[Menu]**

```typescript
// Mode cycling: normal → translate → summary → normal
const cycleReadingMode = () => {
  const modes: ReadingMode[] = ['normal', 'translate', 'summary']
  const currentIndex = modes.indexOf(readingMode)
  const nextMode = modes[(currentIndex + 1) % modes.length]
  setReadingMode(nextMode)
}
```

### 2. Reading TTS Button

Position: Left 12px, Top 16px (floating button)

```typescript
<ReadingButtonTTS
  bookId={bookId}
  chapter={chapter}
  mode={readingMode}
  onPress={handleGenerateTTS}
/>
```

**Behavior:**
- Hiển thị khi mode !== 'normal'
- Call `ttsService.generateTTS()` on press
- Show loading spinner khi đang generate

### 3. Reading Audio Control

Load TTS từ database và phát audio.

```typescript
<ReadingAudioControl
  bookId={bookId}
  chapter={chapter}
  mode={readingMode}
/>
```

**Features:**
- Auto-load TTS audios từ database
- Queue tracks vào react-native-track-player
- Controls: play/pause, next/prev, speed control

---

## 🔄 Data Flow

### Mode Switching Flow

```
User clicks mode button
  ↓
cycleReadingMode() (500ms debounce)
  ↓
setReadingMode(newMode)
  ↓
useReadingChapter detects mode change
  ↓
[Normal mode]
  → Load HTML gốc
  → Display content
  
[Translate/Summary mode]
  → processContent(bookId, chapter, rawContent, mode)
  → Check SQLite cache
  → If not cached: Call Gemini API
  → Save to database
  → Display processed content
```

### TTS Generation Flow

```
User clicks TTS button
  ↓
handleGenerateTTS()
  ↓
ttsService.generateTTS(bookId, chapter, mode, content)
  ↓
1. Split content into sentences
2. Create directory structure
3. For each sentence:
   - Call Capcut TTS API
   - Save audio file
   - Save metadata to database
4. Emit TTS_READY event
  ↓
ReadingAudioControl receives event
  ↓
Load TTSAudios from database
  ↓
Queue tracks to track player
  ↓
Auto-play
```

### Prefetch Flow

```
User reads chapter N
  ↓
usePrefetch(bookId, N, mode, true)
  ↓
Calculate prefetch range: [N+1 ... N+10]
  ↓
Filter out cached chapters
  ↓
Add to prefetch queue in database
  ↓
Process queue (max 2 concurrent):
  For each chapter:
    - status = 'processing'
    - Load raw content
    - Call processContent()
    - status = 'completed' or 'failed'
    - 2s delay before next
  ↓
Background processing continues...
```

---

## 🚀 Migration System

### Auto Migration on Startup

```typescript
// app/_layout.tsx
useEffect(() => {
  const runMigration = async () => {
    const migrated = MMKVStorage.get('MIGRATION_V2_DONE')
    if (migrated) return
    
    await migrateToNewSystem()
    MMKVStorage.set('MIGRATION_V2_DONE', true)
  }
  
  runMigration()
}, [])
```

### Migration Tasks (`/utils/migration-helper.ts`)

```typescript
export const migrateToNewSystem = async () => {
  // 1. Clear old MMKV cache
  const summaryCache = new MMKV({ id: 'chapter-summaries' })
  summaryCache.clearAll()
  
  const ttsCache = new MMKV({ id: 'tts-cache' })
  ttsCache.clearAll()
  
  // 2. Delete old TTS files (flat structure)
  const oldCacheDir = new Directory(Paths.document, 'tts_audio')
  const files = oldCacheDir.list()
  for (const file of files) {
    if (file.name.includes('_') && file.name.endsWith('.mp3')) {
      file.delete() // Old format: {bookId}_{chapter}_{index}.mp3
    }
  }
  
  // 3. Initialize new database
  await dbService.initialize()
}
```

**Migration chỉ chạy một lần:**
- Tracked bằng `MIGRATION_V2_DONE` flag
- Xóa toàn bộ MMKV cache cũ
- Xóa TTS files cũ (format khác)
- Initialize SQLite database

---

## ⚙️ Configuration

### Settings Keys (MMKV)

```typescript
// Gemini API
GEMINI_API_KEY: string          // API key từ Google AI Studio
GEMINI_MODEL: string            // Model name (default: gemini-2.0-flash-exp)
GEMINI_SUMMARY_PROMPT: string   // Custom prompt cho summary
GEMINI_TRANSLATE_PROMPT: string // Custom prompt cho translation

// Capcut TTS
CAPCUT_TOKEN: string            // Token từ Capcut
CAPCUT_WS_URL: string           // WebSocket URL
CAPCUT_VOICE: string            // Voice ID

// Migration
MIGRATION_V2_DONE: boolean      // Flag đã migrate
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Mode cycling: Normal → Translate → Summary → Normal
- [ ] Debouncing: Rapid mode changes không spam API
- [ ] Cache: Load lại chapter đã cached không call API
- [ ] Prefetch: Background processing không ảnh hưởng UI
- [ ] TTS button: Generate audio cho cả 3 modes
- [ ] Audio control: Play/pause/next/prev hoạt động
- [ ] Migration: Chạy một lần, xóa cache cũ thành công

### Performance Metrics

- **Cache hit rate**: >90% cho chapters đã đọc
- **Prefetch coverage**: 10 chapters ahead luôn ready
- **API call reduction**: ~95% nhờ cache và prefetch
- **Debounce effectiveness**: 0 redundant API calls khi toggle mode

---

## 📚 Key Files Reference

### Services
- `/services/database-service.ts` - SQLite CRUD operations
- `/services/gemini-service.ts` - Gemini AI API calls
- `/services/tts-service.ts` - TTS generation & database
- `/services/convert-tts.ts` - Capcut TTS WebSocket

### Hooks
- `/hooks/use-content-processor.ts` - Content processing logic
- `/hooks/use-prefetch.ts` - Background prefetch
- `/hooks/use-reading-chapter.ts` - Chapter loading with debouncing
- `/hooks/use-tts-audio.ts` - TTS audio playback

### Components
- `/app/reading/index.tsx` - Main reading screen
- `/components/reading/reading-button-top-navigation.tsx` - Mode buttons
- `/components/reading/reading-button-tts.tsx` - TTS trigger button
- `/components/reading/reading-audio-control.tsx` - Audio player UI

### State Management
- `/controllers/store.ts` - Zustand store with readingMode state

### Utils
- `/utils/migration-helper.ts` - MMKV → SQLite migration
- `/utils/cache-manager.ts` - Cache statistics and clearing

---

## 🔮 Future Improvements

1. **Offline mode** - Download và cache toàn bộ truyện
2. **Batch processing UI** - Restore auto-generate với progress tracking
3. **Smart prefetch** - Machine learning để predict chapters user sẽ đọc
4. **TTS voice selection** - Multiple voices cho translate/summary
5. **Content diff detection** - Re-process khi source content update
6. **Analytics** - Track cache hit rate, API usage, mode preferences

---

## 📝 Notes

- **Normal mode không cache** vì hiển thị HTML gốc, không cần xử lý
- **Prefetch chỉ chạy cho translate/summary** vì normal không cần
- **Debouncing 500ms** tối ưu balance giữa UX và API cost
- **Max 2 concurrent prefetch** tránh rate limiting từ Gemini API
- **TTS on-demand** thay vì auto-generate tiết kiệm bandwidth

---

**Version**: 2.0  
**Last Updated**: 2025-11-21  
**Architecture**: SQLite + Prefetch + On-demand TTS
