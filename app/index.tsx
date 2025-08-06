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

export default function Home() {
  const bookIds = useAppStore((state) => state.bookIds)

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
          data={bookIds}
          ItemSeparatorComponent={Divider}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
          keyExtractor={(item) => item}
        />
      </Screen.Content>
    </Screen.Container>
  )
}
