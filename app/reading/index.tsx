import { ContentDisplay } from '@/components/ContentDisplay'
import { VectorIcon } from '@/components/Icon'
import ReviewBottomSheet, { ReviewBottomSheetRef } from '@/components/ReviewBottomSheet'
import { Screen } from '@/components/Screen'
import SheetBookInfo, { SheetBookInfoRef } from '@/components/SheetBookInfo'
import { AppConst, AppStyles, AppTypo, MMKVKeys } from '@/constants'
import { MMKVStorage } from '@/controllers/mmkv'
import useAppStore from '@/controllers/store'
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
import { getBookChapterContent, getChapterHtml, showToastError } from '../../utils'
import useReadingActions from '@/hooks/use-reading-actions'
import useReadingContent from '@/hooks/use-reading-content'

const Reading = () => {
  const insets = useSafeAreaInsets()
  const params = useTypedLocalSearchParams<{ bookId: string }>({ bookId: 'string' })
  const [chapterContent, setChapterContent] = useState('')
  const sheetBookInfoRef = useRef<SheetBookInfoRef>(null)

  const { nextChapter, previousChapter, saveOffset, isLoading, onLoaded } = useReadingActions()
  const { currentChapterName, currentChapterContent } = useReadingContent()

  const { readingOptions: reading, updateReadingOptions } = useAppStore()
  const bookId = reading.currentBook

  const refScroll = useRef<ScrollView | null>(null)
  const reviewBottomSheetRef = useRef<ReviewBottomSheetRef>(null)

  useEffect(() => {
    const newId = params.bookId ? params.bookId : reading.currentBook
    if (!reading.books[newId]) {
      const books = { ...reading.books }
      books[newId] = 1
      updateReadingOptions({
        currentBook: newId,
        books,
      })
    } else {
      updateReadingOptions({
        currentBook: newId,
      })
    }

    MMKVStorage.set(MMKVKeys.IS_READING, true)
    return () => {
      MMKVStorage.set(MMKVKeys.IS_READING, false)
    }
  }, [params.bookId, updateReadingOptions]) // Only depend on params.bookId and updateReadingOptions

  useEffect(() => {
    const book = reading.currentBook
    const chapter = reading.books[book] ?? 1
    if (chapter && reading.currentBook) {
      getBookChapterContent(reading.currentBook, chapter)
        .then((c) => setChapterContent(c))
        .catch(showToastError)
    }
  }, [reading.currentBook, reading.books]) // Depend on specific reading properties

  // Load reading offset once when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      const offset = MMKVStorage.get(MMKVKeys.CURRENT_READING_OFFSET)
      if (offset) {
        refScroll.current?.scrollTo({ y: offset, animated: false })
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [])

  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent
      const offset = Math.round(contentOffset.y + layoutMeasurement.height)
      const contentHeight = Math.round(contentSize.height)
      saveOffset(contentOffset.y)
      if (offset > contentHeight + 30) nextChapter()
      if (contentOffset.y < -40) previousChapter()
    },
    [saveOffset, nextChapter, previousChapter],
  )

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
        {currentChapterName}
      </Text>
      <ScrollView
        style={{ flex: 1 }}
        ref={refScroll}
        scrollEventThrottle={300}
        contentContainerStyle={{ paddingVertical: 44 }}
        onScroll={handleScroll}>
        {currentChapterContent !== '' ? (
          <ContentDisplay chapterHtml={currentChapterContent} onLoaded={onLoaded} />
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
        onPress={() => sheetBookInfoRef.current?.present(bookId)}
      />
      <VectorIcon
        name="wand-magic-sparkles"
        font="FontAwesome6"
        size={18}
        buttonStyle={{ ...styles.buttonInfo, bottom: 12 + 40 + 8 + insets.bottom }}
        color={AppPalette.red500}
        onPress={openReviewBottomSheet}
      />
      <VectorIcon
        name="circle-arrow-down"
        font="FontAwesome6"
        size={18}
        buttonStyle={{
          ...styles.buttonScrollToBottom,
          bottom: 12 + insets.bottom,
        }}
        color={AppPalette.gray600}
        onPress={() => refScroll.current?.scrollToEnd({ animated: true })}
      />
      <SheetBookInfo ref={sheetBookInfoRef} />
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
  buttonScrollToBottom: {
    alignSelf: 'center',
    borderRadius: 100,
    backgroundColor: 'white',
    right: 'auto',
    left: 'auto',
  },
})
