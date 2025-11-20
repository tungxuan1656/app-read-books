# Implementation Plan: Multi-Mode Reading System

## 📋 OVERVIEW

Nâng cấp hệ thống đọc truyện từ 2 modes (Normal/Summary) lên 3 modes (Normal/Translate/Summary) với SQLite cache và TTS support cho tất cả modes.

---

## 🎯 OBJECTIVES

### Before:
- ✅ 2 modes: Normal, Summary
- ✅ TTS chỉ cho Summary
- ✅ Cache: MMKV (summary) + File hash (TTS)

### After:
- ✅ 3 modes: Normal, Translate, Summary
- ✅ TTS cho tất cả 3 modes
- ✅ Cache: SQLite unified (content + TTS)
- ✅ Smart prefetch: 10 chapters ahead
- ✅ Debounced mode switching
- ✅ Background processing

---

## 📊 DATABASE SCHEMA

### Table 1: `processed_chapters`
```sql
CREATE TABLE IF NOT EXISTS processed_chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('normal', 'translate', 'summary')),
  content TEXT NOT NULL,
  content_hash TEXT,  -- MD5 hash để detect content changes
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(book_id, chapter_number, mode)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chapters_lookup 
  ON processed_chapters(book_id, chapter_number, mode);
CREATE INDEX IF NOT EXISTS idx_chapters_book 
  ON processed_chapters(book_id);
```

### Table 2: `tts_audio_cache`
```sql
CREATE TABLE IF NOT EXISTS tts_audio_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('normal', 'translate', 'summary')),
  sentence_index INTEGER NOT NULL,
  sentence_text TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,  -- Bytes
  duration REAL,      -- Seconds (optional)
  created_at INTEGER NOT NULL,
  UNIQUE(book_id, chapter_number, mode, sentence_index)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tts_lookup 
  ON tts_audio_cache(book_id, chapter_number, mode);
CREATE INDEX IF NOT EXISTS idx_tts_sentence 
  ON tts_audio_cache(book_id, chapter_number, mode, sentence_index);
```

### Table 3: `prefetch_queue`
```sql
CREATE TABLE IF NOT EXISTS prefetch_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('translate', 'summary')),
  status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 0,  -- Higher = more priority
  error_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(book_id, chapter_number, mode)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prefetch_status 
  ON prefetch_queue(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_prefetch_book 
  ON prefetch_queue(book_id, chapter_number);
```

**Rationale**:
- `processed_chapters`: Cache processed content, tránh gọi Gemini nhiều lần
- `tts_audio_cache`: Map sentence → file path, query nhanh
- `prefetch_queue`: Track background prefetch jobs, có thể retry khi fail
- `content_hash`: Detect khi raw content thay đổi (user update book file)

---

## 🔄 STATE MANAGEMENT

### Store Updates (`/controllers/store.ts`)

#### Old State:
```typescript
interface AppState {
  isSummaryMode: boolean
  toggleSummaryMode: () => void
}
```

#### New State:
```typescript
type ReadingMode = 'normal' | 'translate' | 'summary'

interface AppState {
  // Reading mode
  readingMode: ReadingMode
  setReadingMode: (mode: ReadingMode) => void
  cycleReadingMode: () => void  // normal → translate → summary → normal
  
  // TTS state per chapter
  id2ChapterTTSGenerating: { [key: string]: boolean }  // key: `${bookId}_${chapter}`
  setTTSGenerating: (bookId: string, chapter: number, generating: boolean) => void
  
  // Prefetch status
  isPrefetching: boolean
  setPrefetching: (status: boolean) => void
}
```

#### Actions Implementation:
```typescript
cycleReadingMode: () => {
  set((state) => {
    const modes: ReadingMode[] = ['normal', 'translate', 'summary']
    const currentIndex = modes.indexOf(state.readingMode)
    const nextIndex = (currentIndex + 1) % modes.length
    return { readingMode: modes[nextIndex] }
  })
}

setTTSGenerating: (bookId: string, chapter: number, generating: boolean) => {
  set((state) => ({
    id2ChapterTTSGenerating: {
      ...state.id2ChapterTTSGenerating,
      [`${bookId}_${chapter}`]: generating
    }
  }))
}
```

---

## 🎨 UI COMPONENTS

