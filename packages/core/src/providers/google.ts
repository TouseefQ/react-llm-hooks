import type { AIProvider, Message, StreamOptions } from '../types'

export function createGoogleProvider(apiKey: string, baseUrl?: string): AIProvider {
  const base = baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta'

  function toGeminiContents(messages: Message[]) {
    return messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
  }

  async function streamRequest(
    contents: Array<{ role: string; parts: Array<{ text: string }> }>,
    systemInstruction: string | undefined,
    options: StreamOptions
  ): Promise<ReadableStream<string>> {
    const model = options.model ?? 'gemini-1.5-flash'
    const url = `${base}/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      },
    }
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: options.signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google Gemini error ${response.status}: ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('Response body is not readable')

    const decoder = new TextDecoder()
    let buffer = ''

    return new ReadableStream<string>({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed || trimmed === 'data: [DONE]') continue
              if (!trimmed.startsWith('data: ')) continue

              try {
                const parsed = JSON.parse(trimmed.slice(6))
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
                if (text) controller.enqueue(text)
              } catch {
                // skip
              }
            }
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
    async chat(messages: Message[], options: StreamOptions) {
      const system = messages.find((m) => m.role === 'system')?.content
      const contents = toGeminiContents(messages)
      return streamRequest(contents, system, options)
    },

    async complete(prompt: string, options: StreamOptions) {
      const contents = [{ role: 'user', parts: [{ text: prompt }] }]
      return streamRequest(contents, undefined, options)
    },
  }
}
