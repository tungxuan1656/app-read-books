import { ContentDisplay } from '@/components/content-display'
import { GSpinner } from '@/components/g-spinner'
import ReadingAudioControl from '@/components/reading/reading-audio-control'
import ReadingButtonBack from '@/components/reading/reading-button-back'
import ReadingButtonLeftControl from '@/components/reading/reading-button-left-control'
import ReadingButtonScrollBottom from '@/components/reading/reading-button-scroll-bottom'
import ReadingButtonTopNavigation from '@/components/reading/reading-button-top-navigation'
import { Screen } from '@/components/Screen'
import SheetBookInfo, { SheetBookInfoRef } from '@/components/sheet-book-info'
import { AppConst, AppTypo, EventKeys, MMKVKeys } from '@/constants'
import { MMKVStorage } from '@/controllers/mmkv'
import useReadingChapter from '@/hooks/use-reading-chapter'
import useReadingController from '@/hooks/use-reading-controller'
import useReupdateReading from '@/hooks/use-reupdate-reading'
import { useTypedLocalSearchParams } from '@/hooks/use-typed-local-search-params'
import { getCurrentBookId } from '@/utils'
import React, { useCallback, useEffect, useRef } from 'react'
import { DeviceEventEmitter, ScrollView, StyleSheet, Text } from 'react-native'

const Reading = () => {
  console.log('RENDER Reading')
  const { bookId } = useTypedLocalSearchParams<{ bookId: string }>({ bookId: 'string' })
  useReupdateReading(bookId)
  const { nextChapter, previousChapter, saveOffset } = useReadingController(bookId)
  const chapter = useReadingChapter(bookId)

  const refScroll = useRef<ScrollView | null>(null)
  const refBookInfoSheet = useRef<SheetBookInfoRef>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      const offset = MMKVStorage.get(MMKVKeys.CURRENT_READING_OFFSET)
      if (offset) refScroll.current?.scrollTo({ y: offset, animated: false })
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const u1 = DeviceEventEmitter.addListener(EventKeys.READING_NEXT_CHAPTER_DONE, () => {
      refScroll.current?.scrollTo({ y: 0, animated: false })
    })
    const u2 = DeviceEventEmitter.addListener(EventKeys.EVENT_START_LOADING_CHAPTER, () => {
      GSpinner.show()
    })
    const u3 = DeviceEventEmitter.addListener(EventKeys.EVENT_START_GENERATE_SUMMARY, () => {
      GSpinner.show({ label: 'Đang tóm tắt...' })
    })
    return () => {
      u1.remove()
      u2.remove()
      u3.remove()
    }
  }, [])

  const handleScroll = useCallback(
    (event: any) => {
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent
      const offset = Math.round(contentOffset.y + layoutMeasurement.height)
      const contentHeight = Math.round(contentSize.height)
      saveOffset(contentOffset.y)
      if (offset > contentHeight + 30) nextChapter(500)
      if (contentOffset.y < -40) previousChapter(500)
    },
    [saveOffset, nextChapter, previousChapter],
  )

  const openBook = useCallback(() => {
    const bookId = getCurrentBookId()
    refBookInfoSheet.current?.present(bookId)
  }, [])

  const handleScrollToBottom = useCallback(() => {
    refScroll.current?.scrollToEnd({ animated: true })
  }, [])

  return (
    <Screen.Container safe={'top'} style={{ backgroundColor: '#F5F1E5' }}>
      <Text style={[AppTypo.mini.regular, { marginHorizontal: 16 }]} numberOfLines={1}>
        {chapter.name || 'Chương không có tên'}
      </Text>

      <ScrollView
        style={{ flex: 1 }}
        ref={refScroll}
        scrollEventThrottle={300}
        contentContainerStyle={{ paddingVertical: 44 }}
        onScroll={handleScroll}>
        {chapter.content !== '' ? (
          <ContentDisplay chapterHtml={chapter.content} onLoaded={GSpinner.hide} />
        ) : null}
      </ScrollView>

      {chapter.summary && chapter.content.length > 0 ? (
        <ReadingAudioControl
          bookId={chapter.bookId}
          chapter={chapter.index}
          content={chapter.content}
        />
      ) : null}

      <ReadingButtonBack />
      <ReadingButtonTopNavigation nextChapter={nextChapter} previousChapter={previousChapter} />
      <ReadingButtonLeftControl openBook={openBook} />
      <ReadingButtonScrollBottom onScrollToBottom={handleScrollToBottom} />

      <SheetBookInfo ref={refBookInfoSheet} />
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
