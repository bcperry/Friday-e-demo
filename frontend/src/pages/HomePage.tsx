import { useState } from 'react';
import AgentForm from '../components/AgentForm';
import KeyValueCards from '../components/KeyValueCards';

export default function HomePage() {
  const [rawAgentText, setRawAgentText] = useState<string>('');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
      <article style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <AgentForm onResult={(t) => setRawAgentText(t)} />
      </article>
      <article style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <KeyValueCards data={rawAgentText} />
      </article>
    </div>
  );
}
