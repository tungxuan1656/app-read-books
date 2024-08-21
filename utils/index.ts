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

  console.log(listPathBooks)
  const books = []

  for (let index = 0; index < listPathBooks.length; index++) {
    const path = listPathBooks[index]
    const res = await getBook(path)
    if (res !== null) books.push(res)
  }

  return books
}

export const getBook = async (bookPath: string) => {
  console.log(bookPath)
  const entries = await FileSystem.readDirectoryAsync(bookPath)
  console.log(entries)
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
  return ['Noto Sans', 'Space Mono', 'Roboto', 'Inter', 'Open Sans' ]
}

export const getFontCss = (name: string) => {
  switch (name.toLowerCase()) {
    case 'noto sans':
      return {
        head: '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@100..900&display=swap" rel="stylesheet">',
        family: `"Noto Sans", sans-serif`,
      }
    case 'space mono':
      return {
        head: '<link href="https://fonts.googleapis.com/css2?family=Space+Mono&display=swap" rel="stylesheet">',
        family: `"Space Mono", sans-serif`,
      }
    case 'roboto':
      return {
        head: '<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap" rel="stylesheet">',
        family: `"Roboto", sans-serif`,
      }
    case 'inter':
      return {
        head: '<link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,100..900&display=swap" rel="stylesheet">',
        family: `"Inter", sans-serif`,
      }
    case 'open sans':
      return {
        head: '<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300..800&display=swap" rel="stylesheet">',
        family: `"Open Sans", sans-serif`,
      }
    default:
      return {
        head: '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap" rel="stylesheet">',
        family: `"Noto Sans", sans-serif`,
      }
  }
}

export const getChapterHtml = (html: string, fontName: string, fontSize: number, line: number) => {
  const font = getFontCss(fontName)
  return `
  <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        ${font.head}
        <style>
            body {
                font-family: ${font.family};
                font-size: ${fontSize}px;
                margin: 0;
                padding: 40px 16px;
                font-optical-sizing: auto;
                font-style: normal;
                font-variation-settings: "wdth" 100;
                font-weight: 400;
                line-height: ${fontSize * line}px;
                background-color: #F5F1E5;
            }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `
}
