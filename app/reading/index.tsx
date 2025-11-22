import { ContentDisplay } from '@/components/content-display'
import { GSpinner } from '@/components/g-spinner'
import ReadingButtonBack from '@/components/reading/reading-button-back'
import ReadingButtonLeftControl from '@/components/reading/reading-button-left-control'
import ReadingButtonScrollBottom from '@/components/reading/reading-button-scroll-bottom'
import ReadingButtonTopNavigation from '@/components/reading/reading-button-top-navigation'
import { Screen } from '@/components/Screen'
import SheetBookInfo, { SheetBookInfoRef } from '@/components/sheet-book-info'
import { AppTypo } from '@/constants'
import useAppStore from '@/controllers/store'
import useReadingContent from '@/hooks/use-reading-content'
import useReadingNavigation from '@/hooks/use-reading-navigation'
import { useTypedLocalSearchParams } from '@/hooks/use-typed-local-search-params'
import { getCurrentBookId } from '@/utils'
import React, { useCallback, useEffect, useRef } from 'react'
import { ScrollView, Text, View } from 'react-native'

const Reading = () => {
  const { bookId } = useTypedLocalSearchParams<{ bookId: string }>({ bookId: 'string' })
  
  // Manage chapter content (loading, display)
  const chapter = useReadingContent(bookId)
  
  // Manage navigation (next/prev/scroll/state)
  const { nextChapter, previousChapter, handleScroll } = useReadingNavigation(bookId)

  const refScroll = useRef<ScrollView | null>(null)
  const refBookInfoSheet = useRef<SheetBookInfoRef>(null)

  // Restore scroll position on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const offset = useAppStore.getState().settings.currentReadingOffset
      if (offset) {
        refScroll.current?.scrollTo({ y: offset, animated: false })
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  // Reset scroll to top when chapter changes
  useEffect(() => {
    refScroll.current?.scrollTo({ y: 0, animated: false })
  }, [chapter.index])

  // Show/hide loading spinner
  useEffect(() => {
    if (chapter.isLoading) {
      GSpinner.show({ label: 'Đang tải...' })
    } else {
      GSpinner.hide()
    }
  }, [chapter.isLoading])

  const openBook = useCallback(() => {
    const bookId = getCurrentBookId()
    refBookInfoSheet.current?.present(bookId)
  }, [])

  const handleScrollToBottom = useCallback(() => {
    refScroll.current?.scrollToEnd({ animated: true })
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <Screen.Container safe={'top'} style={{ backgroundColor: '#F5F1E5' }}>
        <Text style={[AppTypo.mini.regular, { marginHorizontal: 16 }]} numberOfLines={1}>
          【{chapter.index}】{chapter.name || 'Chương không có tên'}
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

        <ReadingButtonBack />
        <ReadingButtonTopNavigation
          nextChapter={nextChapter}
          previousChapter={previousChapter}
        />
        <ReadingButtonLeftControl openBook={openBook} />
        <ReadingButtonScrollBottom onScrollToBottom={handleScrollToBottom} />
      </Screen.Container>
      <SheetBookInfo ref={refBookInfoSheet} />
    </View>
  )
}

export default Reading
