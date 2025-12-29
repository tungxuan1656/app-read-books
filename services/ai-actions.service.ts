import useAppStore from '@/controllers/store'

export interface AIAction {
  key: string
  name: string
  prompt: string
}

export const getAIActions = (): AIAction[] => {
  const actionsStr = useAppStore.getState().settings.AI_PROCESS_ACTIONS
  let actions: AIAction[] = []
  try {
    if (actionsStr) {
      actions = JSON.parse(actionsStr)
    }
  } catch (e) {
    console.error('Error parsing AI actions', e)
  }
  return actions
}

export const getActionByKey = (key: string): AIAction | undefined => {
  return getAIActions().find((a) => a.key === key)
}
