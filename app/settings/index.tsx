import { router } from 'expo-router'
import React from 'react'
import { SectionList, Text, TouchableOpacity, View } from 'react-native'

import { AppColors } from '@/assets'
import { Divider } from '@/components/divider'
import { Screen } from '@/components/screen'
import { SettingItem } from '@/components/setting-item'
import { VectorIcon } from '@/components/vector-icon'
import { SETTING_GROUPS } from '@/constants/setting-configs'
import { useSettingsStore } from '@/controllers/stores'

export default function Settings() {
  const networkLoggerEnabled = useSettingsStore.use.networkLoggerEnabled()

  const renderItem = React.useCallback(({ item }: { item: any }) => {
    return <SettingItem config={item} />
  }, [])

  const renderSectionHeader = React.useCallback(
    ({ section: { title } }: { section: any }) => {
      return (
        <View className='bg-slate-50 px-4 py-3'>
          <Text className='text-sm font-semibold text-gray-600'>{title}</Text>
        </View>
      )
    },
    [],
  )

  const renderFooter = () => (
    <View className='mt-4 p-4'>
      <TouchableOpacity
        className='flex-row items-center justify-between rounded-xl bg-white p-4'
        onPress={() => router.push('/settings/cache-manager')}>
        <View className='flex-row items-center gap-3'>
          <VectorIcon
            name='database'
            font='FontAwesome6'
            size={18}
            color={AppColors.gray600}
          />
          <Text className='text-sm font-semibold'>Quản lý dữ liệu</Text>
        </View>
        <VectorIcon
          name='angle-right'
          font='FontAwesome6'
          size={14}
          color={AppColors.gray400}
        />
      </TouchableOpacity>

      <TouchableOpacity
        className='mt-3 flex-row items-center justify-between rounded-xl bg-white p-4'
        onPress={() => router.push('/settings/network-logger')}>
        <View className='flex-row items-center gap-3'>
          <VectorIcon
            name='bug'
            font='MaterialCommunityIcons'
            size={18}
            color={AppColors.gray600}
          />
          <View>
            <Text className='text-sm font-semibold'>Network Logger</Text>
            <Text className='text-xs text-gray-500'>
              {networkLoggerEnabled ? 'Đang bật' : 'Đang tắt'}
            </Text>
          </View>
        </View>
        <VectorIcon
          name='angle-right'
          font='FontAwesome6'
          size={14}
          color={AppColors.gray400}
        />
      </TouchableOpacity>
    </View>
  )

  return (
    <Screen.Container>
      <Screen.Header title='Cài đặt' />
      <Divider />
      <Screen.Content className='bg-slate-50'>
        <SectionList
          sections={SETTING_GROUPS.map((g) => ({
            title: g.title,
            data: g.configs,
          }))}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.key}
          ItemSeparatorComponent={Divider}
          contentContainerStyle={{ flexGrow: 1 }}
          ListFooterComponent={renderFooter}
          stickySectionHeadersEnabled={false}
        />
      </Screen.Content>
    </Screen.Container>
  )
}
