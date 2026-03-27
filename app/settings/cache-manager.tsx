import React, { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'

import { Divider } from '@/components/divider'
import { GToast } from '@/components/g-toast'
import { Screen } from '@/components/screen'
import { VectorIcon } from '@/components/vector-icon'
import { dbService } from '@/services/database.service'

const CacheManagement = () => {
  const [stats, setStats] = useState<{ totalChapters: number }>({
    totalChapters: 0,
  })
  const [loading, setLoading] = useState(false)

  const loadStats = useCallback(async () => {
    try {
      const data = await dbService.getCacheStats()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const handleClearAllCache = useCallback(() => {
    Alert.alert(
      'Xóa toàn bộ dữ liệu?',
      'Hành động này sẽ xóa tất cả các chương truyện đã xử lý bởi AI. Bạn có chắc chắn không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setLoading(true)
            try {
              await dbService.clearAllCache()
              GToast.success({ message: 'Đã xóa toàn bộ dữ liệu cache' })
              loadStats()
            } catch (_error) {
              GToast.error({ message: 'Có lỗi xảy ra khi xóa dữ liệu' })
            } finally {
              setLoading(false)
            }
          },
        },
      ],
    )
  }, [loadStats])

  return (
    <Screen.Container>
      <Screen.Header title='Quản lý dữ liệu' />
      <Divider />

      <Screen.Content>
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 24, flexGrow: 1 }}>
          <View className='gap-3 rounded-xl bg-gray-100 p-4'>
            <Text className='text-xl font-bold'>Tổng quan</Text>
            <View className='flex-row items-center justify-between'>
              <Text className='text-sm font-normal'>
                Số chương đã xử lý (AI):
              </Text>
              <Text className='text-sm font-semibold'>
                {stats.totalChapters}
              </Text>
            </View>
          </View>

          <View className='gap-2'>
            <Text className='mb-4 text-xl font-bold'>Hành động</Text>

            <TouchableOpacity
              className='flex-row items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3'
              onPress={handleClearAllCache}
              disabled={loading}>
              <VectorIcon
                name='trash'
                font='FontAwesome6'
                size={14}
                color='white'
              />
              <Text className='text-sm font-medium text-white'>
                {loading ? 'Đang xử lý...' : 'Xóa dữ liệu Dịch/Tóm tắt'}
              </Text>
            </TouchableOpacity>

            <Text className='mt-2 text-xs font-normal text-gray-500'>
              * Việc này sẽ không xóa sách gốc, chỉ xóa các bản dịch và tóm tắt
              đã lưu để giải phóng bộ nhớ.
            </Text>
          </View>
        </ScrollView>
      </Screen.Content>
    </Screen.Container>
  )
}

export default CacheManagement
