import { createContext, useContext } from "react";

import type { WeblinkMetadata, WeblinkMetadataFetcher } from "./types";

/**
 * Normalizes arbitrary scraped metadata (e.g. from metascraper, open-graph-scraper,
 * or custom microservices) into a clean Partial<WeblinkMetadata> object.
 */
export function normalizeWeblinkMetadata(
  raw: unknown,
  fallbackUrl: string
): Partial<WeblinkMetadata> {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const record = raw as Record<string, unknown>;

  const pickString = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const val = record[key];
      if (typeof val === "string" && val.trim().length > 0) {
        return val.trim();
      }
    }
    return undefined;
  };

  const title = pickString("title", "og:title", "twitter:title");
  const description = pickString(
    "description",
    "og:description",
    "twitter:description"
  );
  const image = pickString("image", "og:image", "twitter:image", "banner");
  const icon = pickString("icon", "logo", "favicon", "shortcut icon");
  const url = pickString("url", "canonical") || fallbackUrl;

  return {
    description,
    icon,
    image,
    title,
    url,
  };
}

/**
 * Adapter helper for `metascraper` (or any scraper library that returns a dictionary).
 * Wraps any scraper function into a standard `WeblinkMetadataFetcher`.
 *
 * @example
 * ```ts
 * // In an Electron/Node backend or API client:
 * const fetcher = createMetascraperAdapter(async (url) => {
 *   const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
 *   return await res.json();
 * });
 * ```
 */
export function createMetascraperAdapter(
  scrapeFn: (
    url: string,
    options?: { signal?: AbortSignal }
  ) => Promise<unknown>
): WeblinkMetadataFetcher {
  return async (url: string, options?: { signal?: AbortSignal }) => {
    try {
      const result = await scrapeFn(url, options);
      return normalizeWeblinkMetadata(result, url);
    } catch {
      return null;
    }
  };
}

export interface EndpointFetcherOptions {
  /** Optional custom RequestInit overrides */
  fetchOptions?: RequestInit;
  /**
   * Custom URL builder. Defaults to `${endpoint}?url=${encodeURIComponent(url)}`
   */
  urlBuilder?: (endpoint: string, targetUrl: string) => string;
}

/**
 * Creates a `WeblinkMetadataFetcher` pointing to a backend API endpoint
 * (e.g. Next.js Route Handler `/api/metadata`, Express route, or Cloudflare Worker).
 *
 * @example
 * ```tsx
 * <Editor weblinkMetadataFetcher={createEndpointWeblinkFetcher("/api/metadata")} />
 * // Or simply:
 * <Editor weblinkMetadataFetcher="/api/metadata" />
 * ```
 */
export function createEndpointWeblinkFetcher(
  endpoint: string,
  options?: EndpointFetcherOptions
): WeblinkMetadataFetcher {
  const urlBuilder =
    options?.urlBuilder ??
    ((base, target) => {
      const separator = base.includes("?") ? "&" : "?";
      return `${base}${separator}url=${encodeURIComponent(target)}`;
    });

  return async (url: string, fetchOpt?: { signal?: AbortSignal }) => {
    try {
      const requestUrl = urlBuilder(endpoint, url);
      const res = await fetch(requestUrl, {
        ...options?.fetchOptions,
        signal: fetchOpt?.signal,
      });

      if (!res.ok) {
        return null;
      }

      const json: unknown = await res.json();
      return normalizeWeblinkMetadata(json, url);
    } catch {
      return null;
    }
  };
}

export interface CachedFetcherOptions {
  /** Cache time-to-live in milliseconds. Default: 5 minutes */
  maxAgeMs?: number;
}

/**
 * Wraps any `WeblinkMetadataFetcher` in an in-memory cache to prevent
 * duplicate network calls for the same URL during the session.
 */
export function createCachedWeblinkFetcher(
  fetcher: WeblinkMetadataFetcher,
  options?: CachedFetcherOptions
): WeblinkMetadataFetcher {
  const cache = new Map<
    string,
    { data: Partial<WeblinkMetadata> | null; timestamp: number }
  >();
  const maxAge = options?.maxAgeMs ?? 1000 * 60 * 5;

  return async (url: string, fetchOpt?: { signal?: AbortSignal }) => {
    const cached = cache.get(url);
    const now = Date.now();
    if (cached && now - cached.timestamp < maxAge) {
      return cached.data;
    }

    const data = await fetcher(url, fetchOpt);
    cache.set(url, { data: data ?? null, timestamp: now });
    return data;
  };
}

/**
 * Resolves a `weblinkMetadataFetcher` prop (which can be an endpoint string or function)
 * into a cached `WeblinkMetadataFetcher`.
 */
export function resolveWeblinkFetcher(
  fetcherOrEndpoint?: WeblinkMetadataFetcher | string
): WeblinkMetadataFetcher | null {
  if (!fetcherOrEndpoint) {
    return null;
  }

  if (typeof fetcherOrEndpoint === "string") {
    return createCachedWeblinkFetcher(
      createEndpointWeblinkFetcher(fetcherOrEndpoint)
    );
  }

  return createCachedWeblinkFetcher(fetcherOrEndpoint);
}

export const WeblinkMetadataContext =
  createContext<WeblinkMetadataFetcher | null>(null);

export function useWeblinkMetadataFetcher(): WeblinkMetadataFetcher | null {
  return useContext(WeblinkMetadataContext);
}
