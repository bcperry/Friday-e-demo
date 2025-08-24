import { useEffect, useMemo, useState } from 'react';
import { parseOllamaLikeDict } from '../services/api';

type Card = { id: string; title: string; data: any };

type Props = {
  data?: unknown; // arbitrary object or JSON string
  onChange?: (cards: Card[]) => void;
};

function normalizeToCards(input: unknown): Card[] {
  // Accept shapes:
  // - string JSON/dict
  // - object with keys -> values
  //   if value is object and has 'content', use that for content
  //   else if string/number/bool, use String(value)
  // Special wrapper keys: message/messages/results/data
  const dig = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if ('message' in obj) return obj.message;
    if ('messages' in obj) return obj.messages;
    if ('results' in obj) return obj.results;
    if ('data' in obj) return obj.data;
    return obj;
  };

  let src: any = input;
  if (typeof src === 'string') src = parseOllamaLikeDict(src);
  src = dig(src);
  if (typeof src === 'string') {
    // try parsing again if it's a stringified object
    try { src = JSON.parse(src); } catch { /* keep as string */ }
  }

  const cards: Card[] = [];
  if (src && typeof src === 'object' && !Array.isArray(src)) {
    for (const [k, v] of Object.entries(src as Record<string, unknown>)) {
      const id = k;
      let data: any = {};
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        data = { ...(v as Record<string, unknown>) };
      } else if (Array.isArray(v)) {
        data = { content: (v as unknown[]).map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join('\n') };
      } else if (v != null) {
        data = { content: String(v) };
      }
      cards.push({ id, title: k, data });
    }
  }
  return cards;
}

