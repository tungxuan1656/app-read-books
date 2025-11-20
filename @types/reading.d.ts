declare global {
  interface Options {
    currentBook: string
    books: { [k: string]: number }
  }

  interface Book {
    id: string
    name: string
    author: string
    count: string
    references: string[]
  }

  interface Books {
    books: Book[]
  }
}

export {}