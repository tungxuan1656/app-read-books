import { AppPalette } from '@/assets'
import { GToast } from '@/components/g-toast'
import HomeBookItem from '@/components/home-book-item'
import { VectorIcon } from '@/components/Icon'
import { Divider, Screen } from '@/components/Screen'
import { router, useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import { FlatList, ListRenderItem, Text, View } from 'react-native'
import { AppTypo } from '../constants'
import useAppStore, { storeActions } from '../controllers/store'
import { readFolderBooks } from '../utils'
import { Button } from '@/components/Button'

export default function Home() {
  const bookIds = useAppStore((state) => state.bookIds)
  const isEditingBook = useAppStore((state) => state.isEditingBook)

  const refetch = useCallback(() => {
    readFolderBooks()
      .then((output) => {
        output.sort((a, b) => a.name.localeCompare(b.name))
        storeActions.updateBooks(output)
      })
      .catch((error) => GToast.error({ message: JSON.stringify(error) }))
  }, [])

  useFocusEffect(refetch)

  const renderItem: ListRenderItem<string> = useCallback(
    ({ item }) => <HomeBookItem id={item} onDeleteSuccess={refetch} />,
    [],
  )

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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <VectorIcon
            name="file-edit"
            font="MaterialCommunityIcons"
            size={16}
            buttonStyle={{ marginLeft: 8, width: 32, height: 44 }}
            color={AppPalette.gray600}
            onPress={() => storeActions.setIsEditingBook(!isEditingBook)}
          />
          <VectorIcon
            name="settings"
            font="MaterialIcons"
            size={16}
            buttonStyle={{ marginLeft: 8, width: 32, height: 44 }}
            color={AppPalette.gray600}
            onPress={() => router.push('/settings')}
          />
          <VectorIcon
            name="plus"
            font="FontAwesome6"
            size={16}
            buttonStyle={{ marginLeft: 8, width: 32, height: 44, marginRight: 12 }}
            color={AppPalette.gray600}
            onPress={() => router.push('/add-book')}
          />
        </View>
      </View>
      <Divider />
      <Screen.Content style={{}} contentContainerStyle={{ paddingVertical: 0 }}>
        <FlatList
          data={bookIds}
          ItemSeparatorComponent={Divider}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
          keyExtractor={(item) => item}
        />
      </Screen.Content>
      {isEditingBook ? (
        <Screen.Footer>
          <Button
            title={'Xong'}
            onPress={() => storeActions.setIsEditingBook(false)}
            style={{ flex: 1 }}
          />
        </Screen.Footer>
      ) : null}
    </Screen.Container>
  )
}
