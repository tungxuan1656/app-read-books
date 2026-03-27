import React, { memo } from 'react'
import { Alert, Text, TouchableOpacity, View } from 'react-native'

import { cn, formatBytes } from '@/utils'

import { VectorIcon } from './vector-icon'

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
    <TouchableOpacity
      className='h-20 flex-row items-center justify-between gap-1.5 px-4'
      onPress={onConfirmDownload}>
      <View className='flex-1 gap-1'>
        <Text
          className={cn('text-sm font-medium text-gray-900')}
          numberOfLines={1}>
          {book?.name ?? 'Truyện không tên'}
        </Text>
        <Text className='text-xs font-normal text-gray-500' numberOfLines={1}>
          {(book?.author || 'Không rõ tác giả') +
            ' • ' +
            formatBytes(item.fileSize)}
        </Text>
      </View>
      <VectorIcon
        name='download'
        font='Feather'
        size={16}
        color='#3b82f6'
        onPress={onConfirmDownload}
        buttonClassName='p-2'
      />
    </TouchableOpacity>
  )
}

export default memo(DownloadBookItem)
