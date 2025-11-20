# Đề xuất cải tiến kiến trúc app-read-books

## 1. Cải tiến Book Metadata

### Interface Book mở rộng:

```typescript
interface Book {
  // Core info (hiện tại)
  id: string
  name: string
  author: string
  count: number  // Đổi từ string sang number
  references: ChapterReference[]  // Thay vì string[]
  
  // Metadata mở rộng
  description?: string           // Tóm tắt nội dung
  coverImage?: string           // Đường dẫn ảnh bìa local
  thumbnail?: string            // Thumbnail nhỏ
  
  // Thông tin phân loại
  category?: string             // Thể loại chính
  tags?: string[]              // Tags/từ khóa
  genre?: string[]             // Thể loại (có thể nhiều)
  language?: 'vi' | 'cn' | 'en' | 'other'
  
  // Trạng thái
  status?: 'ongoing' | 'completed' | 'hiatus'
  rating?: number              // Đánh giá 1-5
  
  // Metadata kỹ thuật
  version?: string             // Version của book package
  createdAt?: string          // ISO timestamp
  updatedAt?: string          // ISO timestamp
  lastReadAt?: string         // Lần đọc cuối
  
  // Thống kê
  totalWords?: number         // Tổng số từ
  estimatedReadTime?: number  // Phút (ước tính)
  
  // Source info
  sourceUrl?: string          // URL gốc (nếu có)
  publisher?: string
  translator?: string         // Người dịch (nếu có)
}

interface ChapterReference {
  index: number
  title: string
  wordCount?: number
  hasSummary?: boolean        // Đã có summary chưa
  hasAudio?: boolean          // Đã có TTS chưa
}
```

### Validation Schema:

```typescript
// Sử dụng Zod hoặc Yup để validate
import { z } from 'zod'

const BookSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  author: z.string(),
  count: z.number().int().positive(),
  references: z.array(z.object({
    index: z.number(),
    title: z.string(),
    wordCount: z.number().optional(),
    hasSummary: z.boolean().optional(),
    hasAudio: z.boolean().optional(),
  })),
  // ... các field khác
})

// Validate khi import book
const validateBook = (data: unknown): Book => {
  return BookSchema.parse(data)
}
```

## 2. Cải tiến File Storage Structure

### Cấu trúc folder đề xuất:

```
DocumentDirectory/
├── books/
│   ├── {bookId}/
│   │   ├── book.json           # Metadata
│   │   ├── cover.jpg           # Ảnh bìa (nếu có)
│   │   ├── thumbnail.jpg       # Thumbnail nhỏ
│   │   ├── chapters/
│   │   │   ├── chapter-1.html
│   │   │   ├── chapter-2.html
│   │   │   └── ...
│   │   └── assets/             # Hình ảnh trong truyện (optional)
│   │       └── images/
├── tts_audio/                  # TTS cache
│   └── {audioTaskId}.mp3
├── summaries/                  # Summary cache (có thể tách riêng)
│   └── {bookId}/
│       └── chapter-{n}.txt
└── download_books/             # Temp downloads
    └── {filename}.zip
```

### Utility functions cần bổ sung:

```typescript
// Lấy đường dẫn ảnh bìa
export const getBookCoverPath = (bookId: string): string => {
  return new File(
    new Directory(Paths.document, `books/${bookId}`),
    'cover.jpg'
  ).uri
}

// Check book có ảnh bìa không
export const hasBookCover = (bookId: string): boolean => {
  const coverFile = new File(
    new Directory(Paths.document, `books/${bookId}`),
    'cover.jpg'
  )
  return coverFile.exists
}

// Tính tổng dung lượng của 1 book
export const getBookSize = async (bookId: string): Promise<number> => {
  const bookDir = new Directory(Paths.document, `books/${bookId}`)
  // Tính tổng size của tất cả files
  // ...
}

// Xuất book ra ZIP để share/backup
export const exportBookToZip = async (bookId: string): Promise<string> => {
  // Export book + metadata + cache
  // ...
}
```

## 3. Cải tiến TTS Service

### A. Security - Di chuyển token ra khỏi code:

```typescript
// constants/SettingConfigs.ts - THÊM CONFIG
{
  key: 'CAPCUT_TOKEN',
  label: 'Capcut TTS Token',
  inputType: 'multiline',
  placeholder: 'Nhập Capcut TTS Token (lấy từ devtools)',
  description: 'Token để sử dụng dịch vụ Text-to-Speech của Capcut. Token này cần được làm mới định kỳ.',
  lines: 3,
},
{
  key: 'CAPCUT_DEVICE_ID',
  label: 'Capcut Device ID',
  inputType: 'single',
  placeholder: 'Nhập Device ID',
  lines: 1,
},
{
  key: 'CAPCUT_IID',
  label: 'Capcut IID',
  inputType: 'single',
  placeholder: 'Nhập IID',
  lines: 1,
}
```

