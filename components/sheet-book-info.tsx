import { AppColors, AppPalette } from '@/assets'
import { VectorIcon } from '@/components/Icon'
import { AppStyles, AppTypo } from '@/constants'
import useAppStore, { storeActions } from '@/controllers/store'
import { getCurrentBookId, getListFonts } from '@/utils'
import { clearBookCache } from '@/utils/cache-manager'
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet'
import { router } from 'expo-router'
import React, { forwardRef, useCallback, useMemo } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export interface SheetBookInfoRef {
  present: (bookId: string) => void
  dismiss: () => void
}

type SheetBookInfoProps = {
  onClose?: () => void
}

const SheetBookInfo = forwardRef<SheetBookInfoRef, SheetBookInfoProps>(({ onClose }, ref) => {
  const currentBookId = useMemo(() => getCurrentBookId(), [])
  const bottomSheetRef = React.useRef<BottomSheet>(null)
  const font = useAppStore((state) => state.font)
  const fontSize = useAppStore((state) => state.fontSize)
  const lineHeight = useAppStore((state) => state.lineHeight)

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

  const handleViewReferences = useCallback(() => {
    if (!currentBookId) return

    router.navigate({ pathname: '/references', params: { bookId: currentBookId } })
    bottomSheetRef.current?.close()
  }, [currentBookId])

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
            onPress={() => storeActions.setFontSize(fontSize - 1)}
          />
          <Text style={[AppTypo.caption.semiBold, { width: 24, textAlign: 'center' }]}>
            {fontSize}
          </Text>
          <VectorIcon
            name="circle-plus"
            font="FontAwesome6"
            color={AppPalette.gray200}
            size={20}
            onPress={() => storeActions.setFontSize(fontSize + 1)}
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
            onPress={() => storeActions.setLineHeight((lineHeight * 10 - 1) / 10)}
          />
          <Text style={[AppTypo.caption.semiBold, { width: 24, textAlign: 'center' }]}>
            {Math.round(lineHeight * 10) / 10}
          </Text>
          <VectorIcon
            name="circle-plus"
            font="FontAwesome6"
            color={AppPalette.gray200}
            size={20}
            onPress={() => storeActions.setLineHeight((lineHeight * 10 + 1) / 10)}
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
        onPress={() => storeActions.setFont(fontName)}
        style={[styles.viewItemFont, font === fontName && styles.viewItemSelected]}>
        <Text style={styles.textItemFont}>{fontName}</Text>
      </TouchableOpacity>
    ),
    [font],
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.title}>{'Cài đặt'}</Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            onPress={handleViewReferences}>
            <Text style={[AppTypo.body.semiBold, { color: AppColors.textFocus }]}>
              {'Xem mục lục'}
            </Text>
            <VectorIcon name="chevron-right" font="FontAwesome5" color={AppColors.textFocus} />
          </TouchableOpacity>
        </View>
        <Text style={styles.titleSection}>{'Font chữ'}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {fontList.map(renderFontItem)}
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
  ...AppTypo.headline.medium,
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