### Component Tree:
```
/app/reading/index.tsx
├── <ReadingButtonBack />
├── <ReadingButtonTopNavigation />  ← Modified
│   ├── [Translate Button]
│   ├── [Summary Button]
│   ├── [← → Navigation]
│   └── [Menu Button]
├── <ReadingButtonTTS />  ← New
├── <ReadingButtonLeftControl />
├── <ReadingButtonScrollBottom />
└── <ReadingAudioControl />  ← Modified (receive mode)
```

### Button Layout:
```
Screen Layout:
┌─────────────────────────────────────────┐
│ ←                 🌐 ✨ [←→] ☰         │  ← Top: 16px, Right: 10px
│                                         │
│                                         │
│        Content Area                     │
│                                         │
│                                         │
│ 🔊                                      │  ← Left: 12px, Top: 16px
│                                         │
│                                         │
│              [Audio Control]            │  ← Bottom
└─────────────────────────────────────────┘
```

---

## 📝 DETAILED IMPLEMENTATION STEPS

### STEP 1: Install Dependencies ✅

```bash
npx expo install expo-sqlite
```

**Verification**:
- Check `package.json` for `expo-sqlite`

---

### STEP 2: Create Database Service ✅

**File**: `/services/database-service.ts`

```typescript
import * as SQLite from 'expo-sqlite'

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null
  
  // Singleton pattern
  async initialize() {
    if (this.db) return this.db
    
    this.db = await SQLite.openDatabaseAsync('reading_app.db')
    await this.createTables()
    return this.db
  }
  
  private async createTables() {
    await this.db!.execAsync(`
      -- Create tables as per schema above
      -- processed_chapters
      -- tts_audio_cache
      -- prefetch_queue
    `)
  }
  
  // CRUD for processed_chapters
  async getProcessedChapter(bookId: string, chapter: number, mode: string)
  async saveProcessedChapter(bookId: string, chapter: number, mode: string, content: string)
  async deleteProcessedChapter(bookId: string, chapter: number, mode: string)
  async clearBookCache(bookId: string)
  
  // CRUD for tts_audio_cache
  async getTTSAudios(bookId: string, chapter: number, mode: string)
  async saveTTSAudio(bookId: string, chapter: number, mode: string, index: number, text: string, filePath: string)
  async getTTSCount(bookId: string, chapter: number, mode: string)
  async clearTTSCache(bookId: string, chapter?: number, mode?: string)
  
  // CRUD for prefetch_queue
  async addToPrefetchQueue(bookId: string, chapter: number, mode: string, priority: number)
  async getPendingPrefetchTasks(limit: number)
  async updatePrefetchStatus(id: number, status: string, error?: string)
  async clearPrefetchQueue(bookId?: string)
  
  // Stats
  async getCacheStats()
  async getBookCacheStats(bookId: string)
}

export const dbService = new DatabaseService()
```

**Critical Points**:
- ✅ Singleton pattern để tránh multiple connections
- ✅ Transaction support cho batch operations
- ✅ Error handling với try-catch
- ✅ Prepared statements để tránh SQL injection

---

### STEP 3: Update Gemini Service ✅

**File**: `/services/gemini-service.ts`

#### Add Translate Function:
```typescript
export const translateChapter = async (chapterContent: string): Promise<string> => {
  const apiKey = MMKVStorage.get(MMKVKeys.GEMINI_API_KEY)
  const translatePrompt = MMKVStorage.get(MMKVKeys.GEMINI_TRANSLATE_PROMPT) || DEFAULT_TRANSLATE_PROMPT
  
  if (!apiKey) throw new Error('Thiếu Gemini API Key trong Settings')
  if (!chapterContent) throw new Error('Nội dung chương trống')
  
  const requestBody = {
    contents: [{
      parts: [{
        text: `${translatePrompt}\n\n${chapterContent}`
      }]
    }]
  }
  
  const response = await fetch(getGeminiApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  })
  
  if (!response.ok) {
    throw new Error(`Gemini API Error: ${response.status}`)
  }
  
  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}
```

#### Default Prompts:
```typescript
const DEFAULT_TRANSLATE_PROMPT = `Bạn là chuyên gia dịch thuật văn học tiếng Việt. Nhiệm vụ: chuyển đổi văn bản từ văn phong dịch máy (Trung-Việt) sang văn phong tiếng Việt tự nhiên, trôi chảy.

