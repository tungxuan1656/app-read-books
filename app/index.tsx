import { router, useFocusEffect } from 'expo-router'
import React, { useCallback } from 'react'
import { FlatList, type ListRenderItem, Text, View } from 'react-native'

import { AppColors } from '@/assets'
import { Divider } from '@/components/divider'
import { GToast } from '@/components/g-toast'
import HomeBookItem, { useBookActions } from '@/components/home-book-item'
import {
  ItemSwipeable,
  SwipeableAction,
  ViewSwipeable,
} from '@/components/item-swipeable'
import { Screen } from '@/components/screen'
import { VectorIcon } from '@/components/vector-icon'
import { booksActions, useBooksStore } from '@/controllers/stores'

import { readFolderBooks } from '../utils'

const BookItemWithSwipe = React.memo(
  ({ id, onDeleteSuccess }: { id: string; onDeleteSuccess: () => void }) => {
    const { onDeleteBook, onOpenInfo } = useBookActions(id, onDeleteSuccess)

    const renderActions = useCallback(
      (_item: any, cb?: () => void) => (
        <ViewSwipeable>
          <SwipeableAction
            icon='circle-info'
            iconFont='FontAwesome6'
            title='Info'
            backgroundColor={AppColors.blue500}
            onPress={() => {
              cb?.()
              onOpenInfo()
            }}
            item={id}
          />
          <SwipeableAction
            icon='delete'
            iconFont='Feather'
            title='Xóa'
            backgroundColor={AppColors.red500}
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
  const bookIds = useBooksStore.use.bookIds()

  const refetch = useCallback(() => {
    readFolderBooks()
      .then((output) => {
        output.sort((a, b) => a.name.localeCompare(b.name))
        booksActions.updateBooks(output)
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
      <View className='flex-row items-center justify-between gap-2'>
        <Text className='ml-4 text-lg font-semibold'>{'Danh sách truyện'}</Text>
        <View className='flex-row items-center'>
          <VectorIcon
            name='settings'
            font='MaterialIcons'
            size={16}
            buttonStyle={{ marginLeft: 8, width: 32, height: 44 }}
            color={AppColors.gray600}
            onPress={() => router.push('/settings')}
          />
          <VectorIcon
            name='plus'
            font='FontAwesome6'
            size={16}
            buttonStyle={{
              marginLeft: 8,
              width: 32,
              height: 44,
              marginRight: 12,
            }}
            color={AppColors.gray600}
            onPress={() => router.push('/add-book')}
          />
        </View>
      </View>
      <Divider />
      <Screen.Content contentContainerStyle={{ paddingVertical: 0 }}>
        <FlatList
          data={bookIds}
          ItemSeparatorComponent={Divider}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80, flexGrow: 1 }}
          keyExtractor={(item) => item}
          ListEmptyComponent={
            <View className='items-center justify-center pt-[100px]'>
              <Text className='mx-5 text-sm font-normal text-gray-700'>
                {'Nhấn vào dấu + để thêm truyện nhé!'}
              </Text>
            </View>
          }
        />
      </Screen.Content>
    </Screen.Container>
  )
}
