export interface BookMeta {
  id: number
  name: string
  slug: string
  author: string | null
  chapterCount: number | null
  status: string | null
  synopsis: string | null
  lastUpdated: string | null
}

export interface ExportedBook {
  id: number
  bookId: number
  exportUrl: string
  fileSize: number
  exportFormat: string
  exportedAt: string
  updatedAt: string
  book: BookMeta
}

export interface ExportedBooksResponse {
  success: boolean
  data: ExportedBook[]
  message?: string
}
