import { useEffect, useMemo, useState } from 'react';
import { parseOllamaLikeDict } from '../services/api';

type ArticleEntry = {
  title: string;
  summary: string;
  content: string;
  media: string[]; // list of media URLs or identifiers
  images: string[]; // list of image URLs
  // allow extra keys when using a user-defined schema
  [k: string]: unknown;
};

type UrlMap = Record<string, ArticleEntry>;

type BasicField = { type: 'string' } | { type: 'array', items: 'string' };
type BasicSchema = Record<string, BasicField>;

type Props = {
  // Raw message from the agent (string, object, or array entry). We'll parse it to the required URL map shape.
  message: unknown;
  // Optional user-provided JSON schema describing the per-URL entry fields.
  // Minimal support: { "title": {"type":"string"}, "summary":{"type":"string"}, "content":{"type":"string"}, "media":{"type":"array","items":"string"}, "images":{"type":"array","items":"string"} }
  userSchemaJson?: string;
  onChange?: (data: UrlMap) => void;
};

function isProbablyUrl(s: string): boolean {
  try { const u = new URL(s); return !!u.protocol && !!u.host; } catch { return false; }
}

function ensureEntryDefaults(partial: Partial<ArticleEntry> | undefined): ArticleEntry {
  const p = partial || {};
  return {
    title: String(p.title ?? ''),
    summary: String(p.summary ?? ''),
    content: String(p.content ?? ''),
    media: Array.isArray(p.media) ? p.media.map(String) : [],
    images: Array.isArray(p.images) ? p.images.map(String) : [],
    ...p,
  } as ArticleEntry;
}

function toUrlMap(input: unknown): UrlMap {
  // Accept shapes:
  // - { "https://...": { title, summary, ... }, ... }
  // - { results: same-as-above }
  // - string with JSON/dict-like content
  const normalize = (obj: unknown): UrlMap => {
    const out: UrlMap = {};
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const rec = obj as Record<string, unknown>;
      // Prefer top-level URL keys directly (e.g. { "https://...": { ... } })
      const topEntries = Object.entries(rec);
      const hasUrlKey = topEntries.some(([k]) => isProbablyUrl(k));
      const container: Record<string, unknown> = hasUrlKey
        ? rec
        : ((rec['results'] ?? rec['data']) as Record<string, unknown> | undefined) || rec;

      for (const [k, v] of Object.entries(container)) {
        if (!isProbablyUrl(k)) continue;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          out[k] = ensureEntryDefaults(v as Partial<ArticleEntry>);
        }
      }
    }
    return out;
  };

  if (typeof input === 'string') {
    const parsed = parseOllamaLikeDict(input);
    return normalize(parsed);
  }
  if (Array.isArray(input)) {
    // If it's an array of messages, try to find the first string or object with content
    for (const item of input) {
      if (typeof item === 'string') return toUrlMap(item);
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        const content = rec['content'] ?? rec['text'] ?? rec['message'];
        if (typeof content === 'string' || typeof content === 'object') return toUrlMap(content as unknown);
      }
    }
    return {};
  }
  if (input && typeof input === 'object') {
    return normalize(input);
  }
  return {};
}

