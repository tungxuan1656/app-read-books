import { router, useFocusEffect } from 'expo-router'
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useCallback, useState } from 'react'
import { Divider, Screen } from '@/components/Screen'
import { Button } from '@/components/Button'
import { AppTypo } from '../constants'
import { deleteBook, getFolderBooks, readFolderBooks } from '../utils'
import { GToast } from '@/components/GToast'
import { VectorIcon } from '@/components/Icon'
import { AppPalette } from '@/assets'
import useAppStore from '../controllers/store'

export default function Home() {
  const books = useAppStore((state) => state.books)
  const setGlobalBooks = useAppStore((state) => state.setBooks)

  useFocusEffect(
    useCallback(() => {
      readFolderBooks()
        .then((output) => {
          output.sort((a, b) => a.name.localeCompare(b.name))
          setGlobalBooks(output)
        })
        .catch((error) => GToast.error({ message: JSON.stringify(error) }))
    }, [setGlobalBooks]),
  )

  const onSelectBook = (book: Book) => {
    router.push({ pathname: '/reading', params: { bookId: book.id } })
  }

  const onLongSelectBook = (book: Book) => {
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
  }

  return (
    <Screen.Container safe={'all'}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          justifyContent: 'space-between',
        }}>
        <Text style={[AppTypo.h3.semiBold, { marginLeft: 16 }]}>{'Danh sách truyện'}</Text>
        <VectorIcon
          name="plus"
          font="FontAwesome6"
          size={16}
          buttonStyle={{ marginLeft: 8, width: 44, height: 44 }}
          color={AppPalette.gray600}
          onPress={() => router.push('/add-book')}
        />
      </View>
      <Divider />
      <Screen.Content style={{}} contentContainerStyle={{ paddingVertical: 0 }}>
        <FlatList
          data={books}
          ItemSeparatorComponent={() => <Divider />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              key={item.name}
              onLongPress={() => onLongSelectBook(item)}
              onPress={() => onSelectBook(item)}>
              <View style={{ gap: 4, flex: 1 }}>
                <Text style={[AppTypo.body.medium]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[AppTypo.caption.regular, { color: AppPalette.gray700 }]}>
                  {`${item.author || '#'} - ${item.count} chương`}
                </Text>
              </View>
              <VectorIcon name="chevron-right" font="FontAwesome5" size={12} />
            </TouchableOpacity>
          )}
          ListFooterComponent={<View style={{ height: 44 }} />}
        />
      </Screen.Content>
    </Screen.Container>
  )
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    height: 72,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
})
