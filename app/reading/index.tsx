import { Screen } from '@/components/Screen'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { VectorIcon } from '@/components/Icon'
import { AppPalette } from '../../assets'
import { router, useLocalSearchParams } from 'expo-router'
import { getBookChapterContent, getChapterHtml, showToastError } from '../../utils'
import { setReadingContext, useReading } from '../../controllers/context'
import SheetBookInfo from '@/components/SheetBookInfo'
import RenderHTML from 'react-native-render-html'
import { AppConst } from '@/constants'

const Reading = () => {
  const params = useLocalSearchParams<{ bookId: string }>()
  const refTimeout = useRef<NodeJS.Timeout>()
  const refTimeoutSave = useRef<NodeJS.Timeout>()
  const [chapterContent, setChapterContent] = useState('')
  const [visibleSheet, setVisibleSheet] = useState(false)
  const reading = useReading()
  const bookId = reading.currentBook
  const refScroll = useRef<ScrollView | null>(null)

  const chapterHtml = useMemo(() => {
    return getChapterHtml(chapterContent)
  }, [chapterContent, reading])

  useEffect(() => {
    const newId = params.bookId ? params.bookId : reading.currentBook
    if (!reading.books[newId]?.chapter) {
      const books = { ...reading.books }
      books[newId] = { chapter: 1, offset: 0 }
      setReadingContext({
        ...reading,
        isReading: true,
        currentBook: newId,
        books,
      })
    } else {
      setReadingContext({
        ...reading,
        isReading: true,
        currentBook: newId,
      })
    }

    return () => {
      setReadingContext({ ...reading, isReading: false })
    }
  }, [])

  useEffect(() => {
    const book = reading.currentBook
    const chapter = reading.books[book]?.chapter
    if (chapter) {
      getBookChapterContent(reading.currentBook, chapter)
        .then((c) => setChapterContent(c))
        .catch(showToastError)
    }
  }, [reading])

  useEffect(() => {
    setTimeout(() => {
      const offset = reading.books[reading.currentBook]?.offset
      if (offset) {
        refScroll.current?.scrollTo({ y: offset, animated: false })
      }
    }, 500)
  }, [])

  const nextChapter = () => {
    clearTimeout(refTimeout.current)
    refTimeout.current = setTimeout(() => {
      const books = { ...reading.books }
      books[reading.currentBook].chapter = books[reading.currentBook].chapter + 1
      setReadingContext({ ...reading, books })
      refScroll.current?.scrollTo({ y: 0, animated: false })
    }, 500)
  }
  const previousChapter = () => {
    clearTimeout(refTimeout.current)
    refTimeout.current = setTimeout(() => {
      const books = { ...reading.books }
      books[reading.currentBook].chapter = Math.max(books[reading.currentBook].chapter - 1, 0)
      setReadingContext({ ...reading, books })
    }, 500)
  }

  const saveOffset = (offset: number) => {
    clearTimeout(refTimeoutSave.current)
    refTimeoutSave.current = setTimeout(() => {
      const books = { ...reading.books }
      if (books[reading.currentBook].offset !== offset) {
        books[reading.currentBook].offset = offset
        setReadingContext({ ...reading, books })
      }
    }, 500)
  }

  return (
    <Screen.Container safe={'all'} style={{ backgroundColor: '#F5F1E5' }}>
      <ScrollView
        style={{ flex: 1 }}
        ref={refScroll}
        scrollEventThrottle={300}
        onScroll={(event) => {
          const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent
          const offset = Math.round(contentOffset.y + layoutMeasurement.height)
          const contentHeight = Math.round(contentSize.height)
          saveOffset(contentOffset.y)
          console.log(contentOffset.y)
          if (offset > contentHeight + 100) nextChapter()
          if (contentOffset.y < -100) previousChapter()
        }}>
        <ContentDisplay
          chapterHtml={chapterHtml}
          font={reading.font}
          line={reading.line}
          size={reading.size}
        />
      </ScrollView>
      <VectorIcon
        name="circle-chevron-left"
        font="FontAwesome6"
        size={20}
        buttonStyle={{ ...styles.buttonBack }}
        color={AppPalette.gray400}
        onPress={router.back}
      />
      <VectorIcon
        name="book"
        font="FontAwesome6"
        size={24}
        buttonStyle={{ ...styles.buttonInfo }}
        color={AppPalette.gray600}
        onPress={() => setVisibleSheet(true)}
      />
      <SheetBookInfo
        bookId={bookId}
        isVisible={visibleSheet}
        onClose={() => setVisibleSheet(false)}
      />
    </Screen.Container>
  )
}

export default Reading

const ContentDisplay = React.memo(
  ({
    chapterHtml,
    font,
    line,
    size,
  }: {
    chapterHtml: string
    font: string
    line: number
    size: number
  }) => {
    return (
      <RenderHTML
        source={{ html: chapterHtml, baseUrl: '' }}
        baseStyle={{ flex: 1, marginHorizontal: 16 }}
        contentWidth={AppConst.windowWidth() - 32}
        systemFonts={[
          'Inter-Regular',
          'Montserrat-Regular',
          'NotoSans-Regular',
          'OpenSans-Regular',
          'Raleway-Regular',
          'Roboto-Regular',
          'SpaceMono-Regular',
          'WorkSans-Regular',
        ]}
        tagsStyles={{
          body: { fontFamily: font, lineHeight: size * line, fontSize: size },
          h2: { fontSize: size * 1.5 },
        }}
      />
    )
  },
)

const styles = StyleSheet.create({
  buttonInfo: {
    width: 44,
    height: 44,
    borderRadius: 40,
    backgroundColor: AppPalette.gray100,
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  buttonBack: {
    width: 44,
    height: 44,
    borderRadius: 40,
    position: 'absolute',
    left: 10,
  },
})
