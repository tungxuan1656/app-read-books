import { AppColors } from '@/assets'
import { Screen } from '@/components/Screen'
import { Divider } from '@/components/Screen'
import { SettingItem } from '@/components/setting-item'
import { DEFAULT_SETTING_CONFIGS } from '@/constants'
import React from 'react'
import { FlatList, ListRenderItem } from 'react-native'
import { SettingConfig } from '@/constants/SettingConfigs'

export default function Settings() {
  const renderItem: ListRenderItem<SettingConfig> = React.useCallback(({ item }) => {
    return <SettingItem config={item} />
  }, [])

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
        />
      </Screen.Content>
    </Screen.Container>
  )
}
