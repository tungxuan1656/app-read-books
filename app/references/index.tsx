import { Divider, Screen } from '@/components/screen-2'
import { router } from 'expo-router'
import React, { useLayoutEffect, useRef } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { AppTypo } from '../../constants'
import useAppStore, { storeActions } from '@/controllers/store'
import { VectorIcon } from '@/components/icon'
import { AppPalette } from '@/assets'

const References = () => {
  const refList = useRef<FlatList | null>(null)
  const bookId = useAppStore((s) => s.reading.bookId)
  const book = useAppStore((s) => s.id2Book[bookId])
  const currentIndex = useAppStore((s) => s.id2BookReadingChapter[bookId] ?? 0)

  useLayoutEffect(() => {
    const references = book?.references ?? []
    if (
      Array.isArray(references) &&
      references.length > 0 &&
      currentIndex - 1 < references.length - 1
    ) {
      refList.current?.scrollToIndex({ animated: false, index: currentIndex - 1 })
    }
  }, [book, currentIndex])

  const setChapter = (chapter: number) => {
    storeActions.updateReadingChapter(bookId, chapter)
    router.back()
  }

  return (
    <Screen.Container safe="all">
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <VectorIcon
          name="angle-left"
          font="FontAwesome6"
          size={16}
          buttonStyle={{ width: 44, height: 44 }}
          color={AppPalette.gray600}
          onPress={() => router.back()}
        />
        <Text style={[AppTypo.h3.semiBold, { marginLeft: 4 }]}>{'Mục lục'}</Text>
      </View>
      <Divider />
      <Screen.Content>
        <FlatList
          ref={refList}
          data={book?.references ?? []}
          contentContainerStyle={{ paddingVertical: 20 }}
          initialScrollIndex={currentIndex - 1}
          renderItem={({ item, index }) => (
            <TouchableOpacity key={item} style={styles.item} onPress={() => setChapter(index + 1)}>
              <Text
                numberOfLines={1}
                style={[AppTypo.body.regular, currentIndex === index + 1 && AppTypo.body.semiBold]}>
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

const styles = StyleSheet.create({
  item: {
    height: 36,
    paddingHorizontal: 12,
  },
  textSelected: {},
})
