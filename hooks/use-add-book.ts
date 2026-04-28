import { useCallback, useEffect, useState } from 'react'

import { type ExportedBook } from '@/@types/book-import'
import { useSettingsStore } from '@/controllers/stores'
import {
  fetchExportedBooks,
  importBookFromExportUrl,
} from '@/services/book-import.service'

interface UseAddBookState {
  processing: string
  exportedBooks: ExportedBook[]
  fetchingBooks: boolean
  fetchBooks: () => Promise<void>
  handleDownloadExport: (item: ExportedBook) => Promise<boolean>
  lastError: string
}

export const useAddBook = (): UseAddBookState => {
  const [processing, setProcessing] = useState('')
  const [exportedBooks, setExportedBooks] = useState<ExportedBook[]>([])
  const [fetchingBooks, setFetchingBooks] = useState(false)
  const [lastError, setLastError] = useState('')

  const booksApiUrl = useSettingsStore.use.settings().BOOKS_API_URL

  const fetchBooks = useCallback(async () => {
    setFetchingBooks(true)
    setLastError('')
    const result = await fetchExportedBooks(booksApiUrl)
    if (result.ok) {
      setExportedBooks(result.data)
    } else {
      setExportedBooks([])
      setLastError(result.error.message)
    }
    setFetchingBooks(false)
  }, [booksApiUrl])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const handleDownloadExport = useCallback(async (item: ExportedBook) => {
    setProcessing('Đang tải...')
    setLastError('')

    const result = await importBookFromExportUrl(item.exportUrl)

    setProcessing('')

    if (!result.ok) {
      setLastError(result.error.message)
    }

    return result.ok
  }, [])

  return {
    processing,
    exportedBooks,
    fetchingBooks,
    fetchBooks,
    handleDownloadExport,
    lastError,
  }
}
