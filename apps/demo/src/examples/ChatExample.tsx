import { useState, useRef, useEffect } from 'react'
import { useChat } from 'react-llm-hooks'
import type { ProviderConfig } from 'react-llm-hooks'

const PROVIDERS = ['openai', 'anthropic', 'google', 'ollama'] as const

const s = {
  card: { background: '#1a1a1a', borderRadius: 12, padding: '1.5rem', border: '1px solid #2a2a2a' } as React.CSSProperties,
  label: { fontSize: '0.8rem', color: '#888', marginBottom: '0.35rem', display: 'block' } as React.CSSProperties,
  input: { width: '100%', padding: '0.5rem 0.75rem', background: '#111', border: '1px solid #333', borderRadius: 6, color: '#e5e5e5', fontSize: '0.9rem', outline: 'none' } as React.CSSProperties,
  row: { display: 'flex', gap: '0.75rem', marginBottom: '1rem' } as React.CSSProperties,
  btn: (variant: 'primary' | 'danger' | 'ghost') => ({
    padding: '0.5rem 1rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
    background: variant === 'primary' ? '#6366f1' : variant === 'danger' ? '#ef4444' : '#2a2a2a',
    color: '#fff',
  } as React.CSSProperties),
  bubble: (role: 'user' | 'assistant') => ({
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    background: role === 'user' ? '#6366f1' : '#2a2a2a',
    color: '#e5e5e5', padding: '0.6rem 0.9rem', borderRadius: 10, maxWidth: '75%',
    fontSize: '0.9rem', lineHeight: 1.55, whiteSpace: 'pre-wrap',
  } as React.CSSProperties),
}

export function ChatExample() {
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]>('openai')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const providerConfig: ProviderConfig =
    provider === 'ollama'
      ? { mode: 'direct', provider: 'ollama', model: model || undefined }
      : { mode: 'direct', provider, apiKey, model: model || undefined }

  const { messages, input, setInput, append, reload, stop, isLoading, error } =
    useChat({ provider: providerConfig })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submit = () => {
    if (!input.trim() || isLoading) return
    append({ role: 'user', content: input.trim() })
    setInput('')
  }

  return (
    <div style={s.card}>
      <div style={s.row}>
        <div style={{ flex: 1 }}>
          <label style={s.label}>Provider</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value as typeof provider)}
            style={{ ...s.input, cursor: 'pointer' }}>
            {PROVIDERS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        {provider !== 'ollama' && (
          <div style={{ flex: 2 }}>
            <label style={s.label}>API Key</label>
            <input type="password" placeholder="sk-..." value={apiKey}
              onChange={(e) => setApiKey(e.target.value)} style={s.input} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <label style={s.label}>Model (optional)</label>
          <input placeholder="default" value={model}
            onChange={(e) => setModel(e.target.value)} style={s.input} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem',
        minHeight: 200, maxHeight: 360, overflowY: 'auto', marginBottom: '1rem',
        padding: '0.5rem', background: '#111', borderRadius: 8 }}>
        {messages.length === 0 && (
          <p style={{ color: '#555', fontSize: '0.85rem', margin: 'auto' }}>
            Start a conversation…
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} style={s.bubble(m.role as 'user' | 'assistant')}>
            {m.content || <span style={{ opacity: 0.4 }}>…</span>}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          {error.message}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submit()}
          style={{ ...s.input, flex: 1 }}
        />
        {isLoading ? (
          <button onClick={stop} style={s.btn('danger')}>Stop</button>
        ) : (
          <>
            <button onClick={submit} style={s.btn('primary')}>Send</button>
            {messages.length > 0 && (
              <button onClick={reload} style={s.btn('ghost')}>Retry</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