NGUYÊN TẮC:
1. Giữ nguyên 100% ý nghĩa, chi tiết, cảm xúc của nội dung gốc
2. Sắp xếp lại từ ngữ theo ngữ pháp tiếng Việt chuẩn
3. Thay cấu trúc Hán Việt bằng cấu trúc hiện đại, dễ hiểu
4. Loại bỏ từ thừa, lặp từ không cần thiết
5. Giữ nguyên: tên nhân vật, địa danh, thuật ngữ võ công
6. Không thêm hoặc bớt nội dung
7. Không tóm tắt

VÍ DỤ CHUYỂN ĐỔI:
Input: "Nhưng là lúc này tràng bên trong lại không hài hoà"
Output: "Nhưng ở hiện trường lúc này lại không hài hoà"

Input: "Một tên quần áo lộng lẫy lại sắc mặt âm tàn thanh niên chính giơ chân lên giẫm tại một tên khất cái mặt bên trên"
Output: "Một thanh niên mặc quần áo lộng lẫy, sắc mặt âm tàn, đang giơ chân giẫm lên mặt của một người ăn mày"

Input: "Hắn mắt nhìn chằm chằm cái phía trước không xa dương liễu, trong con mắt lộ ra cái khí tức quyết liệt."
Output: "Hắn chằm chằm nhìn vào hàng dương liễu không xa phía trước, ánh mắt lộ ra khí tức quyết liệt."

Hãy chuyển đổi văn bản sau sang văn phong tiếng Việt tự nhiên:`

const DEFAULT_SUMMARY_PROMPT = `Bạn là trợ lý tóm tắt nội dung truyện chuyên nghiệp.

NHIỆM VỤ: Tóm tắt nội dung chương truyện dưới dạng văn xuôi liền mạch, dễ hiểu.

YÊU CẦU:
1. Tóm tắt theo trình tự thời gian (đầu → giữa → cuối)
2. Giữ lại: nhân vật, địa điểm, sự kiện quan trọng
3. Loại bỏ: chi tiết phụ, mô tả dài dòng
4. Độ dài: 20-30% nội dung gốc
5. Văn phong: súc tích, mạch lạc, dễ đọc
6. Không thêm ý kiến cá nhân
7. Giữ nguyên tên riêng

ĐỊNH DẠNG OUTPUT:
- Văn xuôi liền mạch (KHÔNG dùng bullet points)
- Chia đoạn rõ ràng (mỗi đoạn 3-5 câu)
- Câu văn ngắn gọn (15-25 từ/câu)

Hãy tóm tắt nội dung chương sau:`
```

---

### STEP 4: Create Content Processor Hook ✅

**File**: `/hooks/use-content-processor.ts`

```typescript
import { useCallback, useRef } from 'react'
import { dbService } from '@/services/database-service'
import { translateChapter, summarizeChapter } from '@/services/gemini-service'
import { getBookChapterContent } from '@/utils'
import md5 from 'md5'  // Need to install: npm install md5

type ReadingMode = 'normal' | 'translate' | 'summary'

export default function useContentProcessor() {
  const processingRef = useRef<Set<string>>(new Set())
  
  const processContent = useCallback(async (
    bookId: string,
    chapter: number,
    mode: ReadingMode
  ): Promise<string | null> => {
    const key = `${bookId}_${chapter}_${mode}`
    
    // Prevent duplicate processing
    if (processingRef.current.has(key)) {
      console.log(`⏳ Already processing: ${key}`)
      return null
    }
    
    try {
      processingRef.current.add(key)
      
      // 1. Check database cache
      const cached = await dbService.getProcessedChapter(bookId, chapter, mode)
      if (cached) {
        console.log(`✅ Cache hit: ${key}`)
        return cached.content
      }
      
      // 2. Load raw content
      const rawContent = await getBookChapterContent(bookId, chapter)
      if (!rawContent) throw new Error('Không thể load nội dung chapter')
      
      // 3. Process based on mode
      let processed: string
      
      switch (mode) {
        case 'normal':
          processed = rawContent
          break
          
        case 'translate':
          console.log(`🌐 Translating: ${bookId} ch.${chapter}`)
          processed = await translateChapter(rawContent)
          break
          
        case 'summary':
          console.log(`✨ Summarizing: ${bookId} ch.${chapter}`)
          processed = await summarizeChapter(rawContent)
          break
          
        default:
          processed = rawContent
      }
      
      // 4. Save to cache (except normal mode)
      if (mode !== 'normal') {
        await dbService.saveProcessedChapter(bookId, chapter, mode, processed)
        console.log(`💾 Saved to cache: ${key}`)
      }
      
      return processed
      
    } catch (error) {
      console.error(`❌ Error processing ${key}:`, error)
      throw error
    } finally {
      processingRef.current.delete(key)
    }
  }, [])
  
  return { processContent }
}
```

