import { AppPalette } from '@/assets'
import { GToast } from '@/components/g-toast'
import { VectorIcon } from '@/components/Icon'
import { Divider, Screen } from '@/components/Screen'
import { AppTypo } from '@/constants'
import { dbService } from '@/services/database.service'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const CacheManagement = () => {
  const [stats, setStats] = useState<{ totalChapters: number }>({ totalChapters: 0 })
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
      'Hành động này sẽ xóa tất cả các chương truyện đã dịch và tóm tắt. Bạn có chắc chắn không?',
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
            } catch (error) {
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
      <Screen.Header title="Quản lý dữ liệu" />
      <Divider />

      <Screen.Content>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statsCard}>
            <Text style={AppTypo.h3.bold}>Tổng quan</Text>
            <View style={styles.statRow}>
              <Text style={AppTypo.body.regular}>Số chương đã xử lý (Dịch/Tóm tắt):</Text>
              <Text style={AppTypo.body.semiBold}>{stats.totalChapters}</Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <Text style={[AppTypo.h3.bold, { marginBottom: 16 }]}>Hành động</Text>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: AppPalette.red500 }]}
              onPress={handleClearAllCache}
              disabled={loading}>
              <VectorIcon name="trash" font="FontAwesome6" size={16} color="white" />
              <Text style={[AppTypo.body.semiBold, { color: 'white' }]}>
                {loading ? 'Đang xử lý...' : 'Xóa toàn bộ dữ liệu cache'}
              </Text>
            </TouchableOpacity>

            <Text style={[AppTypo.caption.regular, { color: AppPalette.gray500, marginTop: 8 }]}>
              * Việc này sẽ không xóa sách gốc, chỉ xóa các bản dịch và tóm tắt đã lưu để giải phóng
              bộ nhớ.
            </Text>
          </View>
        </ScrollView>
      </Screen.Content>
    </Screen.Container>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    marginRight: 4,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  statsCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionsContainer: {
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
})

export default CacheManagement
