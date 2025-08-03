declare global {
  interface Options {
    currentBook: string
    books: { [k: string]: number }
  }

  interface Book {
    name: string
    count: string
    author: string
    references: string[]
    id: string
  }

  interface Books {
    books: Book[]
  }
}

export {}