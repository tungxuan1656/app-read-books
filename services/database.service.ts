import * as SQLite from 'expo-sqlite'

type ReadingMode = 'normal' | 'translate' | 'summary'
type PrefetchStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface ProcessedChapter {
  id: number
  book_id: string
  chapter_number: number
  mode: string
  content: string
  content_hash: string
  created_at: number
  updated_at: number
}

interface TTSAudio {
  id: number
  book_id: string
  chapter_number: number
  mode: string
  sentence_index: number
  sentence_text: string
  file_path: string
  file_size?: number
  duration?: number
  created_at: number
}

interface PrefetchTask {
  id: number
  book_id: string
  chapter_number: number
  mode: string
  status: PrefetchStatus
  priority: number
  error_message?: string
  created_at: number
  updated_at: number
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null
  private initialized = false

  async initialize(): Promise<SQLite.SQLiteDatabase> {
    if (this.db && this.initialized) {
      return this.db
    }

    try {
      console.log('📦 Initializing database...')
      this.db = await SQLite.openDatabaseAsync('reading_app.db')
      await this.createTables()
      this.initialized = true
      console.log('✅ Database initialized successfully')
      return this.db
    } catch (error) {
      console.error('❌ Database initialization failed:', error)
      throw error
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.execAsync(`
      -- Table: processed_chapters
      CREATE TABLE IF NOT EXISTS processed_chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id TEXT NOT NULL,
        chapter_number INTEGER NOT NULL,
        mode TEXT NOT NULL CHECK(mode IN ('normal', 'translate', 'summary')),
        content TEXT NOT NULL,
        content_hash TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(book_id, chapter_number, mode)
      );

      CREATE INDEX IF NOT EXISTS idx_chapters_lookup 
        ON processed_chapters(book_id, chapter_number, mode);
      
      CREATE INDEX IF NOT EXISTS idx_chapters_book 
        ON processed_chapters(book_id);

      -- Table: tts_audio_cache
      CREATE TABLE IF NOT EXISTS tts_audio_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id TEXT NOT NULL,
        chapter_number INTEGER NOT NULL,
        mode TEXT NOT NULL CHECK(mode IN ('normal', 'translate', 'summary')),
        sentence_index INTEGER NOT NULL,
        sentence_text TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        duration REAL,
        created_at INTEGER NOT NULL,
        UNIQUE(book_id, chapter_number, mode, sentence_index)
      );

      CREATE INDEX IF NOT EXISTS idx_tts_lookup 
        ON tts_audio_cache(book_id, chapter_number, mode);
      
      CREATE INDEX IF NOT EXISTS idx_tts_sentence 
        ON tts_audio_cache(book_id, chapter_number, mode, sentence_index);

      -- Table: prefetch_queue
      CREATE TABLE IF NOT EXISTS prefetch_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id TEXT NOT NULL,
        chapter_number INTEGER NOT NULL,
        mode TEXT NOT NULL CHECK(mode IN ('translate', 'summary')),
        status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
        priority INTEGER DEFAULT 0,
        error_message TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(book_id, chapter_number, mode)
      );

      CREATE INDEX IF NOT EXISTS idx_prefetch_status 
        ON prefetch_queue(status, priority DESC);
      
      CREATE INDEX IF NOT EXISTS idx_prefetch_book 
        ON prefetch_queue(book_id, chapter_number);
    `)
  }

  // ==================== Processed Chapters ====================

  async getProcessedChapter(
    bookId: string,
    chapter: number,
    mode: ReadingMode
  ): Promise<ProcessedChapter | null> {
    if (!this.db) await this.initialize()

    try {
      const result = await this.db!.getFirstAsync<ProcessedChapter>(
        'SELECT * FROM processed_chapters WHERE book_id = ? AND chapter_number = ? AND mode = ?',
        [bookId, chapter, mode]
      )
      return result || null
    } catch (error) {
      console.error('Error getting processed chapter:', error)
      return null
    }
  }

  async saveProcessedChapter(
    bookId: string,
    chapter: number,
    mode: ReadingMode,
    content: string,
    contentHash?: string
  ): Promise<void> {
    if (!this.db) await this.initialize()

    const now = Date.now()

    try {
      await this.db!.runAsync(
        `INSERT INTO processed_chapters (book_id, chapter_number, mode, content, content_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(book_id, chapter_number, mode) 
         DO UPDATE SET content = ?, content_hash = ?, updated_at = ?`,
        [bookId, chapter, mode, content, contentHash || '', now, now, content, contentHash || '', now]
      )
    } catch (error) {
      console.error('Error saving processed chapter:', error)
      throw error
    }
  }

  async deleteProcessedChapter(bookId: string, chapter: number, mode?: ReadingMode): Promise<void> {
    if (!this.db) await this.initialize()

    try {
      if (mode) {
        await this.db!.runAsync(
          'DELETE FROM processed_chapters WHERE book_id = ? AND chapter_number = ? AND mode = ?',
          [bookId, chapter, mode]
        )
      } else {
        await this.db!.runAsync(
          'DELETE FROM processed_chapters WHERE book_id = ? AND chapter_number = ?',
          [bookId, chapter]
        )
      }
    } catch (error) {
      console.error('Error deleting processed chapter:', error)
      throw error
    }
  }

  async getProcessedChaptersForBook(bookId: string): Promise<ProcessedChapter[]> {
    if (!this.db) await this.initialize()

    try {
      const results = await this.db!.getAllAsync<ProcessedChapter>(
        'SELECT * FROM processed_chapters WHERE book_id = ? ORDER BY chapter_number ASC',
        [bookId]
      )
      return results
    } catch (error) {
      console.error('Error getting processed chapters for book:', error)
      return []
    }
  }

  async clearBookCache(bookId: string, mode?: ReadingMode): Promise<void> {
    if (!this.db) await this.initialize()

    try {
      if (mode) {
        await this.db!.runAsync(
          'DELETE FROM processed_chapters WHERE book_id = ? AND mode = ?',
          [bookId, mode]
        )
      } else {
        await this.db!.runAsync('DELETE FROM processed_chapters WHERE book_id = ?', [bookId])
      }
    } catch (error) {
      console.error('Error clearing book cache:', error)
      throw error
    }
  }

  // ==================== TTS Audio Cache ====================

  async getTTSAudios(bookId: string, chapter: number, mode: ReadingMode): Promise<TTSAudio[]> {
    if (!this.db) await this.initialize()

    try {
      const results = await this.db!.getAllAsync<TTSAudio>(
        `SELECT * FROM tts_audio_cache 
         WHERE book_id = ? AND chapter_number = ? AND mode = ?
         ORDER BY sentence_index ASC`,
        [bookId, chapter, mode]
      )
      return results
    } catch (error) {
      console.error('Error getting TTS audios:', error)
      return []
    }
  }

  async saveTTSAudio(
    bookId: string,
    chapter: number,
    mode: ReadingMode,
    sentenceIndex: number,
    sentenceText: string,
    filePath: string,
    fileSize?: number
  ): Promise<void> {
    if (!this.db) await this.initialize()

    const now = Date.now()

    try {
      await this.db!.runAsync(
        `INSERT INTO tts_audio_cache 
         (book_id, chapter_number, mode, sentence_index, sentence_text, file_path, file_size, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(book_id, chapter_number, mode, sentence_index)
         DO UPDATE SET file_path = ?, file_size = ?`,
        [
          bookId,
          chapter,
          mode,
          sentenceIndex,
          sentenceText,
          filePath,
          fileSize || 0,
          now,
          filePath,
          fileSize || 0,
        ]
      )
    } catch (error) {
      console.error('Error saving TTS audio:', error)
      throw error
    }
  }

  async getTTSCount(bookId: string, chapter: number, mode: ReadingMode): Promise<number> {
    if (!this.db) await this.initialize()

    try {
      const result = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM tts_audio_cache WHERE book_id = ? AND chapter_number = ? AND mode = ?',
        [bookId, chapter, mode]
      )
      return result?.count || 0
    } catch (error) {
      console.error('Error getting TTS count:', error)
      return 0
    }
  }

