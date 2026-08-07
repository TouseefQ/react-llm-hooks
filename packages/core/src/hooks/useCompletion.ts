import { useState, useCallback, useRef } from 'react'
import type { UseCompletionOptions, UseCompletionReturn } from '../types'
import { resolveProvider } from '../providers'

export function useCompletion(options: UseCompletionOptions): UseCompletionReturn {
  const [completion, setCompletion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setIsLoading(false)
  }, [])

  const complete = useCallback(async (prompt: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setCompletion('')
    setError(null)
    setIsLoading(true)

    try {
      const { provider: providerConfig, onFinish, onError } = optionsRef.current
      const providerConfig_ = providerConfig
      const model = 'model' in providerConfig_ ? providerConfig_.model : undefined

      const provider = resolveProvider(providerConfig_)
      const stream = await provider.complete(prompt, {
        signal: controller.signal,
        model,
      })

      const reader = stream.getReader()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += value
        setCompletion(fullText)
      }

      onFinish?.(fullText)
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      const e = err instanceof Error ? err : new Error(String(err))
      setError(e)
      optionsRef.current.onError?.(e)
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }, [])

  return { completion, complete, stop, isLoading, error }
}
