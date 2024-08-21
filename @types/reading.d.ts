interface Options {
  font: string
  size: number
  line: number
  currentBook: string
  books: {
    [k: string]: {
      chapter: number
      offset: number
    }
  }
  isReading: boolean
}

interface Book {
  name: string
  count: string
  author: string
  references: string[]
  id: string
}
