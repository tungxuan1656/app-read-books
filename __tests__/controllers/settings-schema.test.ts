import {
  DEFAULT_SETTINGS,
  migratePersistedSettings,
  normalizeAIActions,
} from '@/controllers/settings-schema'

describe('settings-schema', () => {
  it('normalizes legacy JSON string actions', () => {
    const actions = normalizeAIActions(
      JSON.stringify([
        { key: 'translate', name: 'Translate', prompt: 'Do it' },
      ]),
    )

    expect(actions).toHaveLength(1)
    expect(actions[0].key).toBe('translate')
  })

  it('falls back to defaults for invalid actions payload', () => {
    const actions = normalizeAIActions('{bad json')
    expect(actions).toEqual(DEFAULT_SETTINGS.AI_PROCESS_ACTIONS)
  })

  it('migrates legacy settings with string AI_PROCESS_ACTIONS', () => {
    const migrated = migratePersistedSettings({
      COPILOT_MODEL: 'gpt-4o-mini',
      AI_PROCESS_ACTIONS: JSON.stringify([
        { key: 'summary', name: 'Summary', prompt: 'Summarize' },
      ]),
    })

    expect(migrated.COPILOT_MODEL).toBe('gpt-4o-mini')
    expect(Array.isArray(migrated.AI_PROCESS_ACTIONS)).toBe(true)
    expect(migrated.AI_PROCESS_ACTIONS[0].key).toBe('summary')
  })
})
