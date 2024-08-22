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
import { AppConst, MMKVKeys } from '@/constants'
import { MMKVStorage } from '@/controllers/mmkv'

const Reading = () => {
  const params = useLocalSearchParams<{ bookId: string }>()
  const refTimeout = useRef<NodeJS.Timeout>()
  const refTimeoutSave = useRef<NodeJS.Timeout>()
  const [chapterContent, setChapterContent] = useState('')
  const [visibleSheet, setVisibleSheet] = useState(false)
  const reading = useReading()
  const bookId = reading.currentBook
  const refScroll = useRef<ScrollView | null>(null)
  const [font, setFont] = useState(MMKVStorage.get(MMKVKeys.CURRENT_FONT) ?? 'Inter-Regular')
  const [fontSize, setFontSize] = useState(MMKVStorage.get(MMKVKeys.CURRENT_FONT_SIZE) ?? 24)
  const [lineHeight, setLineHeight] = useState(MMKVStorage.get(MMKVKeys.CURRENT_LINE_HEIGHT) ?? 1.5)

  useEffect(() => {
    MMKVStorage.set(MMKVKeys.CURRENT_FONT, font)
  }, [font])

  useEffect(() => {
    MMKVStorage.set(MMKVKeys.CURRENT_FONT_SIZE, fontSize)
  }, [fontSize])

  useEffect(() => {
    MMKVStorage.set(MMKVKeys.CURRENT_LINE_HEIGHT, lineHeight)
  }, [lineHeight])

  const chapterHtml = useMemo(() => {
    if (!chapterContent) return ''
    return getChapterHtml(chapterContent)
  }, [chapterContent])

  useEffect(() => {
    const newId = params.bookId ? params.bookId : reading.currentBook
    if (!reading.books[newId]) {
      const books = { ...reading.books }
      books[newId] = 1
      setReadingContext({
        currentBook: newId,
        books,
      })
    } else {
      setReadingContext({
        ...reading,
        currentBook: newId,
      })
    }

    MMKVStorage.set(MMKVKeys.IS_READING, true)

    return () => {
      MMKVStorage.set(MMKVKeys.IS_READING, false)
    }
  }, [])

  useEffect(() => {
    const book = reading.currentBook
    const chapter = reading.books[book] ?? 1
    if (chapter) {
      getBookChapterContent(reading.currentBook, chapter)
        .then((c) => setChapterContent(c))
        .catch(showToastError)
    }
  }, [reading])

  useEffect(() => {
    setTimeout(() => {
      const offset = MMKVStorage.get(MMKVKeys.CURRENT_READING_OFFSET)
      if (offset) {
        refScroll.current?.scrollTo({ y: offset, animated: false })
      }
    }, 500)
  }, [])

  const nextChapter = () => {
    clearTimeout(refTimeout.current)
    refTimeout.current = setTimeout(() => {
      const books = { ...reading.books }
      books[reading.currentBook] = books[reading.currentBook] + 1
      setReadingContext({ ...reading, books })
      refScroll.current?.scrollTo({ y: 0, animated: false })
    }, 500)
  }
  const previousChapter = () => {
    clearTimeout(refTimeout.current)
    refTimeout.current = setTimeout(() => {
      const books = { ...reading.books }
      books[reading.currentBook] = Math.max(books[reading.currentBook] - 1, 0)
      setReadingContext({ ...reading, books })
    }, 500)
  }

  const saveOffset = (offset: number) => {
    clearTimeout(refTimeoutSave.current)
    refTimeoutSave.current = setTimeout(() => {
      MMKVStorage.set(MMKVKeys.CURRENT_READING_OFFSET, offset)
    }, 500)
  }

  return (
    <Screen.Container safe={'all'} style={{ backgroundColor: '#F5F1E5' }}>
      <ScrollView
        style={{ flex: 1 }}
        ref={refScroll}
        scrollEventThrottle={300}
        contentContainerStyle={{ paddingVertical: 44 }}
        onScroll={(event) => {
          const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent
          const offset = Math.round(contentOffset.y + layoutMeasurement.height)
          const contentHeight = Math.round(contentSize.height)
          saveOffset(contentOffset.y)
          if (offset > contentHeight + 60) nextChapter()
          if (contentOffset.y < -60) previousChapter()
        }}>
        {chapterHtml !== '' ? (
          <ContentDisplay
            chapterHtml={chapterHtml}
            font={font}
            lineHeight={lineHeight}
            fontSize={fontSize}
          />
        ) : null}
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
        font={font}
        setFont={setFont}
        fontSize={fontSize}
        setFontSize={setFontSize}
        lineHeight={lineHeight}
        setLineHeight={setLineHeight}
      />
    </Screen.Container>
  )
}

export default Reading

const ContentDisplay = React.memo(
  ({
    chapterHtml,
    font,
    lineHeight,
    fontSize,
  }: {
    chapterHtml: string
    font: string
    lineHeight: number
    fontSize: number
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
          body: { fontFamily: font, lineHeight: fontSize * lineHeight, fontSize: fontSize },
          h2: { fontSize: fontSize * 1.5 },
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
