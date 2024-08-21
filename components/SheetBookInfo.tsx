import { AppPalette } from '@/assets'
import { AppStyles, AppTypo } from '@/constants'
import { setReadingContext, useReading } from '@/controllers/context'
import { getListFonts } from '@/utils'
import { VectorIcon } from '@/components/Icon'
import { router } from 'expo-router'
import React from 'react'
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'

const SheetBookInfo = ({
  isVisible,
  onClose,
  bookId,
}: {
  bookId: string
  isVisible: boolean
  onClose: () => void
}) => {
  const reading = useReading()
  console.log(bookId)

  const setFont = (font: string) => {
    setReadingContext({ ...reading, font })
  }

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible}>
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={{ flex: 1 }}></View>
        </TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{'Cài đặt'}</Text>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              onPress={() => {
                router.navigate({ pathname: '/references', params: { bookId } })
                onClose()
              }}>
              <Text style={[AppTypo.body.semiBold]}>{'Xem mục lục'}</Text>
              <VectorIcon name="chevron-right" font="FontAwesome5" />
            </TouchableOpacity>
          </View>
          <View>
            <Text style={styles.titleSection}>{'Font chữ'}</Text>
            <ScrollView horizontal contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {getListFonts().map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFont(f)}
                  style={[styles.viewItemFont, reading.font === f && styles.viewItemSelected]}>
                  <Text style={styles.textItemFont}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.titleSection}>{'Cỡ chữ'}</Text>
            <View style={styles.viewRow}>
              <VectorIcon
                name="circle-minus"
                font="FontAwesome6"
                color={AppPalette.gray300}
                size={20}
                onPress={() => setReadingContext({ ...reading, size: reading.size - 1 })}
              />
              <Text style={[AppTypo.caption.semiBold, { width: 24, textAlign: 'center' }]}>
                {reading.size}
              </Text>
              <VectorIcon
                name="circle-plus"
                font="FontAwesome6"
                color={AppPalette.gray300}
                size={20}
                onPress={() => setReadingContext({ ...reading, size: reading.size + 1 })}
              />
            </View>
            <Text style={styles.titleSection}>{'Chiều cao dòng'}</Text>
            <View style={styles.viewRow}>
              <VectorIcon
                name="circle-minus"
                font="FontAwesome6"
                color={AppPalette.gray300}
                size={20}
                onPress={() => setReadingContext({ ...reading, line: reading.line - 0.1 })}
              />
              <Text style={[AppTypo.caption.semiBold, { width: 24, textAlign: 'center' }]}>
                {Math.round(reading.line * 10) / 10}
              </Text>
              <VectorIcon
                name="circle-plus"
                font="FontAwesome6"
                color={AppPalette.gray300}
                size={20}
                onPress={() => setReadingContext({ ...reading, line: reading.line + 0.1 })}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default SheetBookInfo

const styles = StyleSheet.create({
  modalContent: {
    height: 300,
    width: '100%',
    backgroundColor: AppPalette.white,
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    position: 'absolute',
    bottom: 0,
    ...AppStyles.view.shadow3,
  },
  titleContainer: {
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: AppPalette.gray200,
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: AppPalette.gray900,
    fontSize: 16,
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
