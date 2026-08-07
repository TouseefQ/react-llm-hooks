import type { AIProvider, Message, StreamOptions } from '../types'
import { parseNDJSONStream } from '../utils/stream'

export function createOllamaProvider(baseUrl?: string): AIProvider {
  const base = (baseUrl ?? 'http://localhost:11434').replace(/\/$/, '')

  async function streamRequest(
    messages: Array<{ role: string; content: string }>,
    model: string,
    options: StreamOptions
  ): Promise<ReadableStream<string>> {
    const response = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: {
          temperature: options.temperature,
          num_predict: options.maxTokens,
        },
      }),
      signal: options.signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama error ${response.status}: ${error}`)
    }

    return new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const chunk of parseNDJSONStream(response)) {
            const parsed = JSON.parse(chunk)
            const delta = parsed.message?.content
            if (delta) controller.enqueue(delta)
            if (parsed.done) break
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
      const model = options.model ?? 'llama3'
      return streamRequest(
        messages.map((m) => ({ role: m.role, content: m.content })),
        model,
        options
      )
    },

    async complete(prompt: string, options: StreamOptions) {
      const model = options.model ?? 'llama3'
      return streamRequest([{ role: 'user', content: prompt }], model, options)
    },
  }
}