  async clearTTSCache(bookId: string, chapter?: number, mode?: ReadingMode): Promise<void> {
    if (!this.db) await this.initialize()

    try {
      if (chapter && mode) {
        await this.db!.runAsync(
          'DELETE FROM tts_audio_cache WHERE book_id = ? AND chapter_number = ? AND mode = ?',
          [bookId, chapter, mode]
        )
      } else if (chapter) {
        await this.db!.runAsync(
          'DELETE FROM tts_audio_cache WHERE book_id = ? AND chapter_number = ?',
          [bookId, chapter]
        )
      } else if (mode) {
        await this.db!.runAsync('DELETE FROM tts_audio_cache WHERE book_id = ? AND mode = ?', [
          bookId,
          mode,
        ])
      } else {
        await this.db!.runAsync('DELETE FROM tts_audio_cache WHERE book_id = ?', [bookId])
      }
    } catch (error) {
      console.error('Error clearing TTS cache:', error)
      throw error
    }
  }

  // ==================== Prefetch Queue ====================

  async addToPrefetchQueue(
    bookId: string,
    chapter: number,
    mode: 'translate' | 'summary',
    priority: number = 0
  ): Promise<void> {
    if (!this.db) await this.initialize()

    const now = Date.now()

    try {
      await this.db!.runAsync(
        `INSERT INTO prefetch_queue (book_id, chapter_number, mode, status, priority, created_at, updated_at)
         VALUES (?, ?, ?, 'pending', ?, ?, ?)
         ON CONFLICT(book_id, chapter_number, mode)
         DO UPDATE SET status = 'pending', priority = ?, updated_at = ?`,
        [bookId, chapter, mode, priority, now, now, priority, now]
      )
    } catch (error) {
      console.error('Error adding to prefetch queue:', error)
      throw error
    }
  }