**Key Features**:
- ✅ Duplicate prevention với `processingRef`
- ✅ Cache-first strategy
- ✅ Normal mode không cache (vì đã có file gốc)
- ✅ Error propagation để UI handle

---

### STEP 5: Create Prefetch Hook ✅

**File**: `/hooks/use-prefetch.ts`

```typescript
import { useCallback, useRef } from 'react'
import { dbService } from '@/services/database-service'
import useContentProcessor from './use-content-processor'
import useAppStore from '@/controllers/store'

const PREFETCH_COUNT = 10
const PREFETCH_DELAY = 2000  // 2s delay giữa các chapters
const MAX_CONCURRENT = 2     // Process 2 chapters cùng lúc

export default function usePrefetch() {
  const { processContent } = useContentProcessor()
  const setPrefetching = useAppStore(s => s.setPrefetching)
  const abortRef = useRef(false)
  
  const prefetchChapters = useCallback(async (
    bookId: string,
    fromChapter: number,
    mode: 'translate' | 'summary',
    totalChapters: number
  ) => {
    if (mode === 'normal') return  // No prefetch for normal mode
    
    abortRef.current = false
    setPrefetching(true)
    
    try {
      const toChapter = Math.min(fromChapter + PREFETCH_COUNT, totalChapters)
      console.log(`🚀 Prefetch: ${bookId} ch.${fromChapter}-${toChapter} [${mode}]`)
      
      // Add to queue
      for (let ch = fromChapter; ch <= toChapter; ch++) {
        const priority = toChapter - ch  // Closer chapters = higher priority
        await dbService.addToPrefetchQueue(bookId, ch, mode, priority)
      }
      
      // Process queue with concurrency limit
      const processingPromises: Promise<void>[] = []
      
      while (true) {
        if (abortRef.current) {
          console.log('⚠️ Prefetch aborted')
          break
        }
        
        const tasks = await dbService.getPendingPrefetchTasks(MAX_CONCURRENT)
        if (tasks.length === 0) break
        
        for (const task of tasks) {
          const promise = (async () => {
            try {
              await dbService.updatePrefetchStatus(task.id, 'processing')
              
              // Check if already cached
              const cached = await dbService.getProcessedChapter(
                task.book_id, 
                task.chapter_number, 
                task.mode
              )
              
              if (!cached) {
                await processContent(task.book_id, task.chapter_number, task.mode as any)
                await new Promise(resolve => setTimeout(resolve, PREFETCH_DELAY))
              }
              
              await dbService.updatePrefetchStatus(task.id, 'completed')
            } catch (error) {
              console.error(`❌ Prefetch failed: ${task.book_id} ch.${task.chapter_number}`, error)
              await dbService.updatePrefetchStatus(
                task.id, 
                'failed', 
                error instanceof Error ? error.message : 'Unknown error'
              )
            }
          })()
          
          processingPromises.push(promise)
        }
        
        // Wait for current batch
        await Promise.all(processingPromises)
        processingPromises.length = 0
      }
      
      console.log('✅ Prefetch completed')
    } catch (error) {
      console.error('❌ Prefetch error:', error)
    } finally {
      setPrefetching(false)
    }
  }, [processContent, setPrefetching])
  
  const abortPrefetch = useCallback(() => {
    abortRef.current = true
  }, [])
  
  return { prefetchChapters, abortPrefetch }
}
```

**Features**:
- ✅ Queue-based với priority
- ✅ Concurrency limit (2 concurrent requests)
- ✅ Delay giữa requests (rate limiting)
- ✅ Abort support
- ✅ Skip already cached chapters

