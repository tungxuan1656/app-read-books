import { useCallback, useEffect, useState } from 'react'

import { type ExportedBook } from '@/@types/book-import'
import useAppStore from '@/controllers/store'
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

  const supabaseAnonKey = useAppStore((s) => s.settings.SUPABASE_ANON_KEY)

  const fetchBooks = useCallback(async () => {
    setFetchingBooks(true)
    setLastError('')
    const result = await fetchExportedBooks(supabaseAnonKey)
    if (result.ok) {
      setExportedBooks(result.data)
    } else {
      setExportedBooks([])
      setLastError(result.error.message)
    }
    setFetchingBooks(false)
  }, [supabaseAnonKey])

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