```typescript
// services/convert-tts.ts - SỬA
import { MMKVStorage } from '@/controllers/mmkv'
import { MMKVKeys } from '@/constants'

function createCapcutMessage(sentence: string, voice: string) {
  const token = MMKVStorage.get(MMKVKeys.CAPCUT_TOKEN) as string
  const deviceId = MMKVStorage.get(MMKVKeys.CAPCUT_DEVICE_ID) as string || '7486429558272460289'
  const iid = MMKVStorage.get(MMKVKeys.CAPCUT_IID) as string || '7486431924195657473'
  
  if (!token) {
    throw new Error('Capcut token chưa được cấu hình. Vui lòng vào Settings để thiết lập.')
  }
  
  return {
    appkey: 'ddjeqjLGMn',
    event: 'StartTask',
    namespace: 'TTS',
    payload: `{"audio_config":{"bit_rate":128000,"format":"mp3","sample_rate":24000},"speaker":"${voice}","text":"${preprocessSentence(sentence)}"}`,
    token: token,
    version: 'sdk_v1',
  }
}
```

### B. Rate Limiting & Queue System:

```typescript
// services/tts-queue.ts - MỚI
class TTSQueue {
  private queue: Array<{
    sentence: string
    taskId: string
    voice: string
    resolve: (path: string | null) => void
  }> = []
  
  private processing = false
  private maxConcurrent = 3  // Tối đa 3 request đồng thời
  private delayBetweenRequests = 500  // 500ms giữa các request
  
  async add(sentence: string, taskId: string, voice: string): Promise<string | null> {
    return new Promise((resolve) => {
      this.queue.push({ sentence, taskId, voice, resolve })
      this.processQueue()
    })
  }
  
  private async processQueue() {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    
    while (this.queue.length > 0) {
      const item = this.queue.shift()!
      
      const result = await _getOrGenerateAudioFile(
        item.sentence,
        item.taskId,
        item.voice
      )
      
      item.resolve(result)
      
      // Delay giữa các request
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests))
      }
    }
    
    this.processing = false
  }
  
  clear() {
    this.queue = []
    this.processing = false
  }
}

export const ttsQueue = new TTSQueue()
```

### C. Error Handling & Retry Logic:

```typescript
// services/convert-tts.ts - CẢI TIẾN
const generateAudioFromWebSocket = (
  sentence: string,
  voice: string,
  retryCount = 0,
  maxRetries = 3
): Promise<Uint8Array | null> => {
  return new Promise((resolve) => {
    // ... existing code
    
    ws.onerror = async (error) => {
      console.error(`TTS WebSocket error (attempt ${retryCount + 1}/${maxRetries}):`, error)
      
      if (retryCount < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise(r => setTimeout(r, delay))
        
        // Retry
        const result = await generateAudioFromWebSocket(
          sentence,
          voice,
          retryCount + 1,
          maxRetries
        )
        resolve(result)
      } else {
        closeConnection(null)
      }
    }
  })
}
```

## 4. Cải tiến Cache Management

### A. Cache Statistics & Cleanup:

```typescript
// utils/cache-manager.ts - BỔ SUNG

export interface CacheStats {
  tts: {
    totalFiles: number
    totalSize: number
    sizeByBook: Record<string, number>
  }
  summary: {
    totalEntries: number
    entriesByBook: Record<string, number>
  }
  books: {
    totalBooks: number
    totalSize: number
    sizePerBook: Record<string, number>
  }
}

export const getCacheStats = async (): Promise<CacheStats> => {
  // Tổng hợp thống kê cache từ TTS, Summary, Books
  // ...
}

export const clearOldCache = async (daysOld: number = 30): Promise<void> => {
  // Xóa cache cũ hơn N ngày
  // ...
}

export const clearUnusedTTSCache = async (): Promise<void> => {
  // Xóa TTS cache của những book đã bị xóa
  // ...
}
```

### B. Background Cache Optimization:

```typescript
// hooks/use-cache-optimizer.ts - MỚI

export const useCacheOptimizer = () => {
  useEffect(() => {
    // Chạy background task để:
    // 1. Xóa TTS cache của books đã xóa
    // 2. Pre-generate TTS cho chapters tiếp theo (predictive caching)
    // 3. Compress old summaries
    
    const optimizeCache = async () => {
      const stats = await getCacheStats()
      
      // Nếu cache > 500MB, cleanup
      if (stats.tts.totalSize > 500 * 1024 * 1024) {
        await clearOldCache(30)
      }
    }
    
    // Chạy mỗi khi app start
    optimizeCache()
  }, [])
}
```

