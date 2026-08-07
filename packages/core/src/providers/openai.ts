import type { AIProvider, Message, StreamOptions } from '../types'
import { parseSSEStream, generateId } from '../utils/stream'

export function createOpenAIProvider(apiKey: string, baseUrl?: string): AIProvider {
  const base = baseUrl ?? 'https://api.openai.com/v1'

  async function streamRequest(
    body: object,
    signal?: AbortSignal
  ): Promise<ReadableStream<string>> {
    const response = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ ...body, stream: true }),
      signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI error ${response.status}: ${error}`)
    }

    return new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const chunk of parseSSEStream(response)) {
            const parsed = JSON.parse(chunk)
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) controller.enqueue(delta)
            if (parsed.choices?.[0]?.finish_reason === 'stop') break
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
      return streamRequest(
        {
          model: options.model ?? 'gpt-4o',
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: options.temperature,
          max_tokens: options.maxTokens,
        },
        options.signal
      )
    },

    async complete(prompt: string, options: StreamOptions) {
      return streamRequest(
        {
          model: options.model ?? 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature,
          max_tokens: options.maxTokens,
        },
        options.signal
      )
    },
  }
}

// keep generateId available to callers that import from this module
export { generateId }
