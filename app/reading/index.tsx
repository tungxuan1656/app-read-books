import { ContentDisplay } from '@/components/ContentDisplay'
import { VectorIcon } from '@/components/Icon'
import ReviewBottomSheet, { ReviewBottomSheetRef } from '@/components/ReviewBottomSheet'
import { Screen } from '@/components/Screen'
import SheetBookInfo from '@/components/SheetBookInfo'
import { AppConst, AppStyles, AppTypo, MMKVKeys } from '@/constants'
import { MMKVStorage } from '@/controllers/mmkv'
import { useTypedLocalSearchParams } from '@/hooks/use-typed-local-search-params'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  DeviceEventEmitter,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppPalette } from '../../assets'
import { setReadingContext, useBookInfo, useReading } from '../../controllers/context'
import { getBookChapterContent, getChapterHtml, showToastError } from '../../utils'

const Reading = () => {
  const insets = useSafeAreaInsets()
  const params = useTypedLocalSearchParams<{ bookId: string }>({ bookId: 'string' })
  const refTimeout = useRef<number | undefined>(undefined)
  const refTimeoutSave = useRef<number | undefined>(undefined)
  const [chapterContent, setChapterContent] = useState('')
  const [visibleSheet, setVisibleSheet] = useState(false)
  const reading = useReading()
  const bookId = reading.currentBook
  const refScroll = useRef<ScrollView | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const reviewBottomSheetRef = useRef<ReviewBottomSheetRef>(null)

  const bookInfo = useBookInfo(bookId)

  const currentChapter = useMemo(() => {
    if (bookInfo && reading.books) {
      const bookId = reading.currentBook
      const chapter = reading.books[bookId] ?? 1
      return bookInfo.references?.[chapter - 1]
    }
  }, [bookInfo, reading])

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
    }, 150)
  }, [])

  const openReviewBottomSheet = useCallback(() => {
    reviewBottomSheetRef.current?.present({
      content: chapterContent,
      bookId: bookId,
      chapterNumber: reading.books[reading.currentBook],
    })
  }, [chapterContent, bookId, reading])

  return (
    <Screen.Container safe={'top'} style={{ backgroundColor: '#F5F1E5' }}>
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
          <ContentDisplay chapterHtml={chapterHtml} onLoaded={onLoaded} />
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
        buttonStyle={{ ...styles.buttonInfo, bottom: 12 + insets.bottom }}
        color={AppPalette.gray600}
        onPress={() => setVisibleSheet(true)}
      />
      <VectorIcon
        name="wand-magic-sparkles"
        font="FontAwesome6"
        size={18}
        buttonStyle={{ ...styles.buttonInfo, bottom: 12 + 40 + 8 + insets.bottom }}
        color={AppPalette.gray600}
        onPress={openReviewBottomSheet}
      />
      <SheetBookInfo
        bookId={bookId}
        isVisible={visibleSheet}
        onClose={() => setVisibleSheet(false)}
      />
      <ReviewBottomSheet ref={reviewBottomSheetRef} onClose={() => {}} />
    </Screen.Container>
  )
}

export default Reading

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
