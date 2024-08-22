import { GToast } from '@/components/GToast'
import * as FileSystem from 'expo-file-system'

export const showToastError = (error: any) => {
  const message = typeof error === 'string' ? error : JSON.stringify(error)
  GToast.error({ message })
  console.log(message)
}

export async function isFileAsync(uri: string) {
  const result = await FileSystem.getInfoAsync(uri)
  return result.exists && !result.isDirectory
}

export const getFolderDownloadBooks = () => {
  return FileSystem.documentDirectory + 'download_books/'
}

export const getFolderBooks = () => {
  return FileSystem.documentDirectory + 'books/'
}

export const createFolderBooks = async () => {
  const downloadBook = getFolderDownloadBooks()
  const unzipBook = getFolderBooks()
  const checkDownload = await FileSystem.getInfoAsync(downloadBook)
  if (!checkDownload.exists) {
    FileSystem.makeDirectoryAsync(downloadBook)
      .then(() => {
        console.log('Create folder download books successfully!')
      })
      .catch((error) => showToastError(error))
  }
  const checkUnzip = await FileSystem.getInfoAsync(unzipBook)
  if (!checkUnzip.exists) {
    FileSystem.makeDirectoryAsync(unzipBook)
      .then(() => {
        console.log('Create folder unzip books successfully!')
      })
      .catch((error) => showToastError(error))
  }
}

export const getPathSaveZipBook = (filename: string) => {
  return getFolderDownloadBooks() + filename
}

export const getPathSaveBook = (name: string) => {
  return getFolderBooks() + name
}

export const readFolderBooks = async () => {
  const entries = await FileSystem.readDirectoryAsync(getFolderBooks())
  const listPathBooks = entries.map((n) => getFolderBooks() + n)

  const books = []

  for (let index = 0; index < listPathBooks.length; index++) {
    const path = listPathBooks[index]
    const res = await getBook(path)
    if (res !== null) books.push(res)
  }

  return books
}

export const getBook = async (bookPath: string) => {
  const entries = await FileSystem.readDirectoryAsync(bookPath)
  if (entries.includes('book.json')) {
    const infoString = await FileSystem.readAsStringAsync(bookPath + '/book.json')
    try {
      const info: Book = JSON.parse(infoString)
      return info
    } catch (error) {
      showToastError(error)
      return null
    }
  }
  return null
}

export const getBookChapterContent = async (bookId: string, chapter: number) => {
  const content = await FileSystem.readAsStringAsync(
    getFolderBooks() + `${bookId}/chapters/chapter-${chapter}.html`,
  )
  return content
}

export async function readCacheDirectory() {
  const entries = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory + 'books')
  return entries
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
