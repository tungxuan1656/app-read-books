import { AppPalette } from '@/assets'
import React, { useCallback, useRef } from 'react'
import { StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { VectorIcon } from '../Icon'
import SheetBookInfo, { SheetBookInfoRef } from '../sheet-book-info'
import useAppStore from '@/controllers/store'

function ReadingButtonLeftControl() {
  const insets = useSafeAreaInsets()
  const refBookInfoSheet = useRef<SheetBookInfoRef>(null)

  const openBook = useCallback(() => {
    const bookId = useAppStore.getState().reading.bookId
    refBookInfoSheet.current?.present(bookId)
  }, [])

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
      <SheetBookInfo ref={refBookInfoSheet} />
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
