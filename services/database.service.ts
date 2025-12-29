import * as SQLite from 'expo-sqlite'

type ReadingMode = string

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
        mode TEXT NOT NULL,
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
    `)
  }

  // ==================== Processed Chapters ====================

  async getProcessedChapter(
    bookId: string,
    chapter: number,
    mode: string,
  ): Promise<ProcessedChapter | null> {
    if (!this.db) await this.initialize()

    try {
      const result = await this.db!.getFirstAsync<ProcessedChapter>(
        'SELECT * FROM processed_chapters WHERE book_id = ? AND chapter_number = ? AND mode = ?',
        [bookId, chapter, mode],
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
    mode: string,
    content: string,
    contentHash?: string,
  ): Promise<void> {
    if (!this.db) await this.initialize()

    const now = Date.now()

    try {
      await this.db!.runAsync(
        `INSERT INTO processed_chapters (book_id, chapter_number, mode, content, content_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(book_id, chapter_number, mode) 
         DO UPDATE SET content = ?, content_hash = ?, updated_at = ?`,
        [
          bookId,
          chapter,
          mode,
          content,
          contentHash || '',
          now,
          now,
          content,
          contentHash || '',
          now,
        ],
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
          [bookId, chapter, mode],
        )
      } else {
        await this.db!.runAsync(
          'DELETE FROM processed_chapters WHERE book_id = ? AND chapter_number = ?',
          [bookId, chapter],
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
        [bookId],
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
        await this.db!.runAsync('DELETE FROM processed_chapters WHERE book_id = ? AND mode = ?', [
          bookId,
          mode,
        ])
      } else {
        await this.db!.runAsync('DELETE FROM processed_chapters WHERE book_id = ?', [bookId])
      }
    } catch (error) {
      console.error('Error clearing book cache:', error)
      throw error
    }
  }

  // ==================== Stats ====================

  async getCacheStats(): Promise<{
    totalChapters: number
  }> {
    if (!this.db) await this.initialize()

    try {
      const chapters = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM processed_chapters',
      )

      return {
        totalChapters: chapters?.count || 0,
      }
    } catch (error) {
      console.error('Error getting cache stats:', error)
      return { totalChapters: 0 }
    }
  }

  async getBookCacheStats(bookId: string): Promise<{
    chapters: { [mode: string]: number }
  }> {
    if (!this.db) await this.initialize()

    try {
      const chapters = await this.db!.getAllAsync<{ mode: string; count: number }>(
        'SELECT mode, COUNT(*) as count FROM processed_chapters WHERE book_id = ? GROUP BY mode',
        [bookId],
      )

      const chapterStats: { [mode: string]: number } = {}
      chapters.forEach((item) => {
        chapterStats[item.mode] = item.count
      })

      return {
        chapters: chapterStats,
      }
    } catch (error) {
      console.error('Error getting book cache stats:', error)
      return { chapters: {} }
    }
  }

  async clearAllCache(): Promise<void> {
    if (!this.db) await this.initialize()

    try {
      await this.db!.runAsync('DELETE FROM processed_chapters')
      console.log('✅ All database cache cleared')
    } catch (error) {
      console.error('Error clearing all cache:', error)
      throw error
    }
  }
}

export const dbService = new DatabaseService()
