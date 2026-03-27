import { type AIAction } from '@/@types/settings'
import { normalizeAIActions } from '@/controllers/settings-schema'
import useAppStore from '@/controllers/store'

export const getAIActions = (): AIAction[] => {
  const actions = useAppStore.getState().settings.AI_PROCESS_ACTIONS
  return normalizeAIActions(actions)
}

export const getActionByKey = (key: string): AIAction | undefined => {
  return getAIActions().find((a) => a.key === key)
}