function parseUserSchema(json?: string): BasicSchema | null {
  if (!json) return null;
  try {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
    // keep only supported field types
    const out: BasicSchema = {};
    for (const [k, v] of Object.entries(obj as Record<string, any>)) {
      if (!k) continue;
      if (v && typeof v === 'object') {
        if (v.type === 'string') out[k] = { type: 'string' };
        if (v.type === 'array' && (v.items === 'string' || (v.items && v.items.type === 'string'))) {
          out[k] = { type: 'array', items: 'string' } as BasicField;
        }
      }
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

export default function MessageSchemaCard({ message, userSchemaJson, onChange }: Props) {
  const [data, setData] = useState<UrlMap>({});
  const [newUrl, setNewUrl] = useState('');
  const [schemaText, setSchemaText] = useState(userSchemaJson || '');
  // For array fields add-inputs, track pending text per url+field key
  const [pending, setPending] = useState<Record<string, string>>({});

  const schema = useMemo<BasicSchema | null>(() => parseUserSchema(schemaText) || null, [schemaText]);
  const [fetchedDefault, setFetchedDefault] = useState<BasicSchema | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Load default schema from public folder, fallback to hardcoded defaults
    fetch('/article-entry-schema.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        if (j && typeof j === 'object' && !Array.isArray(j)) {
          const parsed = parseUserSchema(JSON.stringify(j));
          setFetchedDefault(parsed);
        } else {
          setFetchedDefault(null);
        }
      })
      .catch(() => { setFetchedDefault(null); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const initial = toUrlMap(message);
    setData(initial);
  }, [message]);

  useEffect(() => {
    onChange?.(data);
  }, [data, onChange]);

  function addUrl() {
    const u = newUrl.trim();
    if (!u) return;
    if (!isProbablyUrl(u)) return;
    if (data[u]) return;
    setData({ ...data, [u]: ensureEntryDefaults(undefined) });
    setNewUrl('');
  }

  function removeUrl(u: string) {
    const { [u]: _, ...rest } = data;
    setData(rest);
  }

  function setField(u: string, key: string, val: unknown) {
    setData((prev) => ({
      ...prev,
      [u]: { ...prev[u], [key]: val },
    }));
  }

  function renderField(u: string, key: string, field: BasicField | undefined) {
    const value = (data[u] as any)?.[key];
    // Default types: known keys get types if schema not provided
    const effectiveField: BasicField = field || (key === 'media' || key === 'images' ? { type: 'array', items: 'string' } : { type: 'string' });

    if (effectiveField.type === 'array') {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      const pendingKey = `${u}:${key}`;
      const newItem = pending[pendingKey] ?? '';
      return (
        <div style={{ display: 'grid', gap: 6 }}>
          <label style={{ fontWeight: 600 }}>{key}</label>
          {arr.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {arr.map((it, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    value={it}
                    onChange={(e) => {
                      const next = arr.slice();
                      next[idx] = e.target.value;
                      setField(u, key, next);
                    }}
                    style={{ flex: 1, padding: 6, border: '1px solid #ddd', borderRadius: 4 }}
                  />
                  <button type="button" onClick={() => setField(u, key, arr.filter((_, i) => i !== idx))} aria-label={`Remove ${key} item`}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder={`Add ${key} item`}
              value={newItem}
              onChange={(e) => setPending({ ...pending, [pendingKey]: e.target.value })}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newItem.trim()) { setField(u, key, [...arr, newItem.trim()]); setPending({ ...pending, [pendingKey]: '' }); } } }}
              style={{ flex: 1, padding: 6, border: '1px solid #ddd', borderRadius: 4 }}
            />
            <button type="button" onClick={() => { if (newItem.trim()) { setField(u, key, [...arr, newItem.trim()]); setPending({ ...pending, [pendingKey]: '' }); } }}>Add</button>
          </div>
        </div>
      );
    }

    // string field
    return (
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>{key}</span>
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => setField(u, key, e.target.value)}
          rows={key === 'content' ? 6 : 2}
          style={{ padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
        />
      </label>
    );
  }

  const defaultFields: BasicSchema = useMemo(() => ({
    title: { type: 'string' },
    summary: { type: 'string' },
    content: { type: 'string' },
    media: { type: 'array', items: 'string' },
    images: { type: 'array', items: 'string' },
  }), []);

  const effectiveSchema = schema ?? fetchedDefault ?? defaultFields;
  const jsonOutput = useMemo(() => JSON.stringify(data, null, 2), [data]);

  return (
    <article style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#fff' }}>
      <h4 style={{ marginTop: 0 }}>Message JSON 																																																		→ URL map form</h4>
      <p style={{ marginTop: 0, color: '#555' }}>
        Parses the agent's message as JSON and fills the form using the required schema: {'{ <URL>: { title, summary, content, media[], images[] } }'}.
        You can paste a custom schema below to add/alter fields (string and array-of-string supported).
      </p>

      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Custom schema (optional)</summary>
        <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
          <textarea
            value={schemaText}
            onChange={(e) => setSchemaText(e.target.value)}
            placeholder={'{"title":{"type":"string"},"summary":{"type":"string"},"content":{"type":"string"},"media":{"type":"array","items":"string"},"images":{"type":"array","items":"string"}}'}
            rows={6}
            style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
          />
          <span style={{ color: schema ? '#16a34a' : '#999' }}>{schema ? 'Schema applied' : 'Using default schema'}</span>
        </div>
      </details>

      <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="url"
            placeholder="https://example.com/article"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
            style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
          />
          <button type="button" onClick={addUrl} disabled={!newUrl.trim()}>Add URL</button>
        </div>

        {Object.keys(data).length === 0 && (
          <div style={{ color: '#666' }}>No URL entries detected in the message yet.</div>
        )}

        {Object.entries(data).map(([u]) => (
          <section key={u} style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <a href={u} target="_blank" rel="noreferrer" style={{ wordBreak: 'break-all' }}>{u}</a>
              <button type="button" onClick={() => removeUrl(u)} aria-label={`Remove ${u}`}>Remove</button>
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              {Object.entries(effectiveSchema).map(([key, field]) => (
                <div key={key}>{renderField(u, key, field)}</div>
              ))}
            </div>
          </section>
        ))}

        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Export JSON</summary>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{jsonOutput}</pre>
        </details>
      </div>
    </article>
  );
}
