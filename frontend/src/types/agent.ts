export type AgentMedia = {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  title?: string;
};

export type AgentResultItem = {
  title?: string;
  content: string;
  urls?: string[];
  images?: string[];
  media?: AgentMedia[];
  source?: string;
};

export type AgentResult = AgentResultItem[];
