import { ReadingAIMode } from '@/@types/common'
import { AppPalette } from '@/assets'
import { VectorIcon } from '@/components/Icon'
import { AppStyles, AppTypo, ReadingAIModes } from '@/constants'
import useAppStore, { storeActions } from '@/controllers/store'
import { getListFonts } from '@/utils'
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdropProps,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet'
import React, { forwardRef, useCallback, useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export interface SheetBookInfoRef {
  present: (bookId: string) => void
  dismiss: () => void
}

type SheetBookInfoProps = {
  onClose?: () => void
}

const SheetBookInfo = forwardRef<SheetBookInfoRef, SheetBookInfoProps>(({ onClose }, ref) => {
  const bottomSheetRef = React.useRef<BottomSheet>(null)
  const { font, fontSize, lineHeight } = useAppStore((state) => state.typography)
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

  // Memoize font list for better performance
  const fontList = useMemo(() => getListFonts(), [])

  // Memoize font controls for better performance
  const fontSizeControls = useMemo(
    () => (
      <View style={{ flex: 1 }}>
        <Text style={styles.titleSection}>{'Cỡ chữ'}</Text>
        <View style={styles.viewRow}>
          <VectorIcon
            name="circle-minus"
            font="FontAwesome6"
            color={AppPalette.gray200}
            size={20}
            onPress={() =>
              storeActions.setTypography({
                fontSize: fontSize - 1,
                font,
                lineHeight,
              })
            }
          />
          <Text style={[AppTypo.caption.semiBold, { width: 24, textAlign: 'center' }]}>
            {fontSize}
          </Text>
          <VectorIcon
            name="circle-plus"
            font="FontAwesome6"
            color={AppPalette.gray200}
            size={20}
            onPress={() =>
              storeActions.setTypography({
                fontSize: fontSize + 1,
                font,
                lineHeight,
              })
            }
          />
        </View>
      </View>
    ),
    [fontSize],
  )

  const lineHeightControls = useMemo(
    () => (
      <View style={{ flex: 1 }}>
        <Text style={styles.titleSection}>{'Chiều cao dòng'}</Text>
        <View style={styles.viewRow}>
          <VectorIcon
            name="circle-minus"
            font="FontAwesome6"
            color={AppPalette.gray200}
            size={20}
            onPress={() =>
              storeActions.setTypography({
                font,
                fontSize,
                lineHeight: (lineHeight * 10 - 1) / 10,
              })
            }
          />
          <Text style={[AppTypo.caption.semiBold, { width: 24, textAlign: 'center' }]}>
            {Math.round(lineHeight * 10) / 10}
          </Text>
          <VectorIcon
            name="circle-plus"
            font="FontAwesome6"
            color={AppPalette.gray200}
            size={20}
            onPress={() =>
              storeActions.setTypography({
                font,
                fontSize,
                lineHeight: (lineHeight * 10 + 1) / 10,
              })
            }
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
        onPress={() =>
          storeActions.setTypography({
            font: fontName,
            fontSize,
            lineHeight,
          })
        }
        style={[styles.viewItemFont, font === fontName && styles.viewItemSelected]}>
        <Text style={styles.textItemFont}>{fontName}</Text>
      </TouchableOpacity>
    ),
    [font],
  )

  const renderReadingMode = useCallback(
    (mode: (typeof ReadingAIModes)[number]) => (
      <TouchableOpacity
        key={mode.value}
        onPress={() => storeActions.setReadingAIMode(mode.value as ReadingAIMode)}
        style={[styles.viewItemFont, readingAIMode === mode.value && styles.viewItemSelected]}>
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
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.title}>{'Cài đặt'}</Text>
        </View>
        <Text style={styles.titleSection}>{'Font chữ'}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {fontList.map(renderFontItem)}
        </View>
        <Text style={styles.titleSection}>{'Chế độ đọc AI'}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {ReadingAIModes.map(renderReadingMode)}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {fontSizeControls}
          {lineHeightControls}
        </View>
      </BottomSheetView>
    </BottomSheet>
  )
})

SheetBookInfo.displayName = 'SheetBookInfo'

export default SheetBookInfo

const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop {...props} disappearsOnIndex={-1} />
)

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: AppPalette.white,
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    ...AppStyles.view.shadow3,
  },
  handleIndicator: {
    backgroundColor: AppPalette.gray200,
    width: 40,
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 60,
    paddingTop: 12,
  },
  title: {
    ...AppTypo.h4.medium,
    color: AppPalette.gray900,
  },
  titleSection: {
    ...AppTypo.footnote.medium,
    marginTop: 16,
    marginBottom: 8,
  },
  viewItemFont: {
    borderRadius: 30,
    backgroundColor: AppPalette.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  viewItemSelected: {
    backgroundColor: AppPalette.blue50,
  },
  textItemFont: {
    ...AppTypo.caption.regular,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
})