  async getPendingPrefetchTasks(limit: number = 10): Promise<PrefetchTask[]> {
    if (!this.db) await this.initialize()

    try {
      const results = await this.db!.getAllAsync<PrefetchTask>(
        `SELECT * FROM prefetch_queue 
         WHERE status = 'pending'
         ORDER BY priority DESC, created_at ASC
         LIMIT ?`,
        [limit]
      )
      return results
    } catch (error) {
      console.error('Error getting pending prefetch tasks:', error)
      return []
    }
  }

  async updatePrefetchStatus(
    id: number,
    status: PrefetchStatus,
    errorMessage?: string
  ): Promise<void> {
    if (!this.db) await this.initialize()

    const now = Date.now()

    try {
      if (errorMessage) {
        await this.db!.runAsync(
          'UPDATE prefetch_queue SET status = ?, error_message = ?, updated_at = ? WHERE id = ?',
          [status, errorMessage, now, id]
        )
      } else {
        await this.db!.runAsync(
          'UPDATE prefetch_queue SET status = ?, updated_at = ? WHERE id = ?',
          [status, now, id]
        )
      }
    } catch (error) {
      console.error('Error updating prefetch status:', error)
      throw error
    }
  }

  async clearPrefetchQueue(bookId?: string): Promise<void> {
    if (!this.db) await this.initialize()

    try {
      if (bookId) {
        await this.db!.runAsync('DELETE FROM prefetch_queue WHERE book_id = ?', [bookId])
      } else {
        await this.db!.runAsync('DELETE FROM prefetch_queue')
      }
    } catch (error) {
      console.error('Error clearing prefetch queue:', error)
      throw error
    }
  }

  // ==================== Stats ====================

  async getCacheStats(): Promise<{
    totalChapters: number
    totalTTS: number
    totalPrefetchPending: number
  }> {
    if (!this.db) await this.initialize()

    try {
      const chapters = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM processed_chapters'
      )
      const tts = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM tts_audio_cache'
      )
      const prefetch = await this.db!.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM prefetch_queue WHERE status = 'pending'"
      )

      return {
        totalChapters: chapters?.count || 0,
        totalTTS: tts?.count || 0,
        totalPrefetchPending: prefetch?.count || 0,
      }
    } catch (error) {
      console.error('Error getting cache stats:', error)
      return { totalChapters: 0, totalTTS: 0, totalPrefetchPending: 0 }
    }
  }

  async getBookCacheStats(bookId: string): Promise<{
    chapters: { [mode: string]: number }
    ttsAudios: { [mode: string]: number }
  }> {
    if (!this.db) await this.initialize()

    try {
      const chapters = await this.db!.getAllAsync<{ mode: string; count: number }>(
        'SELECT mode, COUNT(*) as count FROM processed_chapters WHERE book_id = ? GROUP BY mode',
        [bookId]
      )
      const tts = await this.db!.getAllAsync<{ mode: string; count: number }>(
        'SELECT mode, COUNT(*) as count FROM tts_audio_cache WHERE book_id = ? GROUP BY mode',
        [bookId]
      )

      const chapterStats: { [mode: string]: number } = {}
      chapters.forEach((item) => {
        chapterStats[item.mode] = item.count
      })

      const ttsStats: { [mode: string]: number } = {}
      tts.forEach((item) => {
        ttsStats[item.mode] = item.count
      })

      return {
        chapters: chapterStats,
        ttsAudios: ttsStats,
      }
    } catch (error) {
      console.error('Error getting book cache stats:', error)
      return { chapters: {}, ttsAudios: {} }
    }
  }

  async clearAllCache(): Promise<void> {
    if (!this.db) await this.initialize()

    try {
      await this.db!.runAsync('DELETE FROM processed_chapters')
      await this.db!.runAsync('DELETE FROM tts_audio_cache')
      await this.db!.runAsync('DELETE FROM prefetch_queue')
      console.log('✅ All database cache cleared')
    } catch (error) {
      console.error('Error clearing all cache:', error)
      throw error
    }
  }
}

export const dbService = new DatabaseService()
