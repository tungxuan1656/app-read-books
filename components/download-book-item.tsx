import React, { memo } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { AppPalette } from '@/assets'
import { AppTypo } from '@/constants'
import { formatBytes } from '@/utils'
import { VectorIcon } from './Icon'

type BookMeta = {
  id: number
  name: string
  slug: string
  author: string | null
  chapterCount: number | null
  status: string | null
  synopsis: string | null
  lastUpdated: string | null
}

export type ExportedBook = {
  id: number
  bookId: number
  exportUrl: string
  fileSize: number
  exportFormat: string
  exportedAt: string
  updatedAt: string
  book: BookMeta
}

type DownloadBookItemProps = {
  item: ExportedBook
  onDownload: (item: ExportedBook) => void
}

const DownloadBookItem = ({ item, onDownload }: DownloadBookItemProps) => {
  const { book } = item

  const onConfirmDownload = () => {
    Alert.alert('Tải truyện', `Bạn muốn tải "${book?.name ?? 'truyện'}"?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Tải xuống',
        style: 'default',
        onPress: () => onDownload(item),
      },
    ])
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onConfirmDownload}>
      <View style={styles.details}>
        <Text style={[AppTypo.body.medium, { color: AppPalette.gray900 }]} numberOfLines={1}>
          {book?.name ?? 'Truyện không tên'}
        </Text>
        <Text style={[AppTypo.caption.regular, { color: AppPalette.gray500 }]} numberOfLines={1}>
          {(book?.author || 'Không rõ tác giả') + ' • ' + formatBytes(item.fileSize)}
        </Text>
      </View>
      <VectorIcon
        name="download"
        font="Feather"
        size={16}
        color={AppPalette.blue500}
        onPress={onConfirmDownload}
        buttonStyle={{ padding: 8 }}
      />
    </TouchableOpacity>
  )
}

export default memo(DownloadBookItem)

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 72,
    gap: 6,
  },
  details: {
    flex: 1,
    gap: 4,
  },
})
