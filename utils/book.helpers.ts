import { Directory, File, Paths } from 'expo-file-system'

import { GToast } from '@/components/g-toast'
import { logger } from '@/utils/logger'

/**
 * Book Helpers
 * Helpers để thao tác với books (read, delete, get content)
 */

/**
 * Đọc tất cả books từ thư mục
 */
export const readFolderBooks = async (): Promise<Book[]> => {
  const directory = new Directory(Paths.document, 'books')
  if (!directory.exists) {
    return []
  }

  let entries: (Directory | File)[] = []
  try {
    entries = directory.list()
  } catch (error) {
    logger.error('BookHelpers', 'Error reading books folder', error)
    return []
  }

  const listPathBooks = entries
    .filter((entry): entry is Directory => entry instanceof Directory)
    .map((entry) => entry.uri)

  const books: Book[] = []

  for (const path of listPathBooks) {
    try {
      const book = await getBook(path)
      if (book !== null) {
        books.push(book)
      } else {
        const errorDir = new Directory(path)
        errorDir.delete()
        logger.warn('BookHelpers', 'Deleted invalid book directory', path)
      }
    } catch (error) {
      logger.error('BookHelpers', 'Error reading book', path, error)
    }
  }

  return books
}

/**
 * Đọc thông tin một book từ đường dẫn
 */
export const getBook = async (bookPath: string): Promise<Book | null> => {
  const bookDirectory = new Directory(bookPath)

  if (!bookDirectory.exists) {
    return null
  }

  let entries: (Directory | File)[] = []
  try {
    entries = bookDirectory.list()
  } catch (error) {
    logger.error('BookHelpers', 'Error listing book directory', error)
    return null
  }

  const bookJson = entries.find(
    (entry): entry is File =>
      entry instanceof File && entry.name === 'book.json',
  )

  if (!bookJson) {
    logger.error('BookHelpers', 'book.json not found', bookPath)
    return null
  }

  try {
    const infoString = await bookJson.text()
    const info: Book = JSON.parse(infoString)
    return info
  } catch (error) {
    logger.error('BookHelpers', 'Error parsing book.json', error)
    return null
  }
}

/**
 * Xóa một book
 */
export const deleteBook = async (bookPath: string): Promise<void> => {
  logger.info('BookHelpers', 'Deleting book', bookPath)
  try {
    new Directory(bookPath).delete()
    GToast.success({ message: 'Xoá thành công!' })
  } catch (error) {
    logger.error('BookHelpers', 'Error deleting book', error)
    GToast.error({ message: 'Không thể xóa sách' })
    throw error
  }
}

/**
 * Lấy nội dung HTML của một chapter
 */
export const getBookChapterContent = async (
  bookId: string,
  chapter: number,
): Promise<string> => {
  try {
    const chapterFile = new File(
      new Directory(Paths.document, 'books'),
      `${bookId}/chapters/chapter-${chapter}.html`,
    )
    return await chapterFile.text()
  } catch (error) {
    logger.error(
      'BookHelpers',
      `Error reading chapter ${chapter} of book ${bookId}`,
      error,
    )
    throw error
  }
}

/**
 * Wrap HTML content vào template
 */
export const getChapterHtml = (html: string): string => {
  return `
    <html lang="en">
      <body>
        ${html.replace(/(<br>){3,}/gi, '<br><br>')}
      </body>
    </html>
  `
}

/**
 * Lấy danh sách fonts có sẵn
 */
export const getListFonts = (): string[] => {
  return [
    'Arial',
    'Georgia',
    'Inter',
    'Lato',
    'Lora',
    'Merriweather',
    'Montserrat',
    'MontserratAlternates',
    'NotoSans',
    'NotoSerif',
    'OpenSans',
    'PTSans',
    'PTSerif',
    'Raleway',
    'Roboto',
    'SpaceMono',
    'TimesNewRoman',
    'Verdana',
    'WorkSans',
  ]
}
