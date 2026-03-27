import { getProvider, registerProvider } from '@/services/ai-provider-registry'

describe('ai-provider-registry', () => {
  it('registers and resolves provider by type', async () => {
    registerProvider('copilot', () => ({
      name: 'TestProvider',
      processContent: async () => 'ok',
    }))

    const provider = getProvider('copilot')
    const result = await provider.processContent('prompt', 'content')

    expect(provider.name).toBe('TestProvider')
    expect(result).toBe('ok')
  })
})
