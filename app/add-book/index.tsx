import { Button } from '@/components/Button'
import { Divider, Screen } from '@/components/Screen'
import { Stack } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppColors, AppPalette } from '../../assets'
import { AppStyles, AppTypo } from '../../constants'
import {
  deleteDownloadFile,
  downloadFile,
  getFilenameOfUrl,
  getNameOfFile,
} from '../../services/download-file'
import { unzip } from 'react-native-zip-archive'
import { createFolderBooks, getFolderBooks, getPathSaveZipBook, showToastError } from '../../utils'

const AddBook = (props: any) => {
  const [linkDownload, setLinkDownload] = useState('')
  const [processing, setProcessing] = useState('')

  useEffect(() => {
    createFolderBooks()
  }, [])

  const downloadBook = async () => {
    setProcessing('Đang tải...')
    const filename = getFilenameOfUrl(linkDownload)
    const fileUri = getPathSaveZipBook(filename)
    downloadFile(linkDownload, fileUri)
      .then((uri) => {
        unzipBook(uri)
      })
      .catch((error) => {
        showToastError(error)
      })
      .finally(() => setProcessing(''))
  }

  const unzipBook = async (uri: string) => {
    const name = getNameOfFile(getFilenameOfUrl(linkDownload))
    const target = getFolderBooks()
    setProcessing('Đang giải nén...')
    unzip(uri, target, 'UTF-8')
      .then((path) => {
        console.log(`unzip completed at ${path}`)
        deleteDownloadFile(uri)
      })
      .catch((error) => {
        showToastError(error)
      })
      .finally(() => setProcessing(''))
  }

  return (
    <Screen.Container>
      <Stack.Screen
        options={{ title: 'Thêm truyện mới', headerBackTitleVisible: false, headerShown: true }}
      />
      <Divider />
      <Screen.Content useScroll>
        <Text
          style={[
            AppTypo.caption.regular,
            { color: AppPalette.gray200, marginTop: 20, marginHorizontal: 20 },
          ]}>
          {
            'Ví dụ: https://gitlab.com/tungxuan1656/file-storages/-/raw/main/books/ta-tro-thanh-phu-nhi-dai-phan-phai.zip'
          }
        </Text>
        <TextInput
          placeholder="Nhập link tải truyện"
          value={linkDownload}
          onChangeText={setLinkDownload}
          style={[AppTypo.body.medium, styles.input]}
          clearButtonMode="while-editing"
        />
      </Screen.Content>
      <Button title={'Tải xuống'} style={{ marginHorizontal: 16 }} onPress={downloadBook} />
      {processing ? (
        <View style={[AppStyles.view.absoluteFill, AppStyles.view.contentCenter, { gap: 10 }]}>
          <ActivityIndicator />
          <Text style={[AppTypo.caption.semiBold]}>{processing}</Text>
        </View>
      ) : null}
    </Screen.Container>
  )
}

export default AddBook

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: AppColors.strokeExtra,
    paddingHorizontal: 16,
  },
})
