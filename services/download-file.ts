import { unzip } from 'react-native-zip-archive'
import * as FileSystem from 'expo-file-system'
import { isFileAsync } from '../utils'

export const getFilenameOfUrl = (url: string) => {
  const paths = url.split('/')
  return paths[paths.length - 1]
}

export const getNameOfFile = (filename: string) => {
  const paths = filename.split('.')
  return paths[0]
}

export const downloadFile = (url: string, fileUri: string) => {
  return new Promise<string>((resolve, reject) => {
    isFileAsync(fileUri).then(async (isFile) => {
      if (isFile) {
        console.log('ZIP file already downloaded => Delete file!')
        await FileSystem.deleteAsync(fileUri).catch((error) => reject(error))
      }
      FileSystem.downloadAsync(url, fileUri)
        .then(({ uri }) => {
          resolve(uri)
        })
        .catch((error) => {
          reject(error)
        })
    })
  })
}

export const deleteDownloadFile = (uri: string) => {
  FileSystem.deleteAsync(uri).catch((error) => console.log(error))
}
