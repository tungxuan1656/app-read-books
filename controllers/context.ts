import { createContext, useContext } from 'react'
import { DeviceEventEmitter } from 'react-native'

export const defaultOptions: Options = {
  currentBook: '',
  books: {},
}

export const ReadingContext = createContext(defaultOptions)

export const useReading = () => {
  const reading = useContext(ReadingContext)
  return reading
}

export const setReadingContext = (data: Options) => {
  DeviceEventEmitter.emit('setReadingValue', data)
}
