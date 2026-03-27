import { Dimensions, Platform } from 'react-native'

export const AppConst = {
  windowHeight: () => Dimensions.get('window').height,
  windowWidth: () => Dimensions.get('window').width,
  screenHeight: () => Dimensions.get('screen').height,
  screenWidth: () => Dimensions.get('screen').width,

  OS: Platform.OS,
  defaultLanguage: 'en',

  format: {
    date: 'DD/MM/YYYY',
    isoDate: 'YYYY-MM-DD',
    time: 'HH:mm',
    dateTime: 'HH:mm DD/MM/YYYY',
    isoDateTime: 'YYYY-MM-DD HH:mm:ss',
    database: 'YYYYMMDD',
  },

  // timeoutDelay
  timeout: {
    search: 1000,
  },

  maxLength: {
    email: 50,
    name: 50,
    password: 18,
  },

  defaultImageUri: 'https://daily.tungxuan.com/default.png',
}

export const AppSpace = {
  smallest: 8,
  small: 12,
  medium: 16,
  large: 20,
  largest: 24,
  custom: (n: number) => n,
}

export const AppRadius = {
  smallest: 6,
  small: 8,
  medium: 10,
  large: 12,
  largest: 16,
  custom: (n: number) => n,
}

export const AppSize = {
  custom: (n: number) => n,
}
