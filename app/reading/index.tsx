import React, { useCallback, useEffect, useRef } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'

import { ContentDisplay } from '@/components/content-display'
import { PrefetchStatus } from '@/components/prefetch-status'
import ReadingButtonBack from '@/components/reading/reading-button-back'
import ReadingButtonLeftControl from '@/components/reading/reading-button-left-control'
import ReadingButtonScrollBottom from '@/components/reading/reading-button-scroll-bottom'
import ReadingButtonTopNavigation from '@/components/reading/reading-button-top-navigation'
import { Screen } from '@/components/screen'
import useAppStore from '@/controllers/store'
import { useChapterPrefetch } from '@/hooks/use-chapter-prefetch'
import useReadingContent from '@/hooks/use-reading-content'
import useReadingNavigation from '@/hooks/use-reading-navigation'
import { useTypedLocalSearchParams } from '@/hooks/use-typed-local-search-params'

const Reading = () => {
  const { bookId } = useTypedLocalSearchParams<{ bookId: string }>({
    bookId: 'string',
  })

  const chapter = useReadingContent(bookId)
  const { nextChapter, previousChapter, handleScroll } =
    useReadingNavigation(bookId)

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
    <View className='flex-1'>
      <Screen.Container safe={'top'} className='bg-[#F5F1E5]'>
        <View className='mx-4 flex-row items-center gap-2'>
          <Text className='flex-1 text-xss font-normal' numberOfLines={1}>
            【{chapter.index}】{chapter.name || 'Chương không có tên'}
          </Text>
          <PrefetchStatus />
        </View>

        <View className='flex-1'>
          <ScrollView
            className='flex-1'
            ref={refScroll}
            scrollEventThrottle={300}
            contentContainerStyle={{ paddingVertical: 44, flexGrow: 1 }}
            onScroll={handleScroll}>
            {chapter.content !== '' ? (
              <ContentDisplay chapterHtml={chapter.content} />
            ) : null}
          </ScrollView>
          {chapter.isLoading ? (
            <View className='absolute inset-0 items-center justify-center bg-[#F5F1E5] pb-10'>
              <ActivityIndicator size={'small'} />
              <Text className='mx-5 mt-2 text-ssm font-normal'>
                {chapter.message}
              </Text>
            </View>
          ) : null}
        </View>

        <ReadingButtonBack />
        <ReadingButtonTopNavigation
          nextChapter={nextChapter}
          previousChapter={previousChapter}
        />
        <ReadingButtonScrollBottom onScrollToBottom={handleScrollToBottom} />
      </Screen.Container>
      <ReadingButtonLeftControl />
    </View>
  )
}

export default Reading
