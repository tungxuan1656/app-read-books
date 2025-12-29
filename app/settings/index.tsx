import { AppColors, AppPalette } from '@/assets'
import { Divider } from '@/components/divider'
import { Screen } from '@/components/screen'
import { SettingItem } from '@/components/setting-item'
import { VectorIcon } from '@/components/vector-icon'
import { AppTypo } from '@/constants'
import { SETTING_GROUPS, SettingGroup } from '@/constants/setting-configs'
import { router } from 'expo-router'
import React from 'react'
import { SectionList, Text, TouchableOpacity, View } from 'react-native'

export default function Settings() {
  const renderItem = React.useCallback(({ item }: { item: any }) => {
    return <SettingItem config={item} />
  }, [])

  const renderSectionHeader = React.useCallback(({ section: { title } }: { section: any }) => {
    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: AppColors.bgExtra }}>
        <Text style={[AppTypo.body.semiBold, { color: AppPalette.gray600 }]}>{title}</Text>
      </View>
    )
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
        <SectionList
          sections={SETTING_GROUPS.map((g) => ({ title: g.title, data: g.configs }))}
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
