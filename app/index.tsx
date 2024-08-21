import { router } from 'expo-router'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useEffect, useState } from 'react'
import { Divider, Screen } from '@/components/Screen'
import { Button } from '@/components/Button'
import { AppTypo } from '../constants'
import { readFolderBooks } from '../utils'
import { GToast } from '@/components/GToast'
import { VectorIcon } from '@/components/Icon'

export default function Home() {
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    readFolderBooks()
      .then((output) => setBooks(output))
      .catch((error) => GToast.error({ message: JSON.stringify(error) }))
  }, [])

  const onSelectBook = (book: Book) => {
    router.navigate({ pathname: '/reading', params: { bookId: book.id } })
  }

  return (
    <Screen.Container safe={'all'}>
      <Text style={[AppTypo.h2.semiBold, { margin: 16 }]}>{'Danh sách truyện'}</Text>
      <Divider />
      <Screen.Content
        style={{ paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingVertical: 0 }}>
        <FlatList
          data={books}
          ItemSeparatorComponent={() => <Divider style={{ marginLeft: 64 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              key={item.name}
              onPress={() => onSelectBook(item)}>
              <View style={{ gap: 4 }}>
                <Text style={[AppTypo.headline.medium]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[AppTypo.caption.regular]}>
                  {`${item.author || '#'} - ${item.count} chương`}
                </Text>
              </View>
              <VectorIcon name="chevron-right" font="FontAwesome5" />
            </TouchableOpacity>
          )}
        />
      </Screen.Content>
      <Button
        title={'Thêm truyện mới'}
        style={{ marginHorizontal: 16 }}
        onPress={() => router.navigate('/add-book')}
      />
    </Screen.Container>
  )
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    height: 80,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})