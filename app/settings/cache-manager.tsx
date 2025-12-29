import { AppPalette } from '@/assets'
import { GToast } from '@/components/g-toast'
import { VectorIcon } from '@/components/icon'
import { Divider, Screen } from '@/components/screen'
import { AppTypo } from '@/constants'
import { dbService } from '@/services/database.service'
import { clearTTSFolder } from '@/services/tts.service'
import { formatBytes, getDirectorySize } from '@/utils/file-system.helpers'
import { Directory, Paths } from 'expo-file-system'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const CacheManagement = () => {
  const [stats, setStats] = useState<{ totalChapters: number }>({ totalChapters: 0 })
  const [ttsCacheSize, setTtsCacheSize] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  const loadStats = useCallback(async () => {
    try {
      const data = await dbService.getCacheStats()
      setStats(data)

      const ttsDir = new Directory(Paths.document, 'tts_audio')
      const size = await getDirectorySize(ttsDir.uri)
      setTtsCacheSize(size)
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

  const handleClearTTSCache = useCallback(() => {
    Alert.alert(
      'Xóa cache Audio?',
      'Hành động này sẽ xóa tất cả các file audio TTS đã tải về. Bạn sẽ cần tải lại khi nghe.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setLoading(true)
            try {
              await clearTTSFolder()
              GToast.success({ message: 'Đã xóa cache Audio TTS' })
              loadStats()
            } catch (error) {
              GToast.error({ message: 'Có lỗi xảy ra khi xóa cache Audio' })
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
        <ScrollView contentContainerStyle={styles.content} style={{ flex: 1 }}>
          <View style={styles.statsCard}>
            <Text style={AppTypo.h3.bold}>Tổng quan</Text>
            <View style={styles.statRow}>
              <Text style={AppTypo.body.regular}>Số chương đã xử lý (Dịch/Tóm tắt):</Text>
              <Text style={AppTypo.body.semiBold}>{stats.totalChapters}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={AppTypo.body.regular}>Dung lượng Audio TTS:</Text>
              <Text style={AppTypo.body.semiBold}>{formatBytes(ttsCacheSize)}</Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <Text style={[AppTypo.h3.bold, { marginBottom: 16 }]}>Hành động</Text>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: AppPalette.red500 }]}
              onPress={handleClearAllCache}
              disabled={loading}>
              <VectorIcon name="trash" font="FontAwesome6" size={14} color="white" />
              <Text style={[AppTypo.body.medium, { color: 'white' }]}>
                {loading ? 'Đang xử lý...' : 'Xóa dữ liệu Dịch/Tóm tắt'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: AppPalette.orange500 }]}
              onPress={handleClearTTSCache}
              disabled={loading}>
              <VectorIcon name="music" font="FontAwesome6" size={14} color="white" />
              <Text style={[AppTypo.body.medium, { color: 'white' }]}>
                {loading ? 'Đang xử lý...' : 'Xóa cache Audio TTS'}
              </Text>
            </TouchableOpacity>

            <Text style={[AppTypo.caption.regular, { color: AppPalette.gray500, marginTop: 8 }]}>
              * Việc này sẽ không xóa sách gốc, chỉ xóa các bản dịch, tóm tắt và audio đã lưu để
              giải phóng bộ nhớ.
            </Text>
          </View>
        </ScrollView>
      </Screen.Content>
    </Screen.Container>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 24,
    flexGrow: 1,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
  },
})

export default CacheManagement
