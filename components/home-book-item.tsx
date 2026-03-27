import { router } from 'expo-router'
import React from 'react'
import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native'

import { useBooksStore } from '@/controllers/stores'
import { deleteBook, getFolderBooks } from '@/utils'

import { GToast } from './g-toast'
import { VectorIcon } from './vector-icon'

const HomeBookItem = ({ id }: { id: string; onDeleteSuccess: () => void }) => {
  const book = useBooksStore((state) => state.id2Book[id])

  const onSelectBook = () => {
    router.push({
      pathname: '/reading',
      params: { bookId: book.id },
    })
  }

  return (
    <TouchableOpacity
      className='h-16 flex-row items-center justify-between gap-1.5 px-4'
      key={book.name}
      onPress={onSelectBook}>
      <View className='flex-1 gap-1'>
        <Text className='text-base font-medium text-gray-900' numberOfLines={2}>
          {book.name}
        </Text>
        <Text className='text-sm font-normal text-gray-500'>
          {`${book.author || '#'} - ${book.count} chương`}
        </Text>
      </View>

      <VectorIcon
        name='chevron-right'
        font='FontAwesome5'
        size={12}
        color='#9ca3af'
      />
    </TouchableOpacity>
  )
}

export const useBookActions = (id: string, onDeleteSuccess: () => void) => {
  const book = useBooksStore((state) => state.id2Book[id])

  const onDeleteBook = () => {
    Alert.alert('Xoá truyện', 'Bạn có chắc chắn muốn xoá bộ truyện này?', [
      {
        text: 'Đồng ý',
        style: 'destructive',
        onPress: () => {
          deleteBook(getFolderBooks() + book.id)
          GToast.success({ message: 'Đã xóa truyện' })
          onDeleteSuccess()
        },
      },
      { text: 'Huỷ', style: 'cancel' },
    ])
  }

  const onOpenInfo = () => {
    Linking.openURL(`https://metruyencv.com/truyen/${book.id}`)
  }

  return { book, onDeleteBook, onOpenInfo }
}

export default React.memo(HomeBookItem)
