import React, { useCallback } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { VectorIcon } from './Icon'
import useAppStore from '@/controllers/store'
import { AppTypo } from '@/constants'
import { AppPalette } from '@/assets'
import { router } from 'expo-router'
import { deleteBook, getFolderBooks } from '@/utils'

const HomeBookItem = ({ id }: { id: string }) => {
  const book = useAppStore((state) => state.id2Book[id])
  const onSelectBook = useCallback((book: Book) => {
    router.push({
      pathname: '/reading',
      params: { bookId: book.id },
    })
  }, [])

  const onLongSelectBook = useCallback((book: Book) => {
    Alert.alert('Xoá truyện', 'Bạn có chắc chắn muốn xoá bộ truyện này?', [
      {
        text: 'Đồng ý',
        style: 'destructive',
        onPress: () => {
          deleteBook(getFolderBooks() + book.id)
        },
      },
      { text: 'Huỷ', style: 'cancel' },
    ])
  }, [])

  return (
    <TouchableOpacity
      style={styles.item}
      key={book.name}
      onLongPress={() => onLongSelectBook(book)}
      onPress={() => onSelectBook(book)}>
      <View style={{ gap: 4, flex: 1 }}>
        <Text style={[AppTypo.body.medium]} numberOfLines={1}>
          {book.name}
        </Text>
        <Text style={[AppTypo.caption.regular, { color: AppPalette.gray700 }]}>
          {`${book.author || '#'} - ${book.count} chương`}
        </Text>
      </View>
      <VectorIcon name="chevron-right" font="FontAwesome5" size={12} />
    </TouchableOpacity>
  )
}

export default React.memo(HomeBookItem)

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    height: 72,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
})
