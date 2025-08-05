import { ContentDisplay } from '@/components/ContentDisplay'
import ReadingButtonBack from '@/components/reading/ReadingButtonBack'
import ReadingButtonLeftControl from '@/components/reading/ReadingButtonLeftControl'
import ReadingButtonScrollBottom from '@/components/reading/ReadingButtonScrollBottom'
import ReadingButtonTopNavigation from '@/components/reading/ReadingButtonTopNavigation'
import ReviewBottomSheet, { ReviewBottomSheetRef } from '@/components/ReviewBottomSheet'
import { Screen } from '@/components/Screen'
import SheetBookInfo, { SheetBookInfoRef } from '@/components/SheetBookInfo'
import { AppConst, AppStyles, AppTypo, EventKeys, MMKVKeys } from '@/constants'
import { MMKVStorage } from '@/controllers/mmkv'
import useAppStore from '@/controllers/store'
import useReadingActions from '@/hooks/use-reading-actions'
import useReadingContent from '@/hooks/use-reading-content'
import useReupdateReading from '@/hooks/use-reupdate-reading'
import { useTypedLocalSearchParams } from '@/hooks/use-typed-local-search-params'
import React, { useCallback, useEffect, useRef } from 'react'
import {
  ActivityIndicator,
  DeviceEventEmitter,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

const Reading = () => {
  const params = useTypedLocalSearchParams<{ bookId: string }>({ bookId: 'string' })
  useReupdateReading(params.bookId)

  const { nextChapter, previousChapter, saveOffset, isLoading, onLoaded } = useReadingActions()
  const { currentChapterName, currentChapterContent } = useReadingContent()

  const refScroll = useRef<ScrollView | null>(null)
  const sheetBookInfoRef = useRef<SheetBookInfoRef>(null)
  const reviewBottomSheetRef = useRef<ReviewBottomSheetRef>(null)

  // Load reading offset once when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      const offset = MMKVStorage.get(MMKVKeys.CURRENT_READING_OFFSET)
      if (offset) refScroll.current?.scrollTo({ y: offset, animated: false })
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const unsubscribe = DeviceEventEmitter.addListener(EventKeys.READING_NEXT_CHAPTER_DONE, () => {
      refScroll.current?.scrollTo({ y: 0, animated: false })
    })
    return () => unsubscribe.remove()
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

  const openBook = useCallback(() => {
    const bookId = useAppStore.getState().readingOptions.currentBook
    sheetBookInfoRef.current?.present(bookId)
  }, [])

  const handleScrollToBottom = useCallback(() => {
    refScroll.current?.scrollToEnd({ animated: true })
  }, [])

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
          <ActivityIndicator size={'small'} style={{ top: -100 }} />
        </View>
      ) : null}

      <ReadingButtonBack />
      <ReadingButtonTopNavigation nextChapter={nextChapter} previousChapter={previousChapter} />
      <ReadingButtonLeftControl openBook={openBook} />
      <ReadingButtonScrollBottom onScrollToBottom={handleScrollToBottom} />

      <SheetBookInfo ref={sheetBookInfoRef} />
      <ReviewBottomSheet ref={reviewBottomSheetRef} onClose={() => {}} />
    </Screen.Container>
  )
}

export default Reading

const styles = StyleSheet.create({
  viewLoading: {
    height: AppConst.windowHeight(),
    backgroundColor: '#F5F1E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
