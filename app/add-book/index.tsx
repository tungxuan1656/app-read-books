import { router } from 'expo-router'
import React, { useCallback, useEffect } from 'react'
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItem,
  Text,
  View,
} from 'react-native'

import { type ExportedBook } from '@/@types/book-import'
import { Divider } from '@/components/divider'
import DownloadBookItem from '@/components/download-book-item'
import { GToast } from '@/components/g-toast'
import { Screen } from '@/components/screen'
import { VectorIcon } from '@/components/vector-icon'
import { useAddBook } from '@/hooks/use-add-book'

import { AppColors } from '../../assets'

const AddBook = () => {
  const {
    processing,
    exportedBooks,
    fetchingBooks,
    fetchBooks,
    handleDownloadExport: startDownloadExport,
    lastError,
  } = useAddBook()

  useEffect(() => {
    if (!lastError) return
    GToast.error({ message: lastError })
  }, [lastError])

  const handleDownloadExport = useCallback(
    async (item: ExportedBook) => {
      const success = await startDownloadExport(item)

      if (success) {
        GToast.success({ message: 'Tải truyện thành công!' })
        router.canGoBack() && router.back()
        return
      }

      if (!lastError) {
        GToast.error({ message: 'Có lỗi xảy ra khi tải truyện.' })
      }
    },
    [lastError, startDownloadExport],
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
          onRefresh={fetchBooks}
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
