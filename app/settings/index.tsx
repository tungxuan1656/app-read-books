import { AppColors, AppPalette } from '@/assets'
import { Screen } from '@/components/screen'
import { Divider } from '@/components/screen'
import { SettingItem } from '@/components/setting-item'
import { DEFAULT_SETTING_CONFIGS } from '@/constants'
import React from 'react'
import { FlatList, ListRenderItem, TouchableOpacity, Text, View } from 'react-native'
import { SettingConfig } from '@/constants/setting-configs'
import { AppTypo } from '@/constants'
import { VectorIcon } from '@/components/icon'
import { router } from 'expo-router'

export default function Settings() {
  const renderItem: ListRenderItem<SettingConfig> = React.useCallback(({ item }) => {
    return <SettingItem config={item} />
  }, [])

  const renderFooter = () => (
    <View style={{ padding: 16, marginTop: 16 }}>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'white',
          padding: 16,
          borderRadius: 12,
          justifyContent: 'space-between',
        }}
        onPress={() => router.push('/settings/cache-manager')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <VectorIcon name="database" font="FontAwesome6" size={18} color={AppPalette.gray600} />
          <Text style={AppTypo.body.semiBold}>Quản lý dữ liệu</Text>
        </View>
        <VectorIcon name="angle-right" font="FontAwesome6" size={14} color={AppPalette.gray400} />
      </TouchableOpacity>
    </View>
  )

  return (
    <Screen.Container>
      <Screen.Header title="Cài đặt" />
      <Divider />
      <Screen.Content style={{ backgroundColor: AppColors.bgExtra }}>
        <FlatList
          data={DEFAULT_SETTING_CONFIGS}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          ItemSeparatorComponent={Divider}
          contentContainerStyle={{ flexGrow: 1 }}
          ListFooterComponent={renderFooter}
        />
      </Screen.Content>
    </Screen.Container>
  )
}
