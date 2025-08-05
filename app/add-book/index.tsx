import { Button } from '@/components/Button'
import { GToast } from '@/components/GToast'
import { Divider, Screen } from '@/components/Screen'
import { Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { unzip } from 'react-native-zip-archive'
import { AppColors, AppPalette } from '../../assets'
import { AppStyles, AppTypo } from '../../constants'
import {
  deleteDownloadFile,
  downloadFile,
  getFilenameOfUrl,
  getNameOfFile,
} from '../../services/download-file'
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
      .then(unzipBook)
      .catch(showToastError)
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
        GToast.success({ message: 'Tải truyện thành công!' })
      })
      .catch(showToastError)
      .finally(() => setProcessing(''))
  }

  const onPressLinkSource = async () => {
    const res = await WebBrowser.openBrowserAsync('https://tx-book-source.web.app/')
    console.log(res)
  }

  return (
    <Screen.Container>
      <Stack.Screen
        options={{ title: 'Thêm truyện mới', headerShown: true }}
      />
      <Divider />
      <Screen.Content useScroll contentContainerStyle={{ padding: 20, gap: 20 }}>
        <TouchableOpacity onPress={onPressLinkSource}>
          <Text
            style={[
              AppTypo.headline.semiBold,
              { color: AppPalette.blue500, textDecorationLine: 'underline' },
            ]}>
            {'https://tx-book-source.web.app/'}
          </Text>
        </TouchableOpacity>
        <Text style={[AppTypo.caption.regular, { color: AppPalette.gray200 }]}>
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
        <View style={[AppStyles.view.absoluteFill, AppStyles.view.contentCenter, { gap: 10, backgroundColor: '#fefefeaa' }]}>
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
    borderWidth: 1,
    borderColor: AppColors.strokeExtra,
    paddingHorizontal: 16,
  },
})
