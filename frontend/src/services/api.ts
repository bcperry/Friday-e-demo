import type { AgentMedia, AgentResult, AgentResultItem } from '../types/agent';

// Prefer dev proxy ("/api"); can be overridden with VITE_API_BASE
const API_BASE: string = import.meta.env?.VITE_API_BASE?.replace(/\/$/, '') || '/api';
const USE_MOCK: boolean = String(import.meta.env?.VITE_MOCK_AGENT || '').toLowerCase() === 'true';

function extractFromQuery(query: string): { urls: string[]; subjects: string[] } {
  const urls: string[] = [];
  const subjects: string[] = [];
  const lines = (query || '').split(/\r?\n/).map((l) => l.trim());
  for (const ln of lines) {
    if (/^https?:\/\//i.test(ln)) urls.push(ln);
  }
  const subjMatch = query.match(/Focus on these subjects:\s*([^\n]+)/i);
  if (subjMatch?.[1]) {
    subjMatch[1]
      .split(/,|\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => subjects.push(s));
  }
  return { urls: Array.from(new Set(urls)), subjects: Array.from(new Set(subjects)) };
}

function buildMockAgentResponse(_agentName: string, query: string): string {
  const { urls, subjects } = extractFromQuery(query);
  const first = urls[0];
  const title = subjects.length ? `Findings on ${subjects.join(', ')}` : 'Findings';
  const thoughts = `I will review ${urls.length || 'the provided'} source(s) and focus on ${subjects.length ? subjects.join(', ') : 'the requested topics'}.`;
  const toolCalls = [
    { name: 'web.fetch', args: { urls }, result: '200 OK' },
    { name: 'analyze', args: { subjects }, result: 'completed' },
  ];
  const messages = [
    { role: 'assistant', content: `Here are concise, actionable insights based on ${urls.length} source(s).` },
  ];
  const results: AgentResult = [
    {
      title,
      content:
        urls.length > 0
          ? `Summary derived from ${urls.length} URL(s). Key themes: ${subjects.join(', ') || 'general insights'}.`
          : `Summary based on provided context. Key themes: ${subjects.join(', ') || 'general insights'}.`,
      urls: urls.length ? urls : undefined,
      images: undefined,
      media: undefined,
      source: first,
    },
  ];

  return JSON.stringify({ thoughts, tool_calls: toolCalls, messages, results });
}

export async function getAgents(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/agents`);
    if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`);
    const list: string[] = await res.json();
    // Always add the mock agent to the list for convenience
    return Array.from(new Set([...(Array.isArray(list) ? list : []), 'mock-agent']));
  } catch (err) {
    // If backend isn't reachable, still expose the mock agent so the app remains usable
    return ['mock-agent'];
  }
}

export async function runAgent(params: { agentName: string; query: string }): Promise<string> {
  // Build URL safely without using the URL() constructor on a relative base
  const qs = new URLSearchParams({ agent_name: params.agentName }).toString();
  const url = `${API_BASE}/agent?${qs}`;

  // If the user selected the mock agent, always serve a local mock response
  if (params.agentName === 'mock-agent') {
    return buildMockAgentResponse(params.agentName, params.query);
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: params.query }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Agent call failed: ${res.status} ${txt}`);
    }

    return res.text();
  } catch (err) {
    // In dev or when explicitly enabled, fall back to a mock response so the UI is demoable
    if (import.meta.env?.DEV || USE_MOCK) return buildMockAgentResponse(params.agentName, params.query);
    throw err instanceof Error ? err : new Error('Agent request failed');
  }
}

export function buildQueryFromLists(urls: string[], subjects: string[]): string {
  const cleanedUrls = urls.map((u) => u.trim()).filter(Boolean);
  const cleanedSubjects = subjects.map((s) => s.trim()).filter(Boolean);
  const urlsText = cleanedUrls.join('\n');
  const subjectsText = cleanedSubjects.join(', ');
  return `Please analyze the following data sources:\n${urlsText}\n\nFocus on these subjects: ${subjectsText}\nReturn clear, concise results.`;
}

function toArray<T>(v: unknown): T[] | undefined {
  if (!v) return undefined;
  if (Array.isArray(v)) return v as T[];
  return [v as T];
}

function coerceStringArray(val: unknown): string[] | undefined {
  if (!val) return undefined;
  if (Array.isArray(val)) return val.map((x) => String(x)).filter(Boolean);
  if (typeof val === 'string') return val.split(/\n|,/)?.map((s) => s.trim()).filter(Boolean);
  return undefined;
}

function get(o: unknown, k: string): unknown {
  return typeof o === 'object' && o !== null && k in (o as Record<string, unknown>)
    ? (o as Record<string, unknown>)[k]
    : undefined;
}

export function tryParseAgentResult(text: string): AgentResult | null {
  try {
    const parsed: unknown = JSON.parse(text);
    const root = get(parsed, 'results') ?? parsed;

    const items: unknown[] = Array.isArray(root) ? (root as unknown[]) : [root];
    const normalized: AgentResult = items
      .map((raw) => {
        if (!raw || typeof raw !== 'object') return null;
        const r = raw as Record<string, unknown>;
        const content = (r.content ?? r.text ?? r.summary ?? '') as string;
        const title = (r.title ?? r.heading ?? undefined) as string | undefined;
        const source = (r.source ?? r.url ?? r.href ?? undefined) as string | undefined;
        const urls = coerceStringArray(get(r, 'urls') ?? get(r, 'URLs') ?? get(r, 'links') ?? get(r, 'hrefs'));
        const images = coerceStringArray(get(r, 'images') ?? get(r, 'Images') ?? get(r, 'photos') ?? get(r, 'pictures'));
        const mediaArr = toArray<Partial<AgentMedia> & { href?: unknown }>(get(r, 'media'));
        const media: AgentMedia[] | undefined = mediaArr
          ?.map((m) => {
            const mm = m as Partial<AgentMedia> & { href?: unknown };
            const url = String(mm.url || mm.href || '');
            if (!url) return null;
            return {
              type: (mm.type || 'file') as AgentMedia['type'],
              url,
              title: mm.title || undefined,
            } satisfies AgentMedia;
          })
          .filter(Boolean) as AgentMedia[] | undefined;

        const item: AgentResultItem = { title, content: String(content || ''), urls, images, media, source };
        if (!item.content && !item.urls?.length && !item.images?.length && !item.media?.length) return null;
        return item;
      })
      .filter(Boolean) as AgentResult;

    return normalized.length ? normalized : null;
  } catch {
    return null;
  }
}

export function parseOllamaLikeDict(text: string): unknown {
  const t = (text ?? '').trim();
  try {
    return JSON.parse(t);
  // eslint-disable-next-line no-empty
  } catch {}

  try {
    let s = t.replace(/\bNone\b/g, 'null').replace(/\bTrue\b/g, 'true').replace(/\bFalse\b/g, 'false');
    s = s.replace(/'([^']*)'/g, (_m, inner: string) => {
      const escaped = inner.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return '"' + escaped + '"';
    });
    return JSON.parse(s);
  } catch {
    return { raw: t };
  }
}