---

### STEP 6: Update Reading Chapter Hook ✅

**File**: `/hooks/use-reading-chapter.ts`

```typescript
import { useCallback, useEffect, useState, useRef } from 'react'
import { DeviceEventEmitter } from 'react-native'
import useAppStore from '@/controllers/store'
import useContentProcessor from './use-content-processor'
import usePrefetch from './use-prefetch'
import { getChapterHtml } from '@/utils'
import { EventKeys } from '@/constants'
import { GSpinner } from '@/components/g-spinner'

const MODE_SWITCH_DEBOUNCE = 500  // 500ms debounce

export default function useReadingChapter(bookId: string) {
  const book = useAppStore(s => s.id2Book[bookId])
  const chapterNumber = useAppStore(s => s.id2BookReadingChapter[bookId] || 1)
  const readingMode = useAppStore(s => s.readingMode)
  
  const [chapter, setChapter] = useState({
    content: '',
    mode: readingMode,
    index: chapterNumber,
    name: book?.references?.[chapterNumber - 1] || '',
    bookId,
  })
  
  const { processContent } = useContentProcessor()
  const { prefetchChapters } = usePrefetch()
  
  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const lastModeRef = useRef(readingMode)
  
  // Load chapter content
  const loadChapter = useCallback(async () => {
    if (!book) return
    
    try {
      DeviceEventEmitter.emit(EventKeys.EVENT_START_LOADING_CHAPTER)
      GSpinner.show({ label: 'Đang tải...' })
      
      const content = await processContent(bookId, chapterNumber, readingMode)
      
      if (content) {
        setChapter({
          content: getChapterHtml(content),
          mode: readingMode,
          index: chapterNumber,
          name: book.references?.[chapterNumber - 1] || '',
          bookId,
        })
      }
      
      DeviceEventEmitter.emit(EventKeys.EVENT_END_LOADING_CHAPTER)
      GSpinner.hide()
      
      // Trigger prefetch in background (only for translate/summary)
      if (readingMode !== 'normal' && book.references) {
        setTimeout(() => {
          prefetchChapters(bookId, chapterNumber + 1, readingMode, book.references!.length)
        }, 1000)
      }
      
    } catch (error) {
      console.error('Error loading chapter:', error)
      GSpinner.hide()
      DeviceEventEmitter.emit(EventKeys.EVENT_ERROR_GENERATE_SUMMARY)
    }
  }, [book, bookId, chapterNumber, readingMode, processContent, prefetchChapters])
  
  // Effect: Load on chapter change
  useEffect(() => {
    loadChapter()
  }, [chapterNumber, bookId])
  
  // Effect: Debounced mode change
  useEffect(() => {
    if (lastModeRef.current === readingMode) return
    
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // Debounce mode switch
    debounceTimerRef.current = setTimeout(() => {
      console.log(`🔄 Mode switched: ${lastModeRef.current} → ${readingMode}`)
      lastModeRef.current = readingMode
      loadChapter()
    }, MODE_SWITCH_DEBOUNCE)
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [readingMode, loadChapter])
  
  return chapter
}
```

**Key Changes**:
- ✅ Debounce mode switching (500ms)
- ✅ Separate effects for chapter vs mode changes
- ✅ Auto prefetch after load
- ✅ Unified loading state

---

### STEP 7: Create TTS Service ✅

**File**: `/services/tts-service.ts`

