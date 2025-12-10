import { ContentDisplay } from '@/components/content-display'
import ReadingButtonBack from '@/components/reading/reading-button-back'
import ReadingButtonLeftControl from '@/components/reading/reading-button-left-control'
import ReadingButtonScrollBottom from '@/components/reading/reading-button-scroll-bottom'
import ReadingButtonTopNavigation from '@/components/reading/reading-button-top-navigation'
import { Screen } from '@/components/Screen'
import { AppTypo } from '@/constants'
import useAppStore from '@/controllers/store'
import useReadingContent from '@/hooks/use-reading-content'
import useReadingNavigation from '@/hooks/use-reading-navigation'
import { useTypedLocalSearchParams } from '@/hooks/use-typed-local-search-params'
import React, { useCallback, useEffect, useRef } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useChapterPrefetch } from '@/hooks/use-chapter-prefetch'
import { PrefetchStatus } from '@/components/prefetch-status'

const Reading = () => {
  const { bookId } = useTypedLocalSearchParams<{ bookId: string }>({ bookId: 'string' })

  const chapter = useReadingContent(bookId)
  const { nextChapter, previousChapter, handleScroll } = useReadingNavigation(bookId)

  useChapterPrefetch(bookId, chapter.index, !chapter.isLoading)

  const refScroll = useRef<ScrollView | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      const offset = useAppStore.getState().reading.offset
      if (offset) refScroll.current?.scrollTo({ y: offset, animated: false })
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  // Reset scroll to top when chapter changes
  useEffect(() => {
    refScroll.current?.scrollTo({ y: 0, animated: false })
  }, [chapter.index])

  const handleScrollToBottom = useCallback(() => {
    refScroll.current?.scrollToEnd({ animated: true })
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <Screen.Container safe={'top'} style={{ backgroundColor: '#F5F1E5' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, gap: 8 }}>
          <Text style={[AppTypo.mini.regular, { flex: 1 }]} numberOfLines={1}>
            【{chapter.index}】{chapter.name || 'Chương không có tên'}
          </Text>
          <PrefetchStatus />
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            ref={refScroll}
            scrollEventThrottle={300}
            contentContainerStyle={{ paddingVertical: 44, flexGrow: 1 }}
            onScroll={handleScroll}>
            {chapter.content !== '' ? <ContentDisplay chapterHtml={chapter.content} /> : null}
          </ScrollView>
          {chapter.isLoading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size={'small'} />
              <Text style={[AppTypo.footnote.regular, { marginTop: 8, marginHorizontal: 20 }]}>
                {chapter.message}
              </Text>
            </View>
          ) : null}
        </View>

        <ReadingButtonBack />
        <ReadingButtonTopNavigation nextChapter={nextChapter} previousChapter={previousChapter} />
        <ReadingButtonScrollBottom onScrollToBottom={handleScrollToBottom} />
      </Screen.Container>
      <ReadingButtonLeftControl />
    </View>
  )
}

export default Reading

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F1E5',
    paddingBottom: 40,
  },
})
