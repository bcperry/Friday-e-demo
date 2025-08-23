import { useState } from 'react';

type Props = {
  label: string;
  type: 'text' | 'url';
  placeholder?: string;
  value: string[];
  onChange: (items: string[]) => void;
  suggestions?: string[];
  validateItem?: (val: string) => boolean;
  itemRender?: (val: string) => React.ReactNode;
};

export default function ChipListInput({ label, type, placeholder, value, onChange, suggestions = [], validateItem, itemRender }: Props) {
  const [input, setInput] = useState('');
  const addItem = () => {
    const v = input.trim();
    if (!v) return;
    if (validateItem && !validateItem(v)) return;
    onChange(Array.from(new Set([...value, v])));
    setInput('');
  };
  const addSuggestion = (s: string) => onChange(Array.from(new Set([...value, s])));
  const remove = (x: string) => onChange(value.filter((v) => v !== x));

  return (
    <section style={{ display: 'grid', gap: 8 }}>
      <strong>{label}</strong>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type={type}
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
          style={{ padding: 8, flex: 1, backgroundColor: '#ffffff', color: '#213547', border: '1px solid #ddd', borderRadius: 4 }}
        />
        <button type="button" onClick={addItem}>Add</button>
      </div>
      {suggestions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => addSuggestion(s)} style={{ padding: '4px 8px', borderRadius: 12, border: '1px solid #ddd', background: '#f7f7f7', color: '#213547' }}>
              + {s}
            </button>
          ))}
        </div>
      )}
      {value.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {value.map((v) => (
            <li key={v} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                aria-label={`Remove ${v}`}
                title={`Remove ${v}`}
                onClick={() => remove(v)}
                style={{ border: 'none', background: 'transparent', color: '#c0392b', fontSize: 18, lineHeight: 1, cursor: 'pointer' }}
              >
                ×
              </button>
              <span>{itemRender ? itemRender(v) : v}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