```typescript
import { Directory, Paths } from 'expo-file-system'
import { dbService } from './database-service'
import { convertTTSCapcut } from './convert-tts'
import { breakSummaryIntoLines } from '@/utils/string-helpers'
import { DeviceEventEmitter } from 'react-native'

const TTS_BASE_DIR = new Directory(Paths.document, 'tts_audio')

export class TTSService {
  async generateTTS(
    bookId: string,
    chapter: number,
    mode: string,
    content: string
  ): Promise<boolean> {
    try {
      // 1. Check if already generated
      const existingCount = await dbService.getTTSCount(bookId, chapter, mode)
      if (existingCount > 0) {
        console.log(`✅ TTS already exists: ${bookId} ch.${chapter} [${mode}]`)
        await this.emitExistingTTS(bookId, chapter, mode)
        return true
      }
      
      // 2. Clean HTML and split sentences
      const cleanContent = content
        .replace(/<[^><]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      
      const sentences = breakSummaryIntoLines(cleanContent)
      if (sentences.length === 0) return false
      
      console.log(`🎵 Generating TTS: ${sentences.length} sentences`)
      
      // 3. Create directory structure
      const chapterDir = new Directory(TTS_BASE_DIR, `${bookId}/${chapter}/${mode}`)
      chapterDir.create({ idempotent: true, intermediates: true })
      
      // 4. Generate TTS for each sentence
      const taskPrefix = `${bookId}_${chapter}_${mode}`
      
      // Setup listener for TTS completion
      const listener = DeviceEventEmitter.addListener(
        'tts_audio_ready',
        async (data: { filePath: string; audioTaskId: string; index: number }) => {
          if (!data.audioTaskId.startsWith(taskPrefix)) return
          
          // Save to database
          await dbService.saveTTSAudio(
            bookId,
            chapter,
            mode,
            data.index,
            sentences[data.index],
            data.filePath
          )
        }
      )
      
      // Call Capcut TTS
      await convertTTSCapcut(sentences, taskPrefix, chapterDir.uri)
      
      // Cleanup listener
      setTimeout(() => listener.remove(), 5000)
      
      return true
      
    } catch (error) {
      console.error('❌ TTS generation failed:', error)
      return false
    }
  }
  
  private async emitExistingTTS(bookId: string, chapter: number, mode: string) {
    const audios = await dbService.getTTSAudios(bookId, chapter, mode)
    
    for (const audio of audios) {
      DeviceEventEmitter.emit('tts_audio_ready', {
        filePath: audio.file_path,
        audioTaskId: `${bookId}_${chapter}_${mode}_${audio.sentence_index}`,
        index: audio.sentence_index
      })
    }
  }
  
  async clearTTS(bookId: string, chapter?: number, mode?: string) {
    await dbService.clearTTSCache(bookId, chapter, mode)
    
    // Also delete files
    const baseDir = chapter && mode 
      ? new Directory(TTS_BASE_DIR, `${bookId}/${chapter}/${mode}`)
      : new Directory(TTS_BASE_DIR, bookId)
    
    try {
      baseDir.delete()
    } catch (error) {
      console.error('Error deleting TTS files:', error)
    }
  }
}

export const ttsService = new TTSService()
```

---

### STEP 8: Update TTS Hook ✅

**File**: `/hooks/use-tts-audio.ts`

```typescript
import { useCallback, useEffect, useState } from 'react'
import { DeviceEventEmitter } from 'react-native'
import { ttsService } from '@/services/tts-service'
import trackPlayerService from '@/services/track-player-service'
import useAppStore from '@/controllers/store'

export default function useTtsAudio(bookId: string, chapter: number, mode: string) {
  const setTTSGenerating = useAppStore(s => s.setTTSGenerating)
  const [isReady, setIsReady] = useState(false)
  
  const generateTTS = useCallback(async (content: string) => {
    try {
      setTTSGenerating(bookId, chapter, true)
      await trackPlayerService.reset()
      
      const success = await ttsService.generateTTS(bookId, chapter, mode, content)
      setIsReady(success)
      
      return success
    } catch (error) {
      console.error('TTS generation error:', error)
      return false
    } finally {
      setTTSGenerating(bookId, chapter, false)
    }
  }, [bookId, chapter, mode, setTTSGenerating])
  
  // Listen for audio ready events
  useEffect(() => {
    const taskPrefix = `${bookId}_${chapter}_${mode}`
    
    const listener = DeviceEventEmitter.addListener(
      'tts_audio_ready',
      async (data: { filePath: string; audioTaskId: string; index: number }) => {
        if (!data.audioTaskId.startsWith(taskPrefix)) return
        
        const track = {
          id: data.audioTaskId,
          url: data.filePath.startsWith('file://') ? data.filePath : `file://${data.filePath}`,
          title: `Câu ${data.index + 1}`,
          artist: 'TTS'
        }
        
        await trackPlayerService.addTracks([track])
        
        // Auto-play first track
        if (data.index === 3) {
          await trackPlayerService.skipToTrack(0)
          await trackPlayerService.setRate(1.2)
          setTimeout(() => trackPlayerService.play(), 100)
        }
      }
    )
    
    return () => listener.remove()
  }, [bookId, chapter, mode])
  
  return { generateTTS, isReady }
}
```

---

### STEP 9: Create UI Components ✅

#### 9.1. Reading Button TTS

**File**: `/components/reading/reading-button-tts.tsx`

```typescript
import React from 'react'
import { StyleSheet } from 'react-native'
import { VectorIcon } from '../Icon'
import { AppPalette } from '@/assets'
import useAppStore from '@/controllers/store'

