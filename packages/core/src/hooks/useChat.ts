import { useState, useCallback, useRef } from 'react'
import type { Message, UseChatOptions, UseChatReturn } from '../types'
import { resolveProvider } from '../providers'
import { generateId } from '../utils/stream'

export function useChat(options: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>(options.initialMessages ?? [])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setIsLoading(false)
  }, [])

  const runChat = useCallback(async (currentMessages: Message[]) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setError(null)
    setIsLoading(true)

    const assistantId = generateId()
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', createdAt: new Date() },
    ])

    try {
      const { provider: providerConfig, onFinish, onError } = optionsRef.current
      const model = 'model' in providerConfig ? providerConfig.model : undefined

      const provider = resolveProvider(providerConfig)
      const stream = await provider.chat(currentMessages, {
        signal: controller.signal,
        model,
      })

      const reader = stream.getReader()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullContent += value
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: fullContent } : m
          )
        )
      }

      const finishedMessage: Message = {
        id: assistantId,
        role: 'assistant',
        content: fullContent,
        createdAt: new Date(),
      }
      onFinish?.(finishedMessage)
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        // remove empty assistant message on abort
        setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content))
        return
      }
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      optionsRef.current.onError?.(e)
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }, [])

  const append = useCallback(
    async (message: Pick<Message, 'role' | 'content'>) => {
      const newMessage: Message = {
        id: generateId(),
        role: message.role,
        content: message.content,
        createdAt: new Date(),
      }
      const updated = [...messages, newMessage]
      setMessages(updated)
      await runChat(updated)
    },
    [messages, runChat]
  )

  const reload = useCallback(async () => {
    const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === 'user')
    if (lastUserIndex === -1) return
    const sliceEnd = messages.length - lastUserIndex
    const trimmed = messages.slice(0, sliceEnd)
    setMessages(trimmed)
    await runChat(trimmed)
  }, [messages, runChat])

  return { messages, input, setInput, append, reload, stop, isLoading, error }
}
