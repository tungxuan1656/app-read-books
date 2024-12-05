import { Screen } from '@/components/Screen'
import { router, Stack } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { AppTypo } from '../../constants'
import { setReadingContext, useReading } from '../../controllers/context'
import { getBook, getFolderBooks, showToastError } from '@/utils'

const References = () => {
  const reading = useReading()
  const [book, setBook] = useState<Book>()
  const refList = useRef<FlatList | null>(null)

  useEffect(() => {
    getBook(getFolderBooks() + reading.currentBook)
      .then((b) => {
        if (b) setBook(b)
      })
      .catch(showToastError)
  }, [reading])

  useEffect(() => {
    const references = book?.references ?? []
    const currentChapter = reading.books[reading.currentBook]
    setTimeout(() => {
      if (
        Array.isArray(references) &&
        references.length > 0 &&
        currentChapter - 1 < references.length - 1
      ) {
        refList.current?.scrollToIndex({ animated: true, index: currentChapter - 1 })
      }
    }, 500)
  }, [reading, book])

  const setChapter = (chapter: number) => {
    const books = { ...reading.books }
    books[reading.currentBook] = chapter
    setReadingContext({ ...reading, books })
    router.back()
  }

  return (
    <Screen.Container>
      <Stack.Screen
        options={{ title: 'Mục lục', headerBackTitleVisible: false, headerShown: true }}
      />
      <Screen.Content>
        <FlatList
          ref={refList}
          data={book?.references ?? []}
          contentContainerStyle={{ paddingVertical: 20 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity key={item} style={styles.item} onPress={() => setChapter(index + 1)}>
              <Text
                numberOfLines={1}
                style={[
                  AppTypo.body.regular,
                  reading.books[reading.currentBook] === index + 1 && AppTypo.body.semiBold,
                ]}>
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
