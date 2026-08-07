import { useState } from 'react'
import { ChatExample } from './examples/ChatExample'
import { CompletionExample } from './examples/CompletionExample'

const tabs = ['Chat', 'Completion'] as const
type Tab = (typeof tabs)[number]

export default function App() {
  const [tab, setTab] = useState<Tab>('Chat')

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        react-ai-kit
      </h1>
      <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Provider-agnostic React hooks for LLM integration
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: tab === t ? '#6366f1' : '#1e1e1e',
              color: tab === t ? '#fff' : '#888',
              fontWeight: tab === t ? 600 : 400,
              fontSize: '0.9rem',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Chat' && <ChatExample />}
      {tab === 'Completion' && <CompletionExample />}
    </div>
  )
}
