# react-llm-hooks

Provider-agnostic React hooks for LLM integration. Works **without a backend** — drop it into any Vite, CRA, or React app and start streaming in minutes.

## Why react-ai-kit?

| Feature | react-ai-kit | Vercel AI SDK |
|---|---|---|
| No backend required | ✅ | ❌ (requires API routes) |
| Direct browser → LLM | ✅ | ❌ |
| Proxy / backend mode | ✅ | ✅ |
| Stream cancellation | ✅ | ⚠️ limited |
| OpenAI | ✅ | ✅ |
| Anthropic (Claude) | ✅ | ✅ |
| Google Gemini | ✅ | ✅ |
| Ollama (local LLMs) | ✅ | ❌ |
| Next.js required | ❌ | ⚠️ recommended |

## Installation

```bash
npm install react-llm-hooks
# or
pnpm add react-llm-hooks
# or
yarn add react-llm-hooks
```

## Quick Start

### `useChat` — multi-turn conversation

```tsx
import { useChat } from 'react-llm-hooks'

function Chat() {
  const { messages, input, setInput, append, stop, isLoading } = useChat({
    provider: {
      mode: 'direct',
      provider: 'openai',
      apiKey: 'sk-...',
    },
  })

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}><b>{m.role}:</b> {m.content}</div>
      ))}
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={() => append({ role: 'user', content: input })}>Send</button>
      {isLoading && <button onClick={stop}>Stop</button>}
    </div>
  )
}
```

### `useCompletion` — single prompt

```tsx
import { useCompletion } from 'react-llm-hooks'

function Completion() {
  const { completion, complete, stop, isLoading } = useCompletion({
    provider: {
      mode: 'direct',
      provider: 'anthropic',
      apiKey: 'sk-ant-...',
    },
  })

  return (
    <div>
      <button onClick={() => complete('Write a haiku about React')}>Generate</button>
      {isLoading && <button onClick={stop}>Stop</button>}
      <p>{completion}</p>
    </div>
  )
}
```

## Provider Configuration

### OpenAI

```ts
{
  mode: 'direct',
  provider: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4o',          // optional, defaults to gpt-4o
}
```

### Anthropic (Claude)

```ts
{
  mode: 'direct',
  provider: 'anthropic',
  apiKey: 'sk-ant-...',
  model: 'claude-sonnet-5', // optional
}
```

### Google Gemini

```ts
{
  mode: 'direct',
  provider: 'google',
  apiKey: 'AIza...',
  model: 'gemini-1.5-flash', // optional
}
```

### Ollama (local — no API key needed)

```ts
{
  mode: 'direct',
  provider: 'ollama',
  baseUrl: 'http://localhost:11434', // optional, this is the default
  model: 'llama3',
}
```

### Proxy / backend mode

```ts
{
  mode: 'proxy',
  endpoint: '/api/chat',    // your own backend endpoint
}
```

Your backend receives a normalized JSON body `{ type: 'chat' | 'complete', messages, prompt, ... }` and should stream plain text back.

## API Reference

### `useChat(options)`

| Option | Type | Description |
|---|---|---|
| `provider` | `ProviderConfig` | Provider configuration |
| `initialMessages` | `Message[]` | Pre-populate conversation history |
| `onFinish` | `(message: Message) => void` | Called when streaming completes |
| `onError` | `(error: Error) => void` | Called on error |

Returns:

| Property | Type | Description |
|---|---|---|
| `messages` | `Message[]` | Full conversation history |
| `input` | `string` | Controlled input value |
| `setInput` | `(v: string) => void` | Update input |
| `append` | `(msg) => Promise<void>` | Add a message and trigger response |
| `reload` | `() => Promise<void>` | Regenerate last response |
| `stop` | `() => void` | Cancel active stream |
| `isLoading` | `boolean` | Stream in progress |
| `error` | `Error \| null` | Last error |

### `useCompletion(options)`

| Option | Type | Description |
|---|---|---|
| `provider` | `ProviderConfig` | Provider configuration |
| `onFinish` | `(text: string) => void` | Called when streaming completes |
| `onError` | `(error: Error) => void` | Called on error |

Returns:

| Property | Type | Description |
|---|---|---|
| `completion` | `string` | Accumulated streamed text |
| `complete` | `(prompt: string) => Promise<void>` | Run a completion |
| `stop` | `() => void` | Cancel active stream |
| `isLoading` | `boolean` | Stream in progress |
| `error` | `Error \| null` | Last error |

## Running the Demo

```bash
git clone https://github.com/TouseefQ/react-ai-kit
cd react-ai-kit
pnpm install
pnpm build          # build packages/core
pnpm dev            # start demo app at http://localhost:5173
```

## License

MIT
