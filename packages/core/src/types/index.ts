export type Role = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: Role
  content: string
  createdAt?: Date
}

export interface StreamOptions {
  signal?: AbortSignal
  temperature?: number
  maxTokens?: number
  model?: string
}

export interface AIProvider {
  chat(messages: Message[], options: StreamOptions): Promise<ReadableStream<string>>
  complete(prompt: string, options: StreamOptions): Promise<ReadableStream<string>>
}

export type DirectProviderName = 'openai' | 'anthropic' | 'google' | 'ollama'

export type ProviderConfig =
  | {
      mode: 'direct'
      provider: DirectProviderName
      apiKey?: string
      baseUrl?: string
      model?: string
    }
  | {
      mode: 'proxy'
      endpoint: string
      model?: string
    }

export interface UseChatOptions {
  provider: ProviderConfig
  initialMessages?: Message[]
  onFinish?: (message: Message) => void
  onError?: (error: Error) => void
}

export interface UseChatReturn {
  messages: Message[]
  input: string
  setInput: (value: string) => void
  append: (message: Pick<Message, 'role' | 'content'>) => Promise<void>
  reload: () => Promise<void>
  stop: () => void
  isLoading: boolean
  error: Error | null
}

export interface UseCompletionOptions {
  provider: ProviderConfig
  onFinish?: (completion: string) => void
  onError?: (error: Error) => void
}

export interface UseCompletionReturn {
  completion: string
  complete: (prompt: string) => Promise<void>
  stop: () => void
  isLoading: boolean
  error: Error | null
}
