import React, { useCallback, useRef } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppColors } from '@/assets'
import useAppStore from '@/controllers/store'

import SheetBookInfo, { type SheetBookInfoRef } from '../sheet-book-info'
import { VectorIcon } from '../vector-icon'

function ReadingButtonLeftControl() {
  const insets = useSafeAreaInsets()
  const refBookInfoSheet = useRef<SheetBookInfoRef>(null)
  const bookId = useAppStore((s) => s.reading.bookId)

  const openBook = useCallback(() => {
    refBookInfoSheet.current?.present(bookId)
  }, [bookId])

  return (
    <>
      <View
        className='absolute right-3 items-end gap-2'
        style={{ bottom: 12 + insets.bottom }}>
        <VectorIcon
          name='book-open-reader'
          font='FontAwesome6'
          size={14}
          buttonClassName='size-8 rounded-full bg-gray-300'
          color={AppColors.white}
          onPress={openBook}
        />
      </View>
      <SheetBookInfo ref={refBookInfoSheet} />
    </>
  )
}

export default React.memo(ReadingButtonLeftControl)