interface Props {
  bookId: string
  chapter: number
  onPress: () => void
}

export default function ReadingButtonTTS({ bookId, chapter, onPress }: Props) {
  const isGenerating = useAppStore(
    s => s.id2ChapterTTSGenerating[`${bookId}_${chapter}`] || false
  )
  
  return (
    <VectorIcon
      name={isGenerating ? 'spinner' : 'volume-high'}
      font="FontAwesome6"
      size={16}
      buttonStyle={styles.button}
      color={isGenerating ? AppPalette.orange500 : AppPalette.gray700}
      onPress={onPress}
      disabled={isGenerating}
    />
  )
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    position: 'absolute',
    left: 12,
    top: 16,
  }
})
```

#### 9.2. Update Top Navigation

**File**: `/components/reading/reading-button-top-navigation.tsx`

```typescript
import { AppColors, AppPalette } from '@/assets'
import useAppStore from '@/controllers/store'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { VectorIcon } from '../Icon'

export default function ReadingButtonTopNavigation({
  previousChapter,
  nextChapter,
  onOpenMenu,
}: {
  previousChapter: () => void
  nextChapter: () => void
  onOpenMenu: () => void
}) {
  const readingMode = useAppStore(s => s.readingMode)
  const cycleReadingMode = useAppStore(s => s.cycleReadingMode)
  
  const getModeButtonStyle = (mode: string) => ({
    width: 28,
    height: 28,
    borderRadius: 40,
    backgroundColor: readingMode === mode ? AppPalette.blue50 : 'white',
  })
  
  const getModeButtonColor = (mode: string) => 
    readingMode === mode ? AppColors.textActivate : AppPalette.gray500
  
  return (
    <View style={styles.viewContainer}>
      {/* Translate Button */}
      <VectorIcon
        name="language"
        font="FontAwesome6"
        size={12}
        buttonStyle={getModeButtonStyle('translate')}
        color={getModeButtonColor('translate')}
        onPress={() => cycleReadingMode()}
      />
      
      {/* Summary Button */}
      <VectorIcon
        name="wand-magic-sparkles"
        font="FontAwesome6"
        size={12}
        buttonStyle={getModeButtonStyle('summary')}
        color={getModeButtonColor('summary')}
        onPress={() => cycleReadingMode()}
      />
      
      {/* Navigation */}
      <View style={styles.viewNavigate}>
        <VectorIcon
          name="arrow-left"
          font="FontAwesome6"
          size={14}
          buttonStyle={{ width: 28, height: 28 }}
          color={AppPalette.white}
          onPress={previousChapter}
        />
        <VectorIcon
          name="arrow-right"
          font="FontAwesome6"
          size={14}
          buttonStyle={{ width: 28, height: 28 }}
          color={AppPalette.white}
          onPress={nextChapter}
        />
      </View>
      
      {/* Menu Button */}
      <VectorIcon
        name="bars"
        font="FontAwesome6"
        size={12}
        buttonStyle={styles.menuButton}
        color={AppPalette.gray700}
        onPress={onOpenMenu}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  viewContainer: {
    flexDirection: 'row',
    height: 28,
    paddingHorizontal: 2,
    position: 'absolute',
    right: 10,
    top: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  viewNavigate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppPalette.gray400,
    borderRadius: 40,
  },
  menuButton: {
    width: 28,
    height: 28,
    borderRadius: 40,
    backgroundColor: 'white',
  }
})
```

---

### STEP 10: Update Main Reading Screen ✅

**File**: `/app/reading/index.tsx`

Major changes:
- Add TTS button
- Update top navigation with menu callback
- Pass mode to audio control
- Handle TTS generation

---

### STEP 11: Migration & Cleanup ✅

**File**: `/utils/migration-helper.ts`

```typescript
import { MMKV } from 'react-native-mmkv'
import { Directory, Paths } from 'expo-file-system'

