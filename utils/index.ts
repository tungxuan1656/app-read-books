import { GToast } from '@/components/g-toast'
import { MMKVKeys } from '@/constants'
import { MMKVStorage } from '@/controllers/mmkv'
import { Directory, File, Paths } from 'expo-file-system'

export const showToastError = (error: any) => {
  const message = typeof error === 'string' ? error : JSON.stringify(error)
  GToast.error({ message })
  console.log(message)
}

export async function isFileAsync(uri: string) {
  const info = Paths.info(uri)
  return info.exists && info.isDirectory === false
}

export const getFolderDownloadBooks = () => {
  return new Directory(Paths.document, 'download_books').uri
}

export const getFolderBooks = () => {
  return new Directory(Paths.document, 'books').uri
}

export const createFolderBooks = async () => {
  const downloadDirectory = new Directory(Paths.document, 'download_books')
  if (!downloadDirectory.exists) {
    try {
      downloadDirectory.create({ intermediates: true, idempotent: true })
      console.log('Create folder download books successfully!')
    } catch (error) {
      showToastError(error)
    }
  }

  const booksDirectory = new Directory(Paths.document, 'books')
  if (!booksDirectory.exists) {
    try {
      booksDirectory.create({ intermediates: true, idempotent: true })
      console.log('Create folder unzip books successfully!')
    } catch (error) {
      showToastError(error)
    }
  }
}

export const getPathSaveZipBook = (filename: string) => {
  const downloadDirectory = new Directory(Paths.document, 'download_books')
  const file = new File(downloadDirectory, filename)
  return file.uri
}

export const getPathSaveBook = (name: string) => {
  const booksDirectory = new Directory(Paths.document, 'books')
  const file = new File(booksDirectory, name)
  return file.uri
}

export const readFolderBooks = async () => {
  const directory = new Directory(Paths.document, 'books')
  if (!directory.exists) {
    return []
  }

  let entries: (Directory | File)[] = []
  try {
    entries = directory.list()
  } catch (error) {
    showToastError(error)
    return []
  }

  console.log(entries.map((entry) => entry.name))

  const listPathBooks = entries
    .filter((entry): entry is Directory => entry instanceof Directory)
    .map((entry) => entry.uri)

  const books = []

  for (let index = 0; index < listPathBooks.length; index++) {
    const path = listPathBooks[index]
    const res = await getBook(path)
    if (res !== null) books.push(res)
  }

  return books
}

export const getBook = async (bookPath: string) => {
  const bookDirectory = new Directory(bookPath)

  if (!bookDirectory.exists) {
    return null
  }

  let entries: (Directory | File)[] = []
  try {
    entries = bookDirectory.list()
  } catch (error) {
    showToastError(error)
    return null
  }

  const bookJson = entries.find(
    (entry): entry is File => entry instanceof File && entry.name === 'book.json',
  )

  if (!bookJson) {
    return null
  }

  try {
    const infoString = await bookJson.text()
    const info: Book = JSON.parse(infoString)
    return info
  } catch (error) {
    showToastError(error)
    return null
  }
}

export const deleteBook = async (bookPath: string) => {
  console.log(bookPath)
  try {
    new Directory(bookPath).delete()
    GToast.success({ message: 'Xoá thành công!' })
  } catch (error) {
    showToastError(error)
  }
}

export const getBookChapterContent = async (bookId: string, chapter: number) => {
  try {
    const chapterFile = new File(
      new Directory(Paths.document, 'books'),
      `${bookId}/chapters/chapter-${chapter}.html`,
    )
    return await chapterFile.text()
  } catch (error) {
    showToastError(error)
    throw error
  }
}

export async function readCacheDirectory() {
  const directory = new Directory(Paths.document, 'books')
  if (!directory.exists) {
    return []
  }

  try {
    return directory.list().map((entry) => entry.name)
  } catch (error) {
    showToastError(error)
    return []
  }
}

export const getListFonts = () => {
  return [
    'Inter-Regular',
    'Montserrat-Regular',
    'NotoSans-Regular',
    'OpenSans-Regular',
    'Raleway-Regular',
    'Roboto-Regular',
    'SpaceMono-Regular',
    'WorkSans-Regular',
  ]
}

export const getChapterHtml = (html: string) => {
  return `
    <html lang="en">
      <body>
        ${html}
      </body>
    </html>
  `
}

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export const getCurrentBookId = () => {
  return (MMKVStorage.get(MMKVKeys.CURRENT_BOOK_ID) as string) || ''
}

export const saveCurrentBookId = (bookId: string) => {
  MMKVStorage.set(MMKVKeys.CURRENT_BOOK_ID, bookId)
}
