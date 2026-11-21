import type { SourceId } from "../core/ids";

export interface KnowledgeSource {
  id: SourceId;
  title: string;
  authors?: string[];
  year?: number;
  containerTitle?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  publisher?: string;
}
