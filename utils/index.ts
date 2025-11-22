/**
 * Utils - Re-exports
 * Tập trung exports từ các helper files
 */

// File System Helpers
export {
  showToastError,
  isFileAsync,
  getFolderDownloadBooks,
  getFolderBooks,
  createFolderBooks,
  getPathSaveZipBook,
  getPathSaveBook,
  readCacheDirectory,
  formatBytes,
} from './file-system.helpers'

// Book Helpers
export {
  readFolderBooks,
  getBook,
  deleteBook,
  getBookChapterContent,
  getChapterHtml,
  getListFonts,
} from './book.helpers'

// String Helpers
export {
  preprocessSentence,
  splitContentToParagraph,
  breakSummaryIntoLines,
  formatContentForTTS,
} from './string.helpers'

// Content Cache Helpers
export {
  clearBookCache,
  clearChapterCache,
  getBookCacheStats,
  clearAllCache,
} from './content-cache.helpers'
