import React, { useCallback } from 'react'
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { VectorIcon } from './Icon'
import useAppStore from '@/controllers/store'
import { AppTypo } from '@/constants'
import { AppPalette } from '@/assets'
import { router } from 'expo-router'
import { deleteBook, getFolderBooks } from '@/utils'

const HomeBookItem = ({ id, onDeleteSuccess }: { id: string; onDeleteSuccess: () => void }) => {
  const book = useAppStore((state) => state.id2Book[id])
  const isEditingBook = useAppStore((state) => state.isEditingBook)

  const onSelectBook = () => {
    router.push({
      pathname: '/reading',
      params: { bookId: book.id },
    })
  }

  const onLongSelectBook = () => {
    Alert.alert('Xoá truyện', 'Bạn có chắc chắn muốn xoá bộ truyện này?', [
      {
        text: 'Đồng ý',
        style: 'destructive',
        onPress: () => {
          deleteBook(getFolderBooks() + book.id)
          onDeleteSuccess()
        },
      },
      { text: 'Huỷ', style: 'cancel' },
    ])
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

      {isEditingBook ? (
        <VectorIcon
          name="delete"
          font="Feather"
          size={16}
          color={AppPalette.red500}
          onPress={onLongSelectBook}
          buttonStyle={{ padding: 8 }}
        />
      ) : (
        <>
          <VectorIcon
            name="circle-info"
            font="FontAwesome6"
            size={16}
            color={AppPalette.gray400}
            onPress={() => Linking.openURL(`https://metruyencv.com/truyen/${book.id}`)}
            buttonStyle={{ padding: 8 }}
          />
          <VectorIcon name="chevron-right" font="FontAwesome5" size={12} />
        </>
      )}
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
    gap: 6,
  },
})
