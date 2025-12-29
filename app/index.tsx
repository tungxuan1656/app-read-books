import { AppColors, AppPalette } from '@/assets'
import { GToast } from '@/components/g-toast'
import HomeBookItem, { useBookActions } from '@/components/home-book-item'
import { VectorIcon } from '@/components/icon'
import { ItemSwipeable, SwipeableAction, ViewSwipeable } from '@/components/item-swipeable'
import { Divider, Screen } from '@/components/screen-2'
import { router, useFocusEffect } from 'expo-router'
import React, { useCallback } from 'react'
import { FlatList, ListRenderItem, Text, View } from 'react-native'
import { AppTypo } from '../constants'
import useAppStore, { storeActions } from '../controllers/store'
import { readFolderBooks } from '../utils'

const BookItemWithSwipe = React.memo(
  ({ id, onDeleteSuccess }: { id: string; onDeleteSuccess: () => void }) => {
    const { onDeleteBook, onOpenInfo } = useBookActions(id, onDeleteSuccess)

    const renderActions = useCallback(
      (_item: any, cb?: () => void) => (
        <ViewSwipeable>
          <SwipeableAction
            icon="circle-info"
            iconFont="FontAwesome6"
            title="Info"
            backgroundColor={AppPalette.blue500}
            onPress={() => {
              cb?.()
              onOpenInfo()
            }}
            item={id}
          />
          <SwipeableAction
            icon="delete"
            iconFont="Feather"
            title="Xóa"
            backgroundColor={AppPalette.red500}
            onPress={() => {
              cb?.()
              onDeleteBook()
            }}
            item={id}
          />
        </ViewSwipeable>
      ),
      [id, onDeleteBook, onOpenInfo],
    )

    return (
      <ItemSwipeable item={id} renderActions={renderActions}>
        <HomeBookItem id={id} onDeleteSuccess={onDeleteSuccess} />
      </ItemSwipeable>
    )
  },
)

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
    ({ item }) => <BookItemWithSwipe id={item} onDeleteSuccess={refetch} />,
    [refetch],
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
        <Text style={[AppTypo.h4.semiBold, { marginLeft: 16 }]}>{'Danh sách truyện'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
          contentContainerStyle={{ paddingBottom: 80, flexGrow: 1 }}
          keyExtractor={(item) => item}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 100 }}>
              <Text style={[AppTypo.body.regular, { marginHorizontal: 20, color: AppColors.textExtra }]}>
                {'Nhấn vào dấu + để thêm truyện nhé!'}
              </Text>
            </View>
          }
        />
      </Screen.Content>
    </Screen.Container>
  )
}
