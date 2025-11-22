import { Directory, File, Paths } from 'expo-file-system'
import { GToast } from '@/components/g-toast'

/**
 * File System Helpers
 * Helpers để thao tác với file system (folders, files)
 */

/**
 * Hiển thị toast error
 */
export const showToastError = (error: any): void => {
  const message = typeof error === 'string' ? error : JSON.stringify(error)
  GToast.error({ message })
  console.error(message)
}

/**
 * Kiểm tra xem path có phải là file không
 */
export async function isFileAsync(uri: string): Promise<boolean> {
  const info = Paths.info(uri)
  return info.exists && info.isDirectory === false
}

/**
 * Lấy đường dẫn thư mục download books
 */
export const getFolderDownloadBooks = (): string => {
  return new Directory(Paths.document, 'download_books').uri
}

/**
 * Lấy đường dẫn thư mục books
 */
export const getFolderBooks = (): string => {
  return new Directory(Paths.document, 'books').uri
}

/**
 * Tạo các thư mục cần thiết cho app
 */
export const createFolderBooks = async (): Promise<void> => {
  // Create download folder
  const downloadDirectory = new Directory(Paths.document, 'download_books')
  if (!downloadDirectory.exists) {
    try {
      downloadDirectory.create({ intermediates: true, idempotent: true })
      console.log('✅ Created download_books folder')
    } catch (error) {
      console.error('❌ Error creating download_books folder:', error)
      throw error
    }
  }

  // Create books folder
  const booksDirectory = new Directory(Paths.document, 'books')
  if (!booksDirectory.exists) {
    try {
      booksDirectory.create({ intermediates: true, idempotent: true })
      console.log('✅ Created books folder')
    } catch (error) {
      console.error('❌ Error creating books folder:', error)
      throw error
    }
  }
}

/**
 * Lấy đường dẫn để lưu file zip book
 */
export const getPathSaveZipBook = (filename: string): string => {
  const downloadDirectory = new Directory(Paths.document, 'download_books')
  const file = new File(downloadDirectory, filename)
  return file.uri
}

/**
 * Lấy đường dẫn để lưu book (sau khi unzip)
 */
export const getPathSaveBook = (name: string): string => {
  const booksDirectory = new Directory(Paths.document, 'books')
  const file = new File(booksDirectory, name)
  return file.uri
}

/**
 * Đọc danh sách các entry trong thư mục cache
 */
export async function readCacheDirectory(): Promise<string[]> {
  const directory = new Directory(Paths.document, 'books')
  if (!directory.exists) {
    return []
  }

  try {
    return directory.list().map((entry) => entry.name)
  } catch (error) {
    console.error('❌ Error reading cache directory:', error)
    return []
  }
}

/**
 * Tính dung lượng của một thư mục
 */
export async function getDirectorySize(directoryPath: string): Promise<number> {
  try {
    const directory = new Directory(directoryPath)
    if (!directory.exists) return 0
    return directory.size ?? 0
  } catch (error) {
    console.error('❌ Error calculating directory size:', error)
    return 0
  }
}

/**
 * Format bytes thành string dễ đọc
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
