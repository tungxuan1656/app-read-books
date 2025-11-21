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
  TouchableOpacity,
  View,
} from 'react-native'
import { unzip } from 'react-native-zip-archive'
import { AppColors, AppPalette } from '../../assets'
import { AppConfigs, AppStyles, AppTypo } from '../../constants'
import { deleteDownloadFile, downloadFile, getFilenameOfUrl } from '../../services/download.service'
import { createFolderBooks, getFolderBooks, getPathSaveZipBook, showToastError } from '../../utils'

const GET_EXPORTED_BOOKS_URL =
  'https://iqtndkcyrsmptlrepaks.supabase.co/functions/v1/get-exported-books'

type ExportedBooksResponse = {
  success: boolean
  data: ExportedBook[]
  message?: string
}

const AddBook = (props: any) => {
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
    (url: string) => {
      setProcessing('Đang tải...')
      const filename = getFilenameOfUrl(url)
      const fileUri = getPathSaveZipBook(filename)
      downloadFile(url, fileUri)
        .then(unzipBook)
        .catch(showToastError)
        .finally(() => setProcessing(''))
    },
    [unzipBook],
  )

  const handleDownloadExport = useCallback(
    (item: ExportedBook) => {
      downloadBook(item.exportUrl)
    },
    [downloadBook],
  )

  const renderExportedBook: ListRenderItem<ExportedBook> = ({ item }) => (
    <DownloadBookItem item={item} onDownload={handleDownloadExport} />
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
        <Text style={[AppTypo.h3.semiBold, { marginLeft: 4 }]}>{'Tải truyện'}</Text>
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
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </Screen.Content>
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
  emptyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
})