## 5. Database Layer (Optional - cho advanced features)

Nếu cần query phức tạp (search, filter, sort), có thể thêm SQLite:

```typescript
// db/schema.ts
import { SQLiteDatabase } from 'expo-sqlite'

const schema = `
  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    author TEXT,
    count INTEGER,
    category TEXT,
    status TEXT,
    rating REAL,
    created_at TEXT,
    updated_at TEXT,
    last_read_at TEXT
  );
  
  CREATE INDEX idx_books_category ON books(category);
  CREATE INDEX idx_books_author ON books(author);
  CREATE INDEX idx_books_last_read ON books(last_read_at);
  
  CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id TEXT NOT NULL,
    chapter_index INTEGER NOT NULL,
    title TEXT,
    word_count INTEGER,
    has_summary BOOLEAN DEFAULT 0,
    has_audio BOOLEAN DEFAULT 0,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    UNIQUE(book_id, chapter_index)
  );
  
  CREATE TABLE IF NOT EXISTS reading_progress (
    book_id TEXT PRIMARY KEY,
    current_chapter INTEGER,
    scroll_offset INTEGER,
    progress_percent REAL,
    last_read_at TEXT,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
  );
`

// Sync file system với database
export const syncBooksToDatabase = async (books: Book[]) => {
  // Insert/update books vào SQLite
  // Cho phép query nhanh: search, filter, sort
}
```

### Khi nào nên dùng Database?

- ✅ Khi có > 100 books cần search/filter
- ✅ Khi cần full-text search trong metadata
- ✅ Khi cần advanced sorting (by rating, last read, category)
- ✅ Khi cần sync reading progress across devices
- ❌ Không cần nếu chỉ có < 50 books và chỉ browse đơn giản

## 6. Monitoring & Analytics

```typescript
// utils/analytics.ts - MỚI

export const trackEvent = (event: string, data?: Record<string, any>) => {
  console.log(`[Analytics] ${event}:`, data)
  // Có thể tích hợp Firebase Analytics, Mixpanel, etc.
}

// Track TTS usage
export const trackTTSGeneration = (
  bookId: string,
  chapterIndex: number,
  duration: number,
  fromCache: boolean
) => {
  trackEvent('tts_generation', {
    bookId,
    chapterIndex,
    duration,
    fromCache,
    timestamp: new Date().toISOString()
  })
}

// Track reading behavior
export const trackReadingSession = (
  bookId: string,
  chapterIndex: number,
  durationMinutes: number
) => {
  trackEvent('reading_session', {
    bookId,
    chapterIndex,
    duration: durationMinutes,
    timestamp: new Date().toISOString()
  })
}
```

## 7. Performance Optimizations

### A. Lazy Loading Chapters:

```typescript
// Thay vì load toàn bộ chapter, load theo chunks
export const getChapterContentChunked = async (
  bookId: string,
  chapter: number,
  offset: number = 0,
  limit: number = 5000  // Load 5000 chars mỗi lần
): Promise<{ content: string, hasMore: boolean }> => {
  const fullContent = await getBookChapterContent(bookId, chapter)
  const chunk = fullContent.substring(offset, offset + limit)
  
  return {
    content: chunk,
    hasMore: offset + limit < fullContent.length
  }
}
```

### B. Image Optimization:

```typescript
// utils/image-optimizer.ts
import * as ImageManipulator from 'expo-image-manipulator'

export const optimizeBookCover = async (
  sourceUri: string,
  bookId: string
): Promise<string> => {
  // Resize và compress ảnh bìa
  const result = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: 600 } }],  // Max width 600px
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  )
  
  // Lưu vào books/{bookId}/cover.jpg
  // ...
  
  return result.uri
}
```

## Tổng kết ưu tiên

### 🔴 CRITICAL (Làm ngay):
1. ✅ Di chuyển Capcut token ra khỏi code → Settings
2. ✅ Thêm validation cho book.json khi import
3. ✅ Thêm error handling cho TTS failures

### 🟡 HIGH PRIORITY (Làm sớm):
4. ⏱️ Mở rộng Book interface với metadata
5. ⏱️ Implement TTS queue system
6. ⏱️ Thêm cache cleanup utilities

### 🟢 MEDIUM PRIORITY (Có thể làm sau):
7. 📊 Thêm cache statistics UI
8. 🖼️ Support book covers
9. 📈 Analytics & monitoring

### 🔵 LOW PRIORITY (Nice to have):
10. 🗄️ SQLite database cho advanced search
11. ☁️ Cloud sync
12. 📤 Export/Import settings & reading progress
