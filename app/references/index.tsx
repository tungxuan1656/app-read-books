import { Screen } from '@/components/Screen'
import { getCurrentBookId } from '@/utils'
import { router, Stack } from 'expo-router'
import React, { useEffect, useRef } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { AppTypo } from '../../constants'
import useAppStore, { storeActions } from '@/controllers/store'

const References = () => {
  const refList = useRef<FlatList | null>(null)
  const book = useAppStore((s) => s.id2Book[getCurrentBookId()])
  const currentIndex = useAppStore((s) => s.id2BookReadingChapter[getCurrentBookId()] ?? 0)

  useEffect(() => {
    const references = book?.references ?? []

    setTimeout(() => {
      if (
        Array.isArray(references) &&
        references.length > 0 &&
        currentIndex - 1 < references.length - 1
      ) {
        refList.current?.scrollToIndex({ animated: true, index: currentIndex - 1 })
      }
    }, 500)
  }, [book, currentIndex])

  const setChapter = (chapter: number) => {
    storeActions.updateReadingChapter(getCurrentBookId(), chapter)
    router.back()
  }

  return (
    <Screen.Container>
      <Stack.Screen options={{ title: 'Mục lục', headerShown: true }} />
      <Screen.Content>
        <FlatList
          ref={refList}
          data={book?.references ?? []}
          contentContainerStyle={{ paddingVertical: 20 }}
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
