import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import React, { forwardRef, useCallback, useMemo } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import { type ReadingAIMode } from '@/@types/common'
import { AppColors } from '@/assets'
import { READING_FONT_FAMILIES } from '@/constants'
import {
  readingActions,
  typographyActions,
  uiRuntimeActions,
  useBooksStore,
  useReadingStore,
  useTypographyStore,
} from '@/controllers/stores'
import { getAIActions } from '@/services/ai-actions.service'
import { clearProcessedChapter } from '@/services/content-processor'
import { cn } from '@/utils'

import { VectorIcon } from './vector-icon'

export interface SheetBookInfoRef {
  present: (bookId: string) => void
  dismiss: () => void
}

type SheetBookInfoProps = {
  onClose?: () => void
}

const SheetBookInfo = forwardRef<SheetBookInfoRef, SheetBookInfoProps>(
  ({ onClose }, ref) => {
    const bottomSheetRef = React.useRef<BottomSheet>(null)
    const { font, fontSize, lineHeight } = useTypographyStore.use.typography()
    const readingAIMode = useReadingStore.use.readingAIMode()

    // Expose methods through ref
    React.useImperativeHandle(ref, () => ({
      present: () => {
        bottomSheetRef.current?.expand()
      },
      dismiss: () => {
        bottomSheetRef.current?.close()
      },
    }))

    const handleClose = useCallback(() => {
      onClose?.()
    }, [onClose])

    // Handler cho nút Xử lý lại
    const handleReprocess = useCallback(async () => {
      const bookId = useReadingStore.getState().reading.bookId
      const chapterNumber =
        useBooksStore.getState().id2BookReadingChapter[bookId] || 1
      if (readingAIMode === 'none' || !bookId || !chapterNumber) return
      try {
        // Xóa cache của chương hiện tại theo mode (actionKey)
        await clearProcessedChapter(bookId, chapterNumber, readingAIMode)

        // Trigger reload nội dung
        uiRuntimeActions.triggerContentReload()

        // Đóng bottom sheet
        bottomSheetRef.current?.close()
      } catch (error) {
        console.error('Error reprocessing:', error)
      }
    }, [readingAIMode])

    const aiModes = useMemo(() => {
      const actions = getAIActions()
      return [
        { value: 'none', label: 'Không' },
        ...actions.map((a) => ({ value: a.key, label: a.name })),
      ]
    }, [])

    // Memoize font controls for better performance
    const fontSizeControls = useMemo(
      () => (
        <View className='flex-1'>
          <Text className='text-sm font-medium'>{'Cỡ chữ'}</Text>
          <View className='flex-row items-center gap-2'>
            <VectorIcon
              name='circle-minus'
              font='FontAwesome6'
              color={AppColors.gray200}
              size={20}
              onPress={() =>
                typographyActions.setTypography({ fontSize: fontSize - 1 })
              }
              buttonProps={{ hitSlop: 10 }}
            />
            <Text className='w-6 text-center text-sm font-semibold'>
              {fontSize}
            </Text>
            <VectorIcon
              name='circle-plus'
              font='FontAwesome6'
              color={AppColors.gray200}
              size={20}
              onPress={() =>
                typographyActions.setTypography({ fontSize: fontSize + 1 })
              }
              buttonProps={{ hitSlop: 10 }}
            />
          </View>
        </View>
      ),
      [fontSize],
    )

    const lineHeightControls = useMemo(
      () => (
        <View className='flex-1'>
          <Text className='text-sm font-medium'>{'Chiều cao dòng'}</Text>
          <View className='flex-row items-center gap-2'>
            <VectorIcon
              name='circle-minus'
              font='FontAwesome6'
              color={AppColors.gray200}
              size={20}
              onPress={() =>
                typographyActions.setTypography({
                  lineHeight: (lineHeight * 10 - 1) / 10,
                })
              }
              buttonProps={{ hitSlop: 10 }}
            />
            <Text className='w-6 text-center text-sm font-semibold'>
              {Math.round(lineHeight * 10) / 10}
            </Text>
            <VectorIcon
              name='circle-plus'
              font='FontAwesome6'
              color={AppColors.gray200}
              size={20}
              onPress={() =>
                typographyActions.setTypography({
                  lineHeight: (lineHeight * 10 + 1) / 10,
                })
              }
              buttonProps={{ hitSlop: 10 }}
            />
          </View>
        </View>
      ),
      [lineHeight],
    )

    const renderFontItem = useCallback(
      (fontName: string) => (
        <TouchableOpacity
          key={fontName}
          onPress={() => typographyActions.setTypography({ font: fontName })}
          className={cn(
            'items-center justify-center rounded-full bg-gray-100 px-2.5 py-1.5',
            font === fontName && 'bg-blue-100',
          )}>
          <Text className='text-sm font-normal'>{fontName}</Text>
        </TouchableOpacity>
      ),
      [font],
    )

    const renderReadingMode = useCallback(
      (mode: { value: string; label: string }) => (
        <TouchableOpacity
          key={mode.value}
          onPress={() =>
            readingActions.setReadingAIMode(mode.value as ReadingAIMode)
          }
          className={cn(
            'items-center justify-center rounded-full bg-gray-100 px-2.5 py-1.5',
            readingAIMode === mode.value && 'bg-blue-100',
          )}>
          <Text className='text-sm font-normal'>{mode.label}</Text>
        </TouchableOpacity>
      ),
      [readingAIMode],
    )

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        // snapPoints={snapPoints}
        enablePanDownToClose
        onClose={handleClose}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={BOTTOM_SHEET_BACKGROUND}
        handleIndicatorStyle={HANDLE_INDICATOR}>
        <BottomSheetView className='flex-1 px-4 pb-16 pt-3'>
          <View className='flex-row items-center justify-between'>
            <Text className='text-lg font-medium text-gray-900'>
              {'Cài đặt'}
            </Text>
          </View>
          <Text className='mb-2 mt-4 text-sm font-medium'>{'Font chữ'}</Text>
          <View className='flex-row flex-wrap gap-2'>
            {READING_FONT_FAMILIES.map(renderFontItem)}
          </View>
          <Text className='mb-2 mt-4 text-sm font-medium'>
            {'Chế độ đọc AI'}
          </Text>
          <View className='flex-row flex-wrap gap-2'>
            {aiModes.map(renderReadingMode)}
            <TouchableOpacity
              onPress={handleReprocess}
              disabled={readingAIMode === 'none'}
              className={cn(
                'flex-row items-center justify-center gap-1 rounded-full px-2 py-1.5',
                readingAIMode === 'none'
                  ? 'bg-gray-300 opacity-70'
                  : 'bg-red-400',
              )}>
              <VectorIcon
                name='reload-circle'
                font='Ionicons'
                size={16}
                color='white'
              />
              <Text className='text-sm font-normal text-white'>
                {'Xử lý lại'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className='mt-2 flex-row justify-between'>
            {fontSizeControls}
            {lineHeightControls}
          </View>
        </BottomSheetView>
      </BottomSheet>
    )
  },
)

SheetBookInfo.displayName = 'SheetBookInfo'

export default SheetBookInfo

const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop {...props} disappearsOnIndex={-1} />
)

const BOTTOM_SHEET_BACKGROUND = {
  backgroundColor: AppColors.white,
  borderTopRightRadius: 24,
  borderTopLeftRadius: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.53,
  shadowRadius: 13.97,
  elevation: 21,
}

const HANDLE_INDICATOR = {
  backgroundColor: AppColors.gray200,
  width: 40,
}
