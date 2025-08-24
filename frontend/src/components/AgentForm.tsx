import { useEffect, useMemo, useState } from 'react';
import { buildQueryFromLists, getAgents, runAgent, tryParseAgentResult, parseOllamaLikeDict } from '../services/api';
import type { AgentResult } from '../types/agent';
import ChipListInput from './ChipListInput';

type Props = {
  onResult?: (text: string) => void;
};

export default function AgentForm({ onResult }: Props) {
  // Managed lists for websites and subjects
  const [websites, setWebsites] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<AgentResult | null>(null);
  const [dictView, setDictView] = useState<Record<string, unknown> | null>(null);
  // Expand/collapse state for reasoning sections
  const [thoughtsOpen, setThoughtsOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [messageOpen, setMessageOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingAgents(true);
    getAgents()
      .then((list) => {
        if (cancelled) return;
        setAgents(list);
        if (list.length && !selectedAgent) setSelectedAgent(list[0]);
      })
      .catch((e) => !cancelled && setError(e.message || 'Failed to load agents'))
      .finally(() => !cancelled && setLoadingAgents(false));
    return () => {
      cancelled = true;
    };
    // We only want to load agents once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = useMemo(() => {
    const urlsOk = websites.length > 0 && websites.every((w) => {
      try { new URL(w); return true; } catch { return false; }
    });
    return urlsOk && subjects.length > 0 && !!selectedAgent && !submitting;
  }, [websites, subjects, selectedAgent, submitting]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
  setError(null);
  setParsed(null);
  setSubmitting(true);
    try {
  const query = buildQueryFromLists(websites, subjects);
  const text = await runAgent({ agentName: selectedAgent, query });
  const structured = tryParseAgentResult(text);
  setParsed(structured);
  // Always parse Ollama-like dict to show JSON to the user
  const parsedAny = parseOllamaLikeDict(text);
  setDictView((typeof parsedAny === 'object' && parsedAny !== null ? parsedAny : { raw: text }) as Record<string, unknown>);
  onResult?.(text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to run agent';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
  <div style={{ maxWidth: 800, margin: '0 auto', padding: 16, textAlign: 'left' }}>
    <h2>Run Agent on Data Source</h2>
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
  <ChipListInput
        label="Websites"
        type="url"
        placeholder="https://www.bbc.com/news"
        value={websites}
        onChange={setWebsites}
        validateItem={(v) => { try { new URL(v); return true; } catch { return false; } }}
        suggestions={[
          'https://www.bbc.com/news',
          'https://www.cnn.com',
          'https://www.reuters.com',
          'https://www.nytimes.com',
          'https://www.aljazeera.com',
          'https://www.foxnews.com',
          'https://www.theguardian.com/international',
          'https://www.washingtonpost.com/world',
        ]}
        itemRender={(w) => <span style={{ wordBreak: 'break-all' }}>{w}</span>}
      />

  <ChipListInput
        label="Subjects"
        type="text"
        placeholder="russia, border, conflict, policy, protest"
        value={subjects}
        onChange={setSubjects}
        suggestions={[
          'russia',
          'border',
          'ukraine',
          'china',
          'conflict',
          'election',
          'policy',
          'immigration',
          'security',
          'protest',
          'war',
          'crisis',
          'trade',
          'sanction',
          'military',
          'diplomacy',
          'energy',
          'pipeline',
          'territory',
          'ceasefire',
          'treaty',
          'summit',
          'espionage',
          'cyber',
          'nato',
          'un',
          'eu',
          'us',
          'iran',
          'israel',
          'palestine',
          'gaza',
          'biden',
          'putin',
          'zelensky',
          'trump',
          'modi',
          'xi',
          'macron',
          'sunak',
          'erdogan',
          'kim',
        ]}
      />

  <label style={{ display: 'grid', gap: 6 }}>
          <span>Agent</span>
          <select
            disabled={loadingAgents}
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            style={{ padding: 8, backgroundColor: '#ffffff', color: '#213547', border: '1px solid #ddd', borderRadius: 4 }}
          >
            {agents.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

  <button type="submit" disabled={!canSubmit} style={{ padding: '8px 12px' }}>
          {submitting ? 'Running…' : 'Run Agent'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'crimson', marginTop: 12 }}>
          {error}
        </div>
      )}

      {/* Parsed result cards */}
      {parsed && parsed.length > 0 && (
        <section style={{ marginTop: 20, display: 'grid', gap: 12 }}>
          <h3>Results</h3>
          {parsed.map((item, idx) => (
            <article key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fff' }}>
              {item.title && <h4 style={{ marginTop: 0 }}>{item.title}</h4>}
              {item.source && (
                <div style={{ marginBottom: 8 }}>
                  <a href={item.source} target="_blank" rel="noreferrer">
                    {item.source}
                  </a>
                </div>
              )}
              {item.content && <p style={{ whiteSpace: 'pre-wrap', marginTop: 0 }}>{item.content}</p>}
              {item.urls && item.urls.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <strong>Links</strong>
                  <ul style={{ margin: '6px 0 0 18px' }}>
                    {item.urls.map((u) => (
                      <li key={u}>
                        <a href={u} target="_blank" rel="noreferrer">{u}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(item.images?.length || 0) > 0 && (
                <div style={{ marginTop: 8 }}>
                  <strong>Images</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    {item.images!.map((img) => (
                      <a key={img} href={img} target="_blank" rel="noreferrer">
                        <img src={img} alt="result" style={{ maxWidth: 160, maxHeight: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {(item.media?.length || 0) > 0 && (
                <div style={{ marginTop: 8 }}>
                  <strong>Media</strong>
                  <ul style={{ margin: '6px 0 0 18px' }}>
                    {item.media!.map((m, i) => (
                      <li key={i}>
                        <a href={m.url} target="_blank" rel="noreferrer">{m.title || m.url} ({m.type})</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      {/* Reasoning sections: thoughts, tool_calls, messages */}
      {dictView && (
        <section style={{ marginTop: 20, display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <h3 style={{ margin: 0 }}>Agent response</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => { setThoughtsOpen(true); setToolsOpen(true); setMessageOpen(true); }}>
                Expand all
              </button>
              <button type="button" onClick={() => { setThoughtsOpen(false); setToolsOpen(false); setMessageOpen(false); }}>
                Collapse all
              </button>
            </div>
          </div>
          {(() => {
            const dict: Record<string, unknown> = (dictView || {}) as Record<string, unknown>;
            const thoughts = (dict['thoughts'] ?? dict['Thoughts']) as unknown;
            if (!thoughts) return null;
            return (
              <details open={thoughtsOpen} onToggle={(e) => setThoughtsOpen((e.target as HTMLDetailsElement).open)}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Thoughts</summary>
                <div style={{ marginTop: 8 }}>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{String(thoughts)}</pre>
                </div>
              </details>
            );
          })()}
          {(() => {
            const dict: Record<string, unknown> = (dictView || {}) as Record<string, unknown>;
            const toolCalls = (dict['tool_calls'] ?? dict['toolCalls']) as unknown;
            if (!toolCalls || (Array.isArray(toolCalls) && toolCalls.length === 0)) return null;
            const count = Array.isArray(toolCalls) ? toolCalls.length : 1;
            return (
              <details open={toolsOpen} onToggle={(e) => setToolsOpen((e.target as HTMLDetailsElement).open)}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Tool calls ({count})</summary>
                <div style={{ marginTop: 8 }}>
                  {Array.isArray(toolCalls) ? (
                    <ul style={{ margin: '6px 0 0 18px' }}>
                      {toolCalls.map((tc: unknown, i: number) => (
                        <li key={i}>
                          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(tc, null, 2)}</pre>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(toolCalls, null, 2)}</pre>
                  )}
                </div>
              </details>
            );
          })()}
          {(() => {
            const dict: Record<string, unknown> = (dictView || {}) as Record<string, unknown>;
            const msg = (dict['messages'] ?? dict['message']) as unknown;
            if (!msg) return null;
            return (
              <details open={messageOpen} onToggle={(e) => setMessageOpen((e.target as HTMLDetailsElement).open)}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Message</summary>
                <div style={{ marginTop: 8 }}>
                  {Array.isArray(msg) ? (
                    <ul style={{ margin: '6px 0 0 18px' }}>
                      {msg.map((m: unknown, i: number) => (
                        <li key={i}>
                          <pre style={{ whiteSpace: 'pre-wrap' }}>{typeof m === 'string' ? m : JSON.stringify(m, null, 2)}</pre>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2)}</pre>
                  )}
                </div>
              </details>
            );
          })()}
        </section>
      )}
    </div>
  );
}
