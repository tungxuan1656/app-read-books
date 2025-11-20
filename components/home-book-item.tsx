import React from 'react'
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { VectorIcon } from './Icon'
import useAppStore from '@/controllers/store'
import { AppTypo } from '@/constants'
import { AppPalette } from '@/assets'
import { router } from 'expo-router'
import { deleteBook, getFolderBooks } from '@/utils'
import { GToast } from './g-toast'

const HomeBookItem = ({ id, onDeleteSuccess }: { id: string; onDeleteSuccess: () => void }) => {
  const book = useAppStore((state) => state.id2Book[id])

  const onSelectBook = () => {
    router.push({
      pathname: '/reading',
      params: { bookId: book.id },
    })
  }

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

  return (
    <TouchableOpacity style={styles.item} key={book.name} onPress={onSelectBook}>
      <View style={{ gap: 4, flex: 1 }}>
        <Text style={[AppTypo.body.medium, { color: AppPalette.gray900 }]} numberOfLines={2}>
          {book.name}
        </Text>
        <Text style={[AppTypo.caption.regular, { color: AppPalette.gray500 }]}>
          {`${book.author || '#'} - ${book.count} chương`}
        </Text>
      </View>

      <VectorIcon name="chevron-right" font="FontAwesome5" size={12} color={AppPalette.gray400} />
    </TouchableOpacity>
  )
}

export const useBookActions = (id: string, onDeleteSuccess: () => void) => {
  const book = useAppStore((state) => state.id2Book[id])

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

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    height: 72,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 6,
  },
})
