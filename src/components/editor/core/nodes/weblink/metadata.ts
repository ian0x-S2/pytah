import { createContext, useContext } from "react";

import { sanitizeMediaUrl, sanitizeWebUrl } from "../../url";
import type {
  WeblinkFaviconResolver,
  WeblinkMetadata,
  WeblinkMetadataFetcher,
} from "./types";

const DEFAULT_CACHE_MAX_AGE_MS = 1000 * 60 * 5;
const MAX_CACHE_ENTRIES = 200;

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
  const rawImage = pickString("image", "og:image", "twitter:image", "banner");
  const rawIcon = pickString("icon", "logo", "favicon", "shortcut icon");
  const rawUrl = pickString("url", "canonical");

  const image = rawImage
    ? (sanitizeMediaUrl(rawImage, {
        allowDataImage: false,
        allowRelative: true,
      }) ?? undefined)
    : undefined;
  const icon = rawIcon
    ? (sanitizeMediaUrl(rawIcon, {
        allowDataImage: false,
        allowRelative: true,
      }) ?? undefined)
    : undefined;
  const url =
    (rawUrl ? sanitizeWebUrl(rawUrl) : null) ??
    sanitizeWebUrl(fallbackUrl) ??
    fallbackUrl;

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
 * Wraps any `WeblinkMetadataFetcher` in an in-memory cache with in-flight
 * deduplication and TTL eviction. Failed or aborted lookups are never cached.
 */
export function createCachedWeblinkFetcher(
  fetcher: WeblinkMetadataFetcher,
  options?: CachedFetcherOptions
): WeblinkMetadataFetcher {
  const cache = new Map<
    string,
    { data: Partial<WeblinkMetadata>; timestamp: number }
  >();
  const inFlight = new Map<
    string,
    Promise<Partial<WeblinkMetadata> | null | undefined>
  >();
  const maxAge = options?.maxAgeMs ?? DEFAULT_CACHE_MAX_AGE_MS;

  const pruneExpired = (now: number) => {
    for (const [key, entry] of cache) {
      if (now - entry.timestamp >= maxAge) {
        cache.delete(key);
      }
    }
    while (cache.size > MAX_CACHE_ENTRIES) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey === undefined) {
        break;
      }
      cache.delete(oldestKey);
    }
  };

  return (
    url: string,
    fetchOpt?: { forceRefresh?: boolean; signal?: AbortSignal }
  ): Promise<Partial<WeblinkMetadata> | null | undefined> => {
    const now = Date.now();
    const forceRefresh = fetchOpt?.forceRefresh === true;

    if (!forceRefresh) {
      const cached = cache.get(url);
      if (cached) {
        if (now - cached.timestamp < maxAge) {
          return Promise.resolve(cached.data);
        }
        cache.delete(url);
      }

      const pending = inFlight.get(url);
      if (pending) {
        return pending;
      }
    }

    const runRequest = async (): Promise<
      Partial<WeblinkMetadata> | null | undefined
    > => {
      try {
        const data = await fetcher(url, fetchOpt);
        if (data && !fetchOpt?.signal?.aborted) {
          const timestamp = Date.now();
          cache.set(url, { data, timestamp });
          pruneExpired(timestamp);
        }
        return data;
      } finally {
        if (inFlight.get(url) === request) {
          inFlight.delete(url);
        }
      }
    };

    const request = runRequest();
    if (!forceRefresh) {
      inFlight.set(url, request);
    }

    return request;
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

export const WeblinkFaviconContext = createContext<
  WeblinkFaviconResolver | undefined
>(undefined);

export function useWeblinkFaviconResolver():
  | WeblinkFaviconResolver
  | undefined {
  return useContext(WeblinkFaviconContext);
}
