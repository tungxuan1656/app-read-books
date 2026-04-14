import { router } from 'expo-router'
import React, { useRef } from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'

import { AppColors } from '@/assets'
import { Divider } from '@/components/divider'
import { Screen } from '@/components/screen'
import { VectorIcon } from '@/components/vector-icon'
import {
  booksActions,
  useBooksStore,
  useReadingStore,
} from '@/controllers/stores'

const References = () => {
  const refList = useRef<FlatList | null>(null)
  const bookId = useReadingStore.use.reading().bookId
  const book = useBooksStore((s) => s.id2Book[bookId])
  const currentIndex = useBooksStore(
    (s) => s.id2BookReadingChapter[bookId] ?? 0,
  )

  const setChapter = (chapter: number) => {
    booksActions.updateReadingChapter(bookId, chapter)
    router.back()
  }

  return (
    <Screen.Container safe='all'>
      <View className='flex-row items-center'>
        <VectorIcon
          name='angle-left'
          font='FontAwesome6'
          size={16}
          buttonStyle={{ width: 44, height: 44 }}
          color={AppColors.gray600}
          onPress={() => router.back()}
        />
        <Text className='ml-1 text-xl font-semibold'>{'Mục lục'}</Text>
      </View>
      <Divider />
      <Screen.Content>
        <FlatList
          ref={refList}
          data={book?.references ?? []}
          contentContainerStyle={{ paddingVertical: 20 }}
          initialScrollIndex={currentIndex - 1}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              key={item}
              className='px-3'
              style={{ height: 36 }}
              onPress={() => setChapter(index + 1)}>
              <Text
                numberOfLines={1}
                className={`text-base ${currentIndex === index + 1 ? 'font-semibold' : 'font-normal'}`}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          getItemLayout={(_, index) => ({
            length: 36,
            index,
            offset: index * 36,
          })}
        />
      </Screen.Content>
    </Screen.Container>
  )
}

export default References
