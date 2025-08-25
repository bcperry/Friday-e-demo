import type { AgentMedia, AgentResult, AgentResultItem } from '../types/agent';

// Prefer dev proxy ("/api"); can be overridden with VITE_API_BASE
const API_BASE: string = import.meta.env?.VITE_API_BASE?.replace(/\/$/, '') || '/api';
const USE_MOCK: boolean = String(import.meta.env?.VITE_MOCK_AGENT || '').toLowerCase() === 'true';

// (removed) extractFromQuery helper was only used for the old mock builder

function buildMockAgentResponse(_agentName: string, _query: string): string {
  // Fixed mock payload as requested by the user
  const payload = {
    response:
      "Here are some recent articles about AI from BBC:\n\n1. **[Elon Musk's AI accused of making explicit AI Taylor Swift videos](https://www.bbc.com/news/articles/cwye62e1ndjo)** - Grok Imagine's \"spicy\" mode made explicit videos of Taylor Swift, according to The Verge and Gizmodo. (8 Aug 2025)\n\n2. **[Using AI to discover new antibiotics](https://www.bbc.com/audio/play/w3ct6vjq)** - How AI has helped find potential new antibiotics to fight gonorrhea and MRSA. (5 days ago)\n\n3. **[Hospital trust showcases use of AI](https://www.bbc.com/news/articles/c5yldj32wy7o)** - One system has increased productivity by 25% in one clinic. (7 days ago)\n\n4. **[GP practice tests AI transcribing tool](https://www.bbc.com/news/articles/c0mlkje4pyyo)** - AI allows doctors to focus on the consultation without manual note-taking. (7 days ago)\n\n5. **[Central Intelligence and AI in Radio](https://www.bbc.com/audio/play/m002h0fj)** - Listener questions are put to the team behind the radio drama Central Intelligence. (14 Aug 2025)\n\n6. **[Is this how AI might eliminate humanity?](https://www.bbc.com/reel/video/p0lwdg8y/is-this-how-ai-might-eliminate-humanity-)** - A new research paper predicts AI autonomy by 2027 could lead to human extinction within a decade. (3 days ago)\n\n7. **[AI answers humans through 1974 message machine](https://www.bbc.com/news/articles/czerjnkkkxzo)** - Visitors to Amberley Museum can connect with AI through a 50-year-old Telex machine. (7 days ago)\n\n8. **[Hospital uses AI to help stroke patients](https://www.bbc.com/news/articles/cm21d32p9k8o)** - The technology helps see patients diagnosed up to an hour earlier. (12 Aug 2025)\n\n9. **[Your AI servant](https://www.bbc.com/audio/play/w3ct6zp1)** - Discussion on what the era of Agentic AI will offer. (29 Jul 2025)",
    chat_history: [
      { role: "user", content: "what are the recent documents about AI on bbc.com?" },
      { role: "assistant", content: "" },
      { role: "tool", content: "" },
      { role: "assistant", content: "" },
      { role: "tool", content: "" },
      {
        role: "assistant",
        content:
          "Here are some recent articles about AI from BBC:\n\n1. **[Elon Musk's AI accused of making explicit AI Taylor Swift videos](https://www.bbc.com/news/articles/cwye62e1ndjo)** - Grok Imagine's \"spicy\" mode made explicit videos of Taylor Swift, according to The Verge and Gizmodo. (8 Aug 2025)\n\n2. **[Using AI to discover new antibiotics](https://www.bbc.com/audio/play/w3ct6vjq)** - How AI has helped find potential new antibiotics to fight gonorrhea and MRSA. (5 days ago)\n\n3. **[Hospital trust showcases use of AI](https://www.bbc.com/news/articles/c5yldj32wy7o)** - One system has increased productivity by 25% in one clinic. (7 days ago)\n\n4. **[GP practice tests AI transcribing tool](https://www.bbc.com/news/articles/c0mlkje4pyyo)** - AI allows doctors to focus on the consultation without manual note-taking. (7 days ago)\n\n5. **[Central Intelligence and AI in Radio](https://www.bbc.com/audio/play/m002h0fj)** - Listener questions are put to the team behind the radio drama Central Intelligence. (14 Aug 2025)\n\n6. **[Is this how AI might eliminate humanity?](https://www.bbc.com/reel/video/p0lwdg8y/is-this-how-ai-might-eliminate-humanity-)** - A new research paper predicts AI autonomy by 2027 could lead to human extinction within a decade. (3 days ago)\n\n7. **[AI answers humans through 1974 message machine](https://www.bbc.com/news/articles/czerjnkkkxzo)** - Visitors to Amberley Museum can connect with AI through a 50-year-old Telex machine. (7 days ago)\n\n8. **[Hospital uses AI to help stroke patients](https://www.bbc.com/news/articles/cm21d32p9k8o)** - The technology helps see patients diagnosed up to an hour earlier. (12 Aug 2025)\n\n9. **[Your AI servant](https://www.bbc.com/audio/play/w3ct6zp1)** - Discussion on what the era of Agentic AI will offer. (29 Jul 2025)",
      },
    ],
    tools_called: [
      {
        name: 'list_links_with_descriptions_tool',
        arguments: {
          now: '2025-08-24 20:00',
          url: 'https://www.bbc.com/search?q=AI',
          max_links: 10,
        },
        results:
          '{\n  "https://www.bbc.com/watch-live-news/": "Watch Live",\n  "https://www.bbc.com/": "British Broadcasting Corporation",\n  "https://www.bbc.com/news": "News",\n  "https://www.bbc.com/sport": "Sport",\n  "https://www.bbc.com/business": "Business",\n  "https://www.bbc.com/innovation": "Innovation",\n  "https://www.bbc.com/culture": "Culture",\n  "https://www.bbc.com/arts": "Arts",\n  "https://www.bbc.com/travel": "Travel",\n  "https://www.bbc.com/future-planet": "Earth"\n}',
      },
      {
        name: 'extract_article_content_tool',
        arguments: {
          now: '2025-08-24 20:00',
          url: 'https://www.bbc.com/search?q=AI',
          use_javascript: true,
        },
        results:
          '{"url":"https://www.bbc.com/search?q=AI","title":"BBC","text":"Elon Musk\'s AI accused of making explicit AI Taylor Swift videos\\n\\nUsing AI to discover new antibiotics\\n\\nHospital trust showcases use of AI\\n\\nGP practice tests AI transcribing tool\\n\\nCentral Intelligence and AI in Radio\\n\\nIs this how AI might eliminate humanity?\\n\\nAI answers humans through 1974 message machine\\n\\nHospital uses AI to help stroke patients\\n\\nYour AI servant","excerpt":"Elon Musk\'s AI accused of making explicit AI Taylor Swift videos Using AI to discover new antibiotics Hospital trust showcases use of AI","images":[{"src":"https://static.files.bbci.co.uk/bbcdotcom/web/20250814-092707-b0ec5bc3fc-web-2.27.1-1/grey-placeholder.png","alt":"","title":"","width":null,"height":null},{"src":"https://ichef.bbci.co.uk/news/480/cpsprodpb/ccc1/live/af6d2f90-72b9-11f0-af20-030418be2ca5.png.webp","alt":"Taylor Swift smiling wearing a black beanie hat and black jacket.","title":"","width":null,"height":null},{"src":"https://static.files.bbci.co.uk/bbcdotcom/web/20250814-092707-b0ec5bc3fc-web-2.27.1-1/grey-placeholder.png","alt":"","title":"","width":null,"height":null},{"src":"https://ichef.bbci.co.uk/images/ic/480x270/p0lxzmkl.jpg.webp","alt":"Health Check, Health Check, Using AI to discover new antibiotics","title":"","width":null,"height":null},{"src":"https://static.files.bbci.co.uk/bbcdotcom/web/20250814-092707-b0ec5bc3fc-web-2.27.1-1/grey-placeholder.png","alt":"","title":"","width":null,"height":null},{"src":"https://ichef.bbci.co.uk/news/480/cpsprodpb/8249/live/c473c6d0-79ec-11f0-ab3e-bd52082cd0ae.jpg.webp","alt":"Peter Kyle is in the foreground wearing a health uniform and sitting next to equipment. David Mak is in the background.","title":"","width":null,"height":null},{"src":"https://static.files.bbci.co.uk/bbcdotcom/web/20250814-092707-b0ec5bc3fc-web-2.27.1-1/grey-placeholder.png","alt":"","title":"","width":null,"height":null},{"src":"https://ichef.bbci.co.uk/news/480/cpsprodpb/a015/live/7cd8bc80-7c1d-11f0-a40e-2dd630055bb1.png.webp","alt":"The image shows Dr Ed Klaber standing outdoors in front of a tree with greenery in the background. Dr Klaber is wearing a white and black checked shirt. He is wearing glasses and has a stethoscope around his neck.","title":"","width":null,"height":null},{"src":"https://static.files.bbci.co.uk/bbcdotcom/web/20250814-092707-b0ec5bc3fc-web-2.27.1-1/grey-placeholder.png","alt":"","title":"","width":null,"height":null},{"src":"https://ichef.bbci.co.uk/images/ic/480x270/p0c0bsv1.jpg.webp","alt":"Feedback, Feedback, Central Intelligence and AI in Radio","title":"","width":null,"height":null},{"src":"https://static.files.bbci.co.uk/bbcdotcom/web/20250814-092707-b0ec5bc3fc-web-2.27.1-1/grey-placeholder.png","alt":"","title":"","width":null,"height":null},{"src":"https://ichef.bbci.co.uk/images/ic/480x270/p0lwdzm8.jpg.webp","alt":"Is this how AI might destroy humanity?","title":"","width":null,"height":null},{"src":"https://static.files.bbci.co.uk/bbcdotcom/web/20250814-092707-b0ec5bc3fc-web-2.27.1-1/grey-placeholder.png","alt":"","title":"","width":null,"height":null},{"src":"https://ichef.bbci.co.uk/news/480/cpsprodpb/633f/live/4dcbb030-7b75-11f0-8b0c-831af2dbcc02.jpg.webp","alt":"A man in a red polo shirt demonstrating to two people how a large grey Telex machine works","title":"","width":null,"height":null},{"src":"https://static.files.bbci.co.uk/bbcdotcom/web/20250814-092707-b0ec5bc3fc-web-2.27.1-1/grey-placeholder.png","alt":"","title":"","width":null,"height":null},{"src":"https://ichef.bbci.co.uk/news/480/cpsprodpb/fe3f/live/c2a513c0-779b-11f0-8688-f1caa7903057.jpg.webp","alt":"A man with grey hair wearing a light green t-shirt lies in a hospital bed, propped up against a pillow. He is looking upwards.","title":"","width":null,"height":null},{"src":"https://static.files.bbci.co.uk/bbcdotcom/web/20250814-092707-b0ec5bc3fc-web-2.27.1-1/grey-placeholder.png","alt":"","title":"","width":null,"height":null},{"src":"https://ichef.bbci.co.uk/images/ic/480x270/p0lt0bv1.jpg.webp","alt":"Tech Life, Tech Life, Your AI servant","title":"","width":null,"height":null}],"links":[{"url":"https://www.bbc.com/news/articles/cwye62e1ndjo","text":"Elon Musk\'s AI accused of making explicit AI Taylor Swift videosGrok Imagine\'s \\\"spicy\\\" mode made explicit videos of Taylor Swift, according to The Verge and Gizmodo.8 Aug 2025","title":""},{"url":"https://www.bbc.com/audio/play/w3ct6vjq","text":"Health CheckUsing AI to discover new antibioticsHow AI has helped find potential new antibiotics to fight gonorrhoea and MRSA5 days ago","title":""},{"url":"https://www.bbc.com/news/articles/c5yldj32wy7o","text":"Hospital trust showcases use of AIIt says one system has increased productivity by 25% in one clinic.7 days ago","title":""},{"url":"https://www.bbc.com/news/articles/c0mlkje4pyyo","text":"GP practice tests AI transcribing toolAI allows doctors to focus on the consultation without manual note-taking, a GP practice says.7 days ago","title":""},{"url":"https://www.bbc.com/audio/play/m002h0fj","text":"FeedbackCentral Intelligence and AI in RadioAndrea Catherwood puts listener questions to the team behind drama Central Intelligence.14 Aug 2025","title":""},{"url":"https://www.bbc.com/reel/video/p0lwdg8y/is-this-how-ai-might-eliminate-humanity-","text":"Is this how AI might eliminate humanity?A new research paper predicts AI autonomy by 2027 could lead to human extinction within a decade.3 days ago","title":""},{"url":"https://www.bbc.com/news/articles/czerjnkkkxzo","text":"AI answers humans through 1974 message machineVisitors to Amberley Museum can connect with AI through a 50-year-old Telex machine.7 days ago","title":""},{"url":"https://www.bbc.com/news/articles/cm21d32p9k8o","text":"Hospital uses AI to help stroke patientsThe technology, at Dudley\'s Russells Hall Hospital, sees patients diagnosed up to an hour earlier.12 Aug 2025","title":""},{"url":"https://www.bbc.com/audio/play/w3ct6zp1","text":"Tech LifeYour AI servantWhat will the era of Agentic AI offer us ?29 Jul 2025","title":""}],"headings":[{"tag":"h2","text":"Elon Musk\'s AI accused of making explicit AI Taylor Swift videos"},{"tag":"h2","text":"Using AI to discover new antibiotics"},{"tag":"h2","text":"Hospital trust showcases use of AI"},{"tag":"h2","text":"GP practice tests AI transcribing tool"},{"tag":"h2","text":"Central Intelligence and AI in Radio"},{"tag":"h2","text":"Is this how AI might eliminate humanity?"},{"tag":"h2","text":"AI answers humans through 1974 message machine"},{"tag":"h2","text":"Hospital uses AI to help stroke patients"},{"tag":"h2","text":"Your AI servant"}],"metadata":{"title":"BBC","description":"","site_name":"www.bbc.com","canonical":null,"language":"en-gb","favicon":"https://static.files.bbci.co.uk/bbcdotcom/web/20250814-092707-b0ec5bc3fc-web-2.27.1-1/apple-touch-icon.png","author":null,"published":null,"tags":[]},"word_count":59,"content_length":365,"extraction_method":"enhanced_article_extraction_v2","timestamp":1756083654.5706108}',
      },
    ],
  } as const;

  return JSON.stringify(payload);
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
  return `Please retrieve and review news articles from the following data sources:\n${urlsText}\n\nFocus on these subjects: ${subjectsText}\nReturn clear, concise results.`;
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
