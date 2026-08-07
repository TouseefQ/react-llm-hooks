import { useState } from 'react'
import { useCompletion } from 'react-ai-kit'
import type { ProviderConfig } from 'react-ai-kit'

const PROVIDERS = ['openai', 'anthropic', 'google', 'ollama'] as const

const s = {
  card: { background: '#1a1a1a', borderRadius: 12, padding: '1.5rem', border: '1px solid #2a2a2a' } as React.CSSProperties,
  label: { fontSize: '0.8rem', color: '#888', marginBottom: '0.35rem', display: 'block' } as React.CSSProperties,
  input: { width: '100%', padding: '0.5rem 0.75rem', background: '#111', border: '1px solid #333', borderRadius: 6, color: '#e5e5e5', fontSize: '0.9rem', outline: 'none' } as React.CSSProperties,
  row: { display: 'flex', gap: '0.75rem', marginBottom: '1rem' } as React.CSSProperties,
  btn: (variant: 'primary' | 'danger') => ({
    padding: '0.5rem 1.25rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
    background: variant === 'primary' ? '#6366f1' : '#ef4444', color: '#fff',
  } as React.CSSProperties),
}

export function CompletionExample() {
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]>('openai')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [prompt, setPrompt] = useState('')

  const providerConfig: ProviderConfig =
    provider === 'ollama'
      ? { mode: 'direct', provider: 'ollama', model: model || undefined }
      : { mode: 'direct', provider, apiKey, model: model || undefined }

  const { completion, complete, stop, isLoading, error } = useCompletion({
    provider: providerConfig,
  })

  const submit = () => {
    if (!prompt.trim() || isLoading) return
    complete(prompt.trim())
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

      <div style={{ marginBottom: '1rem' }}>
        <label style={s.label}>Prompt</label>
        <textarea
          rows={4}
          placeholder="Write a haiku about open source software…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && submit()}
          style={{ ...s.input, resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {isLoading ? (
          <button onClick={stop} style={s.btn('danger')}>Stop</button>
        ) : (
          <button onClick={submit} style={s.btn('primary')}>Generate</button>
        )}
        <span style={{ fontSize: '0.8rem', color: '#555', alignSelf: 'center' }}>
          {isLoading ? 'Streaming…' : completion ? 'Done' : 'Ctrl+Enter to run'}
        </span>
      </div>

      {error && (
        <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          {error.message}
        </p>
      )}

      {completion && (
        <div style={{ background: '#111', borderRadius: 8, padding: '1rem',
          fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', color: '#d4d4d4' }}>
          {completion}
        </div>
      )}
    </div>
  )
}
