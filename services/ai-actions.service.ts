import { type AIAction } from '@/@types/settings'
import { normalizeAIActions } from '@/controllers/settings-schema'
import { useSettingsStore } from '@/controllers/stores'

export const getAIActions = (): AIAction[] => {
  const actions = useSettingsStore.getState().settings.AI_PROCESS_ACTIONS
  return normalizeAIActions(actions)
}

export const getActionByKey = (key: string): AIAction | undefined => {
  return getAIActions().find((a) => a.key === key)
}