export default function KeyValueCards({ data, onChange }: Props) {
  const initial = useMemo(() => normalizeToCards(data), [data]);
  const [cards, setCards] = useState<Card[]>(
    initial.length
      ? initial
      : [{ id: 'new-1', title: '', data: { summary: '', content: '', images: [] as string[], media: [] as string[] } }]
  );
  const [pending, setPending] = useState<Record<string, string>>({});

  useEffect(() => {
    // Re-initialize when data changes
    const next = normalizeToCards(data);
    setCards(
      next.length ? next : [{ id: 'new-1', title: '', data: { summary: '', content: '', images: [] as string[], media: [] as string[] } }]
    );
  }, [data]);

  useEffect(() => { onChange?.(cards); }, [cards, onChange]);

  function addCard() {
    const idx = cards.length + 1;
    setCards([
      ...cards,
      { id: `new-${idx}`, title: '', data: { summary: '', content: '', images: [] as string[], media: [] as string[] } },
    ]);
  }

  function removeCard(id: string) {
    setCards(cards.filter((c) => c.id !== id));
  }

  function updateCard(id: string, patch: Partial<Card>) {
    setCards(cards.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function setField(id: string, key: string, value: unknown) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, data: { ...(c.data || {}), [key]: value } } : c)));
  }

  function arrayEditor(
    id: string,
    fieldKey: string,
    items: unknown,
  ) {
    const arr = Array.isArray(items) ? (items as unknown[]) : [];
    const asStrings = arr.map((x) => String(x));
  const pendingKey = `${id}:${fieldKey}`;
  const newItem = pending[pendingKey] ?? '';
    return (
      <div style={{ display: 'grid', gap: 6 }}>
        {asStrings.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {asStrings.map((it, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  value={it}
                  onChange={(e) => {
                    const next = asStrings.slice();
                    next[idx] = e.target.value;
                    setField(id, fieldKey, next);
                  }}
                  style={{ flex: 1, padding: 6, border: '1px solid #ddd', borderRadius: 4 }}
                />
                <button type="button" onClick={() => setField(id, fieldKey, asStrings.filter((_, i) => i !== idx))}>Remove</button>
              </li>
            ))}
          </ul>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder={`Add ${fieldKey} item`}
            value={newItem}
            onChange={(e) => setPending({ ...pending, [pendingKey]: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newItem.trim()) { setField(id, fieldKey, [...asStrings, newItem.trim()]); setPending({ ...pending, [pendingKey]: '' }); } } }}
            style={{ flex: 1, padding: 6, border: '1px solid #ddd', borderRadius: 4 }}
          />
          <button type="button" onClick={() => { if (newItem.trim()) { setField(id, fieldKey, [...asStrings, newItem.trim()]); setPending({ ...pending, [pendingKey]: '' }); } }}>Add</button>
        </div>
      </div>
    );
  }

  function isLikelyImageUrl(u: string): boolean {
    if (!u) return false;
    const url = u.toLowerCase();
    if (url.startsWith('data:image/')) return true;
    if (/[?&]format=(png|jpg|jpeg|webp|gif|bmp)\b/.test(url)) return true;
    return /(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp|\.svg)(\?|#|$)/.test(url);
  }

  function isLikelyVideoUrl(u: string): boolean {
    if (!u) return false;
    const url = u.toLowerCase();
    return /(\.mp4|\.webm|\.ogg|\.m3u8)(\?|#|$)/.test(url);
  }

  function isLikelyAudioUrl(u: string): boolean {
    if (!u) return false;
    const url = u.toLowerCase();
    return /(\.mp3|\.wav|\.ogg|\.m4a)(\?|#|$)/.test(url);
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {cards.map((c) => {
        const dataObj = (c.data && typeof c.data === 'object' && !Array.isArray(c.data)) ? (c.data as Record<string, unknown>) : { content: c.data } as Record<string, unknown>;
        const orderedKeys = Array.from(
          new Set([
            'summary', 'content', 'images', 'media', // preferred order (title is moved to header)
            ...Object.keys(dataObj).filter((k) => !['summary', 'content', 'images', 'media', 'title'].includes(k)),
          ])
        );
        const headerTitle = typeof dataObj['title'] === 'string' && (dataObj['title'] as string).trim()
          ? (dataObj['title'] as string)
          : c.title;
        return (
          <article key={c.id} style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: 8, padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
              <input
                type="text"
                placeholder="Title (key)"
                value={headerTitle}
                onChange={(e) => { updateCard(c.id, { title: e.target.value }); setField(c.id, 'title', e.target.value); }}
                style={{ flex: 1, padding: 8, border: '1px solid #ddd', borderRadius: 6, fontWeight: 600 }}
              />
              <button type="button" onClick={() => removeCard(c.id)} aria-label="Remove card">Remove</button>
            </div>
            <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              {orderedKeys.map((k) => {
                const v = dataObj[k];
                const isString = typeof v === 'string' || v == null;
                const isStringArray = Array.isArray(v) && (v as unknown[]).every((x) => typeof x === 'string' || x == null);
                return (
                  <section key={k}>
                    <label style={{ display: 'grid', gap: 6 }}>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{k}</span>
                      {isString ? (
                        <textarea
                          value={typeof v === 'string' ? v : ''}
                          onChange={(e) => setField(c.id, k, e.target.value)}
                          rows={k === 'content' ? 8 : 3}
                          style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 6 }}
                        />
                      ) : isStringArray ? (
                        <div style={{ display: 'grid', gap: 8 }}>
                          {(k === 'images' || k === 'media') && (v as string[]).length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {(v as string[]).map((item, idx) => {
                                const href = String(item);
                                if (k === 'images' || isLikelyImageUrl(href)) {
                                  return (
                                    <a key={href + idx} href={href} target="_blank" rel="noreferrer">
                                      <img src={href} alt="thumb" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }} />
                                    </a>
                                  );
                                }
                                if (isLikelyVideoUrl(href)) {
                                  return (
                                    <video key={href + idx} src={href} controls style={{ width: 160, height: 100, borderRadius: 6, border: '1px solid #eee', background: '#000' }} />
                                  );
                                }
                                if (isLikelyAudioUrl(href)) {
                                  return (
                                    <audio key={href + idx} src={href} controls style={{ height: 32 }} />
                                  );
                                }
                                return (
                                  <a key={href + idx} href={href} target="_blank" rel="noreferrer" style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 12, background: '#f7f7f7', color: '#213547', textDecoration: 'none' }}>
                                    {href}
                                  </a>
                                );
                              })}
                            </div>
                          )}
                          {arrayEditor(c.id, k, v)}
                        </div>
                      ) : (
                        <pre style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 6, padding: 8, whiteSpace: 'pre-wrap' }}>{JSON.stringify(v, null, 2)}</pre>
                      )}
                    </label>
                  </section>
                );
              })}
            </div>
          </article>
        );
      })}
      <div>
        <button type="button" onClick={addCard}>Add card</button>
      </div>
    </div>
  );
}
