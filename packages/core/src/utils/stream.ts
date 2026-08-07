/**
 * Parses a Server-Sent Events stream and yields text deltas.
 * Handles OpenAI and Anthropic SSE formats.
 */
export async function* parseSSEStream(
  response: Response
): AsyncGenerator<string> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Response body is not readable')

  const decoder = new TextDecoder()
  let buffer = ''

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

        const json = trimmed.slice(6)
        try {
          yield json
        } catch {
          // skip unparseable lines
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Parses a newline-delimited JSON stream (used by Ollama).
 */
export async function* parseNDJSONStream(
  response: Response
): AsyncGenerator<string> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Response body is not readable')

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        try {
          yield trimmed
        } catch {
          // skip unparseable lines
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}
