import type { AIProvider, Message, StreamOptions } from '../types'
import { parseSSEStream } from '../utils/stream'

export function createAnthropicProvider(apiKey: string, baseUrl?: string): AIProvider {
  const base = baseUrl ?? 'https://api.anthropic.com/v1'

  async function streamRequest(
    messages: Array<{ role: string; content: string }>,
    system: string | undefined,
    options: StreamOptions
  ): Promise<ReadableStream<string>> {
    const body: Record<string, unknown> = {
      model: options.model ?? 'claude-sonnet-5',
      max_tokens: options.maxTokens ?? 1024,
      messages,
      stream: true,
    }
    if (system) body.system = system

    const response = await fetch(`${base}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
      signal: options.signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic error ${response.status}: ${error}`)
    }

    return new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const chunk of parseSSEStream(response)) {
            const parsed = JSON.parse(chunk)
            if (parsed.type === 'content_block_delta') {
              const delta = parsed.delta?.text
              if (delta) controller.enqueue(delta)
            }
            if (parsed.type === 'message_stop') break
          }
        } catch (err: unknown) {
          if ((err as Error)?.name !== 'AbortError') controller.error(err)
        } finally {
          controller.close()
        }
      },
    })
  }

  return {
    async chat(messages: Message[], options: StreamOptions) {
      const system = messages.find((m) => m.role === 'system')?.content
      const filtered = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }))
      return streamRequest(filtered, system, options)
    },

    async complete(prompt: string, options: StreamOptions) {
      return streamRequest([{ role: 'user', content: prompt }], undefined, options)
    },
  }
}
