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
  const snapPoints = useMemo(() => [360], [])
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

  const handleClearCache = useCallback(async () => {
    if (!currentBookId) return

    Alert.alert(
      'Xóa Cache',
      'Bạn có muốn xóa toàn bộ cache (tóm tắt và audio) của bộ truyện này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearBookCache(currentBookId)
              Alert.alert('Thành công', 'Đã xóa toàn bộ cache của bộ truyện')
            } catch (error) {
              console.error('Error clearing cache:', error)
              Alert.alert('Lỗi', 'Không thể xóa cache')
            }
          },
        },
      ],
    )
  }, [currentBookId])

  const handleGenerateSummaryAndAudio = useCallback(() => {
    if (!currentBookId) return

    bottomSheetRef.current?.close()
    router.push({
      pathname: '/generate-summary-tts',
      params: { bookId: currentBookId },
    })
  }, [currentBookId])

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
      <>
        <Text style={styles.titleSection}>{'Cỡ chữ'}</Text>
        <View style={styles.viewRow}>
          <VectorIcon
            name="circle-minus"
            font="FontAwesome6"
            color={AppPalette.gray300}
            size={20}
            onPress={() => storeActions.setFontSize(fontSize - 1)}
          />
          <Text style={[AppTypo.caption.semiBold, { width: 24, textAlign: 'center' }]}>
            {fontSize}
          </Text>
          <VectorIcon
            name="circle-plus"
            font="FontAwesome6"
            color={AppPalette.gray300}
            size={20}
            onPress={() => storeActions.setFontSize(fontSize + 1)}
          />
        </View>
      </>
    ),
    [fontSize],
  )

  const lineHeightControls = useMemo(
    () => (
      <>
        <Text style={styles.titleSection}>{'Chiều cao dòng'}</Text>
        <View style={styles.viewRow}>
          <VectorIcon
            name="circle-minus"
            font="FontAwesome6"
            color={AppPalette.gray300}
            size={20}
            onPress={() => storeActions.setLineHeight((lineHeight * 10 - 1) / 10)}
          />
          <Text style={[AppTypo.caption.semiBold, { width: 24, textAlign: 'center' }]}>
            {Math.round(lineHeight * 10) / 10}
          </Text>
          <VectorIcon
            name="circle-plus"
            font="FontAwesome6"
            color={AppPalette.gray300}
            size={20}
            onPress={() => storeActions.setLineHeight((lineHeight * 10 + 1) / 10)}
          />
        </View>
      </>
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
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}>
      <BottomSheetView style={styles.titleContainer}>
        <Text style={styles.title}>{'Cài đặt'}</Text>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
          onPress={handleViewReferences}>
          <Text style={[AppTypo.body.semiBold]}>{'Xem mục lục'}</Text>
          <VectorIcon name="chevron-right" font="FontAwesome5" />
        </TouchableOpacity>
      </BottomSheetView>

      <BottomSheetScrollView
        style={{ flex: 1, marginTop: 44 }}
        contentContainerStyle={styles.scrollContent}>
        <Text style={styles.titleSection}>{'Font chữ'}</Text>
        <BottomSheetScrollView
          horizontal
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          showsHorizontalScrollIndicator={false}>
          {fontList.map(renderFontItem)}
        </BottomSheetScrollView>

        {fontSizeControls}
        {lineHeightControls}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <TouchableOpacity
            style={[styles.viewRow, { marginBottom: 20 }]}
            onPress={handleGenerateSummaryAndAudio}>
            <VectorIcon
              name="download"
              font="FontAwesome6"
              color={AppColors.textActivate}
              size={16}
            />
            <Text style={[AppTypo.body.medium, { color: AppColors.textActivate }]}>
              {'Tạo tóm tắt và audio'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewRow, { marginBottom: 20 }]}
            onPress={handleClearCache}>
            <Text style={[AppTypo.body.medium, { color: AppColors.textValidate }]}>
              {'Xóa cache'}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
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
    backgroundColor: AppPalette.gray300,
    width: 40,
  },
  titleContainer: {
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: AppPalette.gray200,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: AppPalette.gray900,
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  titleSection: {
    marginHorizontal: 20,
    ...AppTypo.body.medium,
    marginTop: 16,
    marginBottom: 8,
  },
  viewItemFont: {
    borderRadius: 30,
    backgroundColor: AppPalette.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewItemSelected: {
    backgroundColor: AppPalette.blue50,
  },
  textItemFont: {
    ...AppTypo.caption.medium,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
})
