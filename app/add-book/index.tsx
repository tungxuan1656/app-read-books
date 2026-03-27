import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItem,
  Text,
  View,
} from 'react-native'
import { unzip } from 'react-native-zip-archive'

import { Divider } from '@/components/divider'
import DownloadBookItem, {
  type ExportedBook,
} from '@/components/download-book-item'
import { GToast } from '@/components/g-toast'
import { Screen } from '@/components/screen'
import { VectorIcon } from '@/components/vector-icon'
import useAppStore from '@/controllers/store'

import { AppColors } from '../../assets'
import {
  deleteDownloadFile,
  downloadFile,
  getFilenameOfUrl,
} from '../../services/download.service'
import {
  createFolderBooks,
  getFolderBooks,
  getPathSaveZipBook,
  showToastError,
} from '../../utils'

const GET_EXPORTED_BOOKS_URL =
  'https://iqtndkcyrsmptlrepaks.supabase.co/functions/v1/get-exported-books'

type ExportedBooksResponse = {
  success: boolean
  data: ExportedBook[]
  message?: string
}

const AddBook = () => {
  const [processing, setProcessing] = useState('')
  const [exportedBooks, setExportedBooks] = useState<ExportedBook[]>([])
  const [fetchingBooks, setFetchingBooks] = useState(false)
  const supabaseAnonKey = useAppStore((s) => s.settings.SUPABASE_ANON_KEY)

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
        throw new Error(
          result.message || 'Không thể tải danh sách truyện có sẵn.',
        )
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
        <View className='items-center px-5 py-6'>
          <ActivityIndicator />
        </View>
      )
    }

    return (
      <View className='px-5 py-6'>
        <Text className='text-center text-xs font-normal text-gray-400'>
          {'Chưa có truyện khả dụng.'}
        </Text>
      </View>
    )
  }

  return (
    <Screen.Container safe='all'>
      <View className='flex-row items-center'>
        <VectorIcon
          name='angle-left'
          font='FontAwesome6'
          size={16}
          buttonStyle={{ width: 44, height: 44 }}
          color={AppColors.gray600}
          onPress={() => router.back()}
        />
        <Text className='ml-1 text-xl font-semibold'>{'Tải truyện'}</Text>
      </View>
      <Divider />
      <Screen.Content>
        <FlatList
          data={exportedBooks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderExportedBook}
          ItemSeparatorComponent={Divider}
          refreshing={fetchingBooks}
          onRefresh={fetchExportedBooks}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        />
      </Screen.Content>
      {processing ? (
        <View className='absolute inset-0 items-center justify-center gap-2.5 bg-[#fefefeaa]'>
          <ActivityIndicator />
          <Text className='text-xs font-semibold'>{processing}</Text>
        </View>
      ) : null}
    </Screen.Container>
  )
}

export default AddBook
