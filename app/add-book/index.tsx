import { Button } from '@/components/Button'
import DownloadBookItem, { ExportedBook } from '@/components/download-book-item'
import { GToast } from '@/components/g-toast'
import { Divider, Screen } from '@/components/Screen'
import { VectorIcon } from '@/components/Icon'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { unzip } from 'react-native-zip-archive'
import { AppColors, AppPalette } from '../../assets'
import { AppConfigs, AppStyles, AppTypo } from '../../constants'
import { deleteDownloadFile, downloadFile, getFilenameOfUrl } from '../../services/download-file'
import { createFolderBooks, getFolderBooks, getPathSaveZipBook, showToastError } from '../../utils'

const GET_EXPORTED_BOOKS_URL =
  'https://iqtndkcyrsmptlrepaks.supabase.co/functions/v1/get-exported-books'

type ExportedBooksResponse = {
  success: boolean
  data: ExportedBook[]
  message?: string
}

const AddBook = (props: any) => {
  const [linkDownload, setLinkDownload] = useState('')
  const [processing, setProcessing] = useState('')
  const [exportedBooks, setExportedBooks] = useState<ExportedBook[]>([])
  const [fetchingBooks, setFetchingBooks] = useState(false)
  const supabaseAnonKey = AppConfigs.API.SUPABASE_ANON_KEY

  const fetchExportedBooks = useCallback(async () => {
    if (!supabaseAnonKey) {
      GToast.error({ message: 'Chưa cấu hình SUPABASE_ANON_KEY' })
      return
    }

    setFetchingBooks(true)
    try {
      const response = await fetch(GET_EXPORTED_BOOKS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      })

      const result: ExportedBooksResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể tải danh sách truyện có sẵn.')
      }

      setExportedBooks(result.data ?? [])
    } catch (error) {
      showToastError(error)
    } finally {
      setFetchingBooks(false)
    }
  }, [supabaseAnonKey])

  useEffect(() => {
    createFolderBooks()
    fetchExportedBooks()
  }, [fetchExportedBooks])

  const unzipBook = useCallback((uri: string) => {
    const target = getFolderBooks()
    setProcessing('Đang giải nén...')
    return unzip(uri, target, 'UTF-8')
      .then((path) => {
        console.log(`unzip completed at ${path}`)
        deleteDownloadFile(uri)
        GToast.success({ message: 'Tải truyện thành công!' })
        router.canGoBack() && router.back()
      })
      .catch(showToastError)
      .finally(() => setProcessing(''))
  }, [])

  const downloadBook = useCallback(
    (url?: string) => {
      const targetUrl = url ?? linkDownload.trim()

      if (!targetUrl) {
        GToast.error({ message: 'Vui lòng nhập link tải truyện.' })
        return
      }

      setProcessing('Đang tải...')
      const filename = getFilenameOfUrl(targetUrl)
      const fileUri = getPathSaveZipBook(filename)
      downloadFile(targetUrl, fileUri)
        .then(unzipBook)
        .catch(showToastError)
        .finally(() => setProcessing(''))
    },
    [linkDownload, unzipBook],
  )

  const handleDownloadExport = useCallback(
    (item: ExportedBook) => {
      downloadBook(item.exportUrl)
    },
    [downloadBook],
  )

  const onPressLinkSource = async () => {
    const res = await WebBrowser.openBrowserAsync('https://tx-book-source.web.app/')
    console.log(res)
  }

  const renderExportedBook: ListRenderItem<ExportedBook> = ({ item }) => (
    <DownloadBookItem item={item} onDownload={handleDownloadExport} />
  )

  const renderListHeader = () => (
    <View style={styles.listHeader}>
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

      <View style={{ gap: 4 }}>
        <Text style={[AppTypo.caption.semiBold, { color: AppPalette.gray400 }]}>
          {'Danh sách truyện đã xuất bản'}
        </Text>
        {supabaseAnonKey ? (
          exportedBooks.length > 0 ? (
            <Text style={[AppTypo.caption.regular, { color: AppPalette.gray300 }]}>
              {`${exportedBooks.length} truyện có sẵn để tải xuống`}
            </Text>
          ) : null
        ) : (
          <Text style={[AppTypo.caption.regular, { color: AppPalette.red500 }]}>
            {'Vui lòng cấu hình SUPABASE_ANON_KEY để hiển thị danh sách có sẵn.'}
          </Text>
        )}
      </View>
    </View>
  )

  const renderEmptyList = () => {
    if (fetchingBooks) {
      return (
        <View style={[styles.emptyContainer, { alignItems: 'center' }]}>
          <ActivityIndicator />
        </View>
      )
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={[AppTypo.caption.regular, { color: AppPalette.gray400, textAlign: 'center' }]}>
          {'Chưa có truyện khả dụng.'}
        </Text>
      </View>
    )
  }

  return (
    <Screen.Container safe="all">
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <VectorIcon
          name="angle-left"
          font="FontAwesome6"
          size={16}
          buttonStyle={{ width: 44, height: 44 }}
          color={AppPalette.gray600}
          onPress={() => router.back()}
        />
        <Text style={[AppTypo.h3.semiBold, { marginLeft: 4 }]}>{'Thêm truyện mới'}</Text>
      </View>
      <Divider />
      <Screen.Content style={{ flex: 1 }}>
        <FlatList
          style={{ flex: 1 }}
          data={exportedBooks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderExportedBook}
          ItemSeparatorComponent={Divider}
          refreshing={fetchingBooks}
          onRefresh={fetchExportedBooks}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </Screen.Content>
      <Button title={'Tải xuống'} style={{ marginHorizontal: 16 }} onPress={() => downloadBook()} />
      {processing ? (
        <View
          style={[
            AppStyles.view.absoluteFill,
            AppStyles.view.contentCenter,
            { gap: 10, backgroundColor: '#fefefeaa' },
          ]}>
          <ActivityIndicator />
          <Text style={[AppTypo.caption.semiBold]}>{processing}</Text>
        </View>
      ) : null}
    </Screen.Container>
  )
}

export default AddBook

const styles = StyleSheet.create({
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20,
  },
  input: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.strokeExtra,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
})
