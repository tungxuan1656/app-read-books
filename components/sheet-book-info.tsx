import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import React, { forwardRef, useCallback, useMemo } from 'react'
import {
  DeviceEventEmitter,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { type ReadingAIMode } from '@/@types/common'
import { AppColors } from '@/assets'
import useAppStore, { storeActions } from '@/controllers/store'
import { RELOAD_CONTENT_EVENT } from '@/hooks/use-reading-content'
import { getAIActions } from '@/services/ai-actions.service'
import { clearProcessedChapter } from '@/services/content-processor'
import { getListFonts } from '@/utils'

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
    const { font, fontSize, lineHeight } = useAppStore(
      (state) => state.typography,
    )
    const readingAIMode = useAppStore((state) => state.readingAIMode)

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
      const bookId = useAppStore.getState().reading.bookId
      const chapterNumber =
        useAppStore.getState().id2BookReadingChapter[bookId] || 1
      if (readingAIMode === 'none' || !bookId || !chapterNumber) return
      try {
        // Xóa cache của chương hiện tại theo mode (actionKey)
        await clearProcessedChapter(bookId, chapterNumber, readingAIMode)

        // Gọi callback để trigger reload nội dung
        DeviceEventEmitter.emit(RELOAD_CONTENT_EVENT)

        // Đóng bottom sheet
        bottomSheetRef.current?.close()
      } catch (error) {
        console.error('Error reprocessing:', error)
      }
    }, [readingAIMode])

    // Memoize font list for better performance
    const fontList = useMemo(() => getListFonts(), [])

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
        <View style={{ flex: 1 }}>
          <Text className='text-ssm font-medium'>{'Cỡ chữ'}</Text>
          <View style={styles.viewRow}>
            <VectorIcon
              name='circle-minus'
              font='FontAwesome6'
              color={AppColors.gray200}
              size={20}
              onPress={() =>
                storeActions.setTypography({ fontSize: fontSize - 1 })
              }
              buttonProps={{ hitSlop: 10 }}
            />
            <Text
              style={[{ width: 24, textAlign: 'center' }]}
              className='text-xs font-semibold'>
              {fontSize}
            </Text>
            <VectorIcon
              name='circle-plus'
              font='FontAwesome6'
              color={AppColors.gray200}
              size={20}
              onPress={() =>
                storeActions.setTypography({ fontSize: fontSize + 1 })
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
        <View style={{ flex: 1 }}>
          <Text className='text-ssm font-medium'>{'Chiều cao dòng'}</Text>
          <View style={styles.viewRow}>
            <VectorIcon
              name='circle-minus'
              font='FontAwesome6'
              color={AppColors.gray200}
              size={20}
              onPress={() =>
                storeActions.setTypography({
                  lineHeight: (lineHeight * 10 - 1) / 10,
                })
              }
              buttonProps={{ hitSlop: 10 }}
            />
            <Text
              style={[{ width: 24, textAlign: 'center' }]}
              className='text-xs font-semibold'>
              {Math.round(lineHeight * 10) / 10}
            </Text>
            <VectorIcon
              name='circle-plus'
              font='FontAwesome6'
              color={AppColors.gray200}
              size={20}
              onPress={() =>
                storeActions.setTypography({
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
          onPress={() => storeActions.setTypography({ font: fontName })}
          style={[
            styles.viewItemFont,
            font === fontName && styles.viewItemSelected,
          ]}>
          <Text style={styles.textItemFont}>{fontName}</Text>
        </TouchableOpacity>
      ),
      [font],
    )

    const renderReadingMode = useCallback(
      (mode: { value: string; label: string }) => (
        <TouchableOpacity
          key={mode.value}
          onPress={() =>
            storeActions.setReadingAIMode(mode.value as ReadingAIMode)
          }
          style={[
            styles.viewItemFont,
            readingAIMode === mode.value && styles.viewItemSelected,
          ]}>
          <Text style={styles.textItemFont}>{mode.label}</Text>
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
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}>
        <BottomSheetView style={styles.titleContainer}>
          <View className='flex-row items-center justify-between'>
            <Text className='text-lg font-medium text-gray-900'>
              {'Cài đặt'}
            </Text>
          </View>
          <Text className='mb-2 mt-4 text-ssm font-medium'>{'Font chữ'}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {fontList.map(renderFontItem)}
          </View>
          <Text className='mb-2 mt-4 text-ssm font-medium'>
            {'Chế độ đọc AI'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {aiModes.map(renderReadingMode)}
            <TouchableOpacity
              onPress={handleReprocess}
              disabled={readingAIMode === 'none'}
              style={[
                styles.viewItemFont,
                {
                  backgroundColor:
                    readingAIMode === 'none'
                      ? AppColors.gray300
                      : AppColors.red400,
                  flexDirection: 'row',
                  gap: 4,
                  opacity: readingAIMode === 'none' ? 0.7 : 1,
                },
              ]}>
              <VectorIcon
                name='reload-circle'
                font='Ionicons'
                size={16}
                color='white'
              />
              <Text className='text-xs font-normal text-white'>
                {'Xử lý lại'}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
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

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: AppColors.white,
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.53,
    shadowRadius: 13.97,
    elevation: 21,
  },
  handleIndicator: {
    backgroundColor: AppColors.gray200,
    width: 40,
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 60,
    paddingTop: 12,
  },
  viewItemFont: {
    borderRadius: 30,
    backgroundColor: AppColors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  viewItemSelected: {
    backgroundColor: AppColors.blue50,
  },
  textItemFont: { fontSize: 12, fontWeight: '400' },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
})
