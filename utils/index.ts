/**
 * Utils - Re-exports
 * Tập trung exports từ các helper files
 */

// File System Helpers
export {
  createFolderBooks,
  formatBytes,
  getFolderBooks,
  getFolderDownloadBooks,
  getPathSaveBook,
  getPathSaveZipBook,
  isFileAsync,
  readCacheDirectory,
  showToastError,
} from './file-system.helpers'

// Book Helpers
export {
  deleteBook,
  getBook,
  getBookChapterContent,
  getChapterHtml,
  getListFonts,
  readFolderBooks,
} from './book.helpers'

// String Helpers
export {
  formatContentForTTS,
  preprocessSentence,
  splitContentToParagraph,
} from './string.helpers'

// Content Cache Helpers
export { cn } from './cn'
export {
  clearAllCache,
  clearBookCache,
  clearChapterCache,
} from './content-cache.helpers'
