import type { AIProvider, ProviderConfig } from '../types'
import { createOpenAIProvider } from './openai'
import { createAnthropicProvider } from './anthropic'
import { createGoogleProvider } from './google'
import { createOllamaProvider } from './ollama'

export function resolveProvider(config: ProviderConfig): AIProvider {
  if (config.mode === 'proxy') {
    return createProxyProvider(config.endpoint)
  }

  switch (config.provider) {
    case 'openai':
      return createOpenAIProvider(config.apiKey ?? '', config.baseUrl)
    case 'anthropic':
      return createAnthropicProvider(config.apiKey ?? '', config.baseUrl)
    case 'google':
      return createGoogleProvider(config.apiKey ?? '', config.baseUrl)
    case 'ollama':
      return createOllamaProvider(config.baseUrl)
  }
}

function createProxyProvider(endpoint: string): AIProvider {
  async function streamRequest(
    body: object,
    signal?: AbortSignal
  ): Promise<ReadableStream<string>> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Proxy error ${response.status}: ${error}`)
    }

    if (!response.body) throw new Error('Response body is not readable')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    return new ReadableStream<string>({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            if (chunk) controller.enqueue(chunk)
          }
        } catch (err: unknown) {
          if ((err as Error)?.name !== 'AbortError') controller.error(err)
        } finally {
          reader.releaseLock()
          controller.close()
        }
      },
    })
  }

  return {
    chat: (messages, options) =>
      streamRequest({ type: 'chat', messages, ...options }, options.signal),
    complete: (prompt, options) =>
      streamRequest({ type: 'complete', prompt, ...options }, options.signal),
  }
}
