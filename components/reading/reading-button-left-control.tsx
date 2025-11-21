import { AppPalette } from '@/assets'
import React from 'react'
import { StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { VectorIcon } from '../Icon'

function ReadingButtonLeftControl({ openBook }: { openBook: () => void }) {
  const insets = useSafeAreaInsets()

  //   const openReviewBottomSheet = useCallback(() => {
  //   const reading = useAppStore.getState().readingOptions
  //   reviewBottomSheetRef.current?.present({
  //     content: currentChapterContent,
  //     bookId: reading.currentBook,
  //     chapterNumber: reading.books[reading.currentBook],
  //   })
  // }, [currentChapterContent])

  return (
    <>
      <VectorIcon
        name="book-open-reader"
        font="FontAwesome6"
        size={18}
        buttonStyle={{ ...styles.buttonInfo, bottom: 12 + insets.bottom }}
        color={AppPalette.white}
        onPress={openBook}
      />
    </>
  )
}

export default React.memo(ReadingButtonLeftControl)

const styles = StyleSheet.create({
  buttonInfo: {
    width: 40,
    height: 40,
    borderRadius: 40,
    backgroundColor: AppPalette.gray300,
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
})
