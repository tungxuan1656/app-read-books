import { createContext, useContext } from 'react'
import { DeviceEventEmitter } from 'react-native'

export const defaultOptions: Options = {
  font: 'Noto Sans',
  size: 24,
  currentBook: '',
  books: {},
  isReading: false,
  line: 1.5,
}

export const ReadingContext = createContext(defaultOptions)

export const useReading = () => {
  const reading = useContext(ReadingContext)
  return reading
}

export const setReadingContext = (data: Options) => {
  DeviceEventEmitter.emit('setReadingValue', data)
}
