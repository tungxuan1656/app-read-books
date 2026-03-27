import { File } from 'expo-file-system'

import { logger } from '@/utils/logger'

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
  return new Promise<string>(async (resolve, reject) => {
    try {
      const destination = new File(fileUri)

      if (await isFileAsync(fileUri)) {
        logger.info(
          'DownloadService',
          'ZIP file already downloaded => Delete file',
        )
        if (destination.exists) {
          destination.delete()
        }
      }

      const downloadedFile = await File.downloadFileAsync(url, destination)
      resolve(downloadedFile.uri)
    } catch (error) {
      reject(error)
    }
  })
}

export const deleteDownloadFile = (uri: string) => {
  try {
    const file = new File(uri)
    if (file.exists) {
      file.delete()
    }
  } catch (error) {
    logger.error('DownloadService', 'Delete download file error', error)
  }
}
