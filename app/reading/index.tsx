import { Screen } from '@/components/Screen'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  DeviceEventEmitter,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { VectorIcon } from '@/components/Icon'
import { AppPalette } from '../../assets'
import { router, useLocalSearchParams } from 'expo-router'
import { getBookChapterContent, getChapterHtml, showToastError } from '../../utils'
import { setReadingContext, useBookInfo, useReading } from '../../controllers/context'
import SheetBookInfo from '@/components/SheetBookInfo'
import RenderHTML from 'react-native-render-html'
import { AppConst, AppStyles, AppTypo, MMKVKeys } from '@/constants'
import { MMKVStorage } from '@/controllers/mmkv'
import PlayTTS, { PlayTTSRef } from './PlayTTS'

const Reading = () => {
  const params = useLocalSearchParams<{ bookId: string }>()
  const refTimeout = useRef<number | undefined>(undefined)
  const refTimeoutSave = useRef<number | undefined>(undefined)
  const [chapterContent, setChapterContent] = useState('')
  const [visibleSheet, setVisibleSheet] = useState(false)
  const reading = useReading()
  const bookId = reading.currentBook
  const refScroll = useRef<ScrollView | null>(null)
  const [font, setFont] = useState(MMKVStorage.get(MMKVKeys.CURRENT_FONT) ?? 'Inter-Regular')
  const [fontSize, setFontSize] = useState(MMKVStorage.get(MMKVKeys.CURRENT_FONT_SIZE) ?? 24)
  const [lineHeight, setLineHeight] = useState(MMKVStorage.get(MMKVKeys.CURRENT_LINE_HEIGHT) ?? 1.5)
  const [isLoading, setIsLoading] = useState(true)
  const [showPlayer, setShowPlayer] = useState(false)
  const refPlayTTS = useRef<PlayTTSRef | undefined>(undefined)

  const bookInfo = useBookInfo(bookId)

  const currentChapter = useMemo(() => {
    if (bookInfo && reading.books) {
      const bookId = reading.currentBook
      const chapter = reading.books[bookId] ?? 1
      return bookInfo.references?.[chapter - 1]
    }
  }, [bookInfo, reading])

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
    if (chapter && reading.currentBook) {
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
    }, 200)
  }, [])

  useEffect(() => {
    const e1 = DeviceEventEmitter.addListener('READING_SCROLL_TO_BOTTOM', () => {
      refScroll.current?.scrollToEnd({ animated: true })
    })

    return () => {
      e1.remove()
    }
  }, [])

  const nextChapter = () => {
    refPlayTTS.current?.hide?.()
    clearTimeout(refTimeout.current)
    refTimeout.current = setTimeout(() => {
      setIsLoading(true)
      const books = { ...reading.books }
      books[reading.currentBook] = books[reading.currentBook] + 1
      setReadingContext({ ...reading, books })
      refScroll.current?.scrollTo({ y: 0, animated: false })
    }, 500)
  }
  const previousChapter = () => {
    refPlayTTS.current?.hide?.()
    clearTimeout(refTimeout.current)
    refTimeout.current = setTimeout(() => {
      setIsLoading(true)
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

  const onLoaded = useCallback(() => {
    setTimeout(() => {
      setIsLoading(false)
      refPlayTTS.current?.hide?.()
    }, 150)
  }, [])

  return (
    <Screen.Container safe={'all'} style={{ backgroundColor: '#F5F1E5' }}>
      <Text style={[AppTypo.mini.regular, { marginHorizontal: 16 }]} numberOfLines={1}>
        {currentChapter}
      </Text>
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
          if (offset > contentHeight + 30) nextChapter()
          if (contentOffset.y < -40) previousChapter()
        }}>
        {chapterHtml !== '' ? (
          <ContentDisplay
            chapterHtml={chapterHtml}
            font={font}
            lineHeight={lineHeight}
            fontSize={fontSize}
            onLoaded={onLoaded}
          />
        ) : null}
      </ScrollView>
      {isLoading ? (
        <View style={[styles.viewLoading, AppStyles.view.absoluteFill]}>
          <ActivityIndicator />
        </View>
      ) : null}
      <VectorIcon
        name="circle-chevron-left"
        font="FontAwesome6"
        size={22}
        buttonStyle={{ ...styles.buttonBack }}
        color={AppPalette.gray400}
        onPress={router.back}
      />
      <View style={styles.viewNavigate}>
        <VectorIcon
          name="arrow-left"
          font="FontAwesome6"
          size={14}
          buttonStyle={{ width: 28, height: 28 }}
          color={AppPalette.white}
          onPress={previousChapter}
        />
        <VectorIcon
          name="arrow-right"
          font="FontAwesome6"
          size={14}
          buttonStyle={{ width: 28, height: 28 }}
          color={AppPalette.white}
          onPress={nextChapter}
        />
      </View>
      <VectorIcon
        name="book"
        font="FontAwesome6"
        size={18}
        buttonStyle={{ ...styles.buttonInfo }}
        color={AppPalette.gray600}
        onPress={() => setVisibleSheet(true)}
      />
      <VectorIcon
        name={showPlayer ? 'stop' : 'play'}
        font="FontAwesome6"
        size={18}
        buttonStyle={{ ...styles.buttonInfo, bottom: 12 + 40 + 8 }}
        color={AppPalette.gray600}
        onPress={() => (showPlayer ? refPlayTTS.current?.hide?.() : refPlayTTS.current?.show?.())}
      />
      <VectorIcon
        name="wand-magic-sparkles"
        font="FontAwesome6"
        size={18}
        buttonStyle={{ ...styles.buttonInfo, bottom: 12 + 40 + 8 + 40 + 8 }}
        color={AppPalette.gray600}
        onPress={() =>
          router.push(
            `/reading/review?bookId=${bookId}&chapter=${reading.books[reading.currentBook]}`,
          )
        }
      />
      <PlayTTS
        name={bookId + reading.books[reading.currentBook]}
        chapterHtml={chapterHtml}
        innerRef={refPlayTTS}
        onChange={setShowPlayer}
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
    onLoaded,
  }: {
    chapterHtml: string
    font: string
    lineHeight: number
    fontSize: number
    onLoaded: () => void
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
        onHTMLLoaded={onLoaded}
      />
    )
  },
)

const styles = StyleSheet.create({
  buttonInfo: {
    width: 40,
    height: 40,
    borderRadius: 40,
    backgroundColor: AppPalette.gray100,
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
  buttonBack: {
    width: 44,
    height: 44,
    borderRadius: 40,
    position: 'absolute',
    left: 10,
    top: 12,
  },
  viewNavigate: {
    flexDirection: 'row',
    height: 28,
    paddingHorizontal: 2,
    position: 'absolute',
    right: 10,
    top: 16,
    backgroundColor: AppPalette.gray400,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewLoading: {
    height: AppConst.windowHeight(),
    backgroundColor: '#F5F1E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
