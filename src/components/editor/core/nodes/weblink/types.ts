import type { NodeKey, SerializedLexicalNode, Spread } from "lexical";

export type WeblinkFormat = "inline" | "small" | "wide";

export interface WeblinkMetadata {
  description?: string;
  icon?: string;
  image?: string;
  title: string;
  url: string;
}

export type WeblinkMetadataFetcher = (
  url: string,
  options?: { signal?: AbortSignal }
) => Promise<Partial<WeblinkMetadata> | null | undefined>;

export interface WeblinkPayload {
  description?: string;
  format?: WeblinkFormat;
  icon?: string;
  image?: string;
  key?: NodeKey;
  title?: string;
  url: string;
}

export type SerializedWeblinkNode = Spread<
  {
    description?: string;
    format: WeblinkFormat;
    icon?: string;
    image?: string;
    title: string;
    url: string;
  },
  SerializedLexicalNode
>;