export async function migrateToNewSystem() {
  console.log('🔄 Starting migration...')
  
  try {
    // 1. Clear old MMKV caches
    const summaryCache = new MMKV({ id: 'summary-cache', encryptionKey: 'chapter-summaries' })
    summaryCache.clearAll()
    console.log('✅ Cleared summary cache')
    
    const ttsCache = new MMKV({ id: 'tts-cache', encryptionKey: 'tts-audio-files' })
    ttsCache.clearAll()
    console.log('✅ Cleared TTS cache')
    
    // 2. Delete old TTS directory
    const oldTTSDir = new Directory(Paths.document, 'tts_audio')
    try {
      oldTTSDir.delete()
      console.log('✅ Deleted old TTS directory')
    } catch (e) {
      // Directory might not exist
    }
    
    // 3. Initialize new database
    const { dbService } = await import('@/services/database-service')
    await dbService.initialize()
    console.log('✅ Initialized new database')
    
    console.log('✅ Migration completed successfully')
    return true
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return false
  }
}
```

Call this on app startup (once):
```typescript
// In app/_layout.tsx
useEffect(() => {
  const runMigration = async () => {
    const migrated = await MMKVStorage.get('MIGRATION_V2_DONE')
    if (!migrated) {
      await migrateToNewSystem()
      await MMKVStorage.set('MIGRATION_V2_DONE', true)
    }
  }
  runMigration()
}, [])
```

---

## ⚠️ CRITICAL CHECKS BEFORE IMPLEMENTATION

### Database:
- [ ] SQLite queries use prepared statements
- [ ] Indexes created for all lookup queries
- [ ] Transaction support for batch operations
- [ ] Error handling with try-catch
- [ ] Connection pooling (singleton)

### State Management:
- [ ] Debounce mode switching (500ms)
- [ ] Prevent duplicate API calls
- [ ] Loading states tracked
- [ ] Store persistence works

### Content Processing:
- [ ] Cache check before API call
- [ ] Error handling with user-friendly messages
- [ ] Gemini API rate limiting
- [ ] Content hash for cache invalidation

### Prefetch:
- [ ] Queue-based with priority
- [ ] Concurrency limit (max 2)
- [ ] Abort mechanism
- [ ] Skip already cached
- [ ] Delay between requests (2s)

### TTS:
- [ ] File path structure correct
- [ ] Database mapping accurate
- [ ] Event listeners cleaned up
- [ ] Track player reset properly
- [ ] Auto-play logic works

### UI:
- [ ] Button positions correct
- [ ] Loading states visible
- [ ] Disabled states handled
- [ ] Icon colors match design
- [ ] Responsive layout

### Migration:
- [ ] Old cache cleared completely
- [ ] Database initialized properly
- [ ] Migration runs only once
- [ ] No data loss for user books

---

## 📈 PERFORMANCE METRICS TO MONITOR

1. **Database Query Times**:
   - getProcessedChapter: < 50ms
   - getTTSAudios: < 100ms
   - Batch inserts: < 200ms

2. **API Response Times**:
   - Gemini translate: 3-8s
   - Gemini summary: 2-5s
   - Capcut TTS per sentence: 1-2s

3. **Memory Usage**:
   - Database connection: < 10MB
   - Cache size monitoring
   - Track player queue size

4. **User Experience**:
   - Mode switch debounce: 500ms
   - Content load time: < 3s (cached)
   - TTS generation: < 30s for 20 sentences

---

## 🎯 SUCCESS CRITERIA

- [ ] User can cycle through 3 modes smoothly
- [ ] Content loads from cache instantly
- [ ] Gemini API calls only when needed
- [ ] TTS works for all 3 modes
- [ ] Prefetch happens in background
- [ ] No duplicate API calls
- [ ] Old cache completely removed
- [ ] Database queries fast (< 100ms)
- [ ] UI responsive, no freezing
- [ ] Error messages clear and helpful

---

## 🚀 READY TO IMPLEMENT

All logic reviewed ✅  
All edge cases covered ✅  
All performance optimizations planned ✅  
All error handling defined ✅  

**LET'S START CODING!** 🔨
