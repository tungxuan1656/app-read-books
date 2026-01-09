import { AppPalette } from '@/assets'
import React, { useCallback, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import SheetBookInfo, { SheetBookInfoRef } from '../sheet-book-info'
import useAppStore from '@/controllers/store'
import useReadingContent from '@/hooks/use-reading-content'
import { VectorIcon } from '../vector-icon'

function ReadingButtonLeftControl() {
  const insets = useSafeAreaInsets()
  const refBookInfoSheet = useRef<SheetBookInfoRef>(null)
  const bookId = useAppStore((s) => s.reading.bookId)
  const chapter = useReadingContent(bookId)

  const openBook = useCallback(() => {
    refBookInfoSheet.current?.present(bookId)
  }, [bookId])

  return (
    <>
      <View style={[styles.container, { bottom: 12 + insets.bottom }]}>
        {/* <TTSControl 
          content={chapter.content} 
          bookId={bookId} 
          chapterIndex={chapter.index} 
        /> */}
        
        <VectorIcon
          name="book-open-reader"
          font="FontAwesome6"
          size={14}
          buttonStyle={styles.buttonInfo}
          color={AppPalette.white}
          onPress={openBook}
        />
      </View>
      <SheetBookInfo ref={refBookInfoSheet} />
    </>
  )
}

export default React.memo(ReadingButtonLeftControl)

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    alignItems: 'flex-end',
    gap: 8,
  },
  buttonInfo: {
    width: 32,
    height: 32,
    borderRadius: 40,
    backgroundColor: AppPalette.gray300,
  },
})
