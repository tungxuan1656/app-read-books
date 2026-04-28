import { unzip } from 'react-native-zip-archive'

import {
  type ExportedBook,
  type ExportedBooksResponse,
} from '@/@types/book-import'
import { createFolderBooks, getFolderBooks, getPathSaveZipBook } from '@/utils'
import { logger } from '@/utils/logger'

import {
  deleteDownloadFile,
  downloadFile,
  getFilenameOfUrl,
} from './download.service'
import { toErrorMessage } from './error-mapper.service'
import { fail, ok, type ServiceResult } from './service-result'

const GET_EXPORTED_BOOKS_URL =
  'https://iqtndkcyrsmptlrepaks.supabase.co/functions/v1/get-exported-books'

export const fetchExportedBooks = async (
  booksApiUrl: string,
): Promise<ServiceResult<ExportedBook[]>> => {
  try {
    const response = await fetch(booksApiUrl || GET_EXPORTED_BOOKS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = (await response.json()) as ExportedBooksResponse

    if (!response.ok || !result.success) {
      return fail(
        'FETCH_EXPORTED_BOOKS_FAILED',
        result.message || 'Không thể tải danh sách truyện có sẵn.',
      )
    }

    return ok(result.data ?? [])
  } catch (error) {
    logger.error('BookImportService', 'Fetch exported books failed', error)
    return fail(
      'FETCH_EXPORTED_BOOKS_FAILED',
      toErrorMessage(error, 'Không thể tải danh sách truyện có sẵn.'),
      error,
    )
  }
}

export const importBookFromExportUrl = async (
  exportUrl: string,
): Promise<ServiceResult<void>> => {
  try {
    await createFolderBooks()

    const filename = getFilenameOfUrl(exportUrl)
    const zipUri = getPathSaveZipBook(filename)

    const downloadedUri = await downloadFile(exportUrl, zipUri)

    await unzip(downloadedUri, getFolderBooks(), 'UTF-8')

    deleteDownloadFile(downloadedUri)

    return ok(undefined)
  } catch (error) {
    logger.error('BookImportService', 'Import book failed', error)
    return fail(
      'IMPORT_BOOK_FAILED',
      toErrorMessage(error, 'Có lỗi xảy ra khi tải truyện.'),
      error,
    )
  }
}
