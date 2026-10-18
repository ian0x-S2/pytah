import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createCachedWeblinkFetcher,
  createEndpointWeblinkFetcher,
  createMetascraperAdapter,
  normalizeWeblinkMetadata,
  resolveWeblinkFetcher,
} from "./metadata";

describe("Weblink Metadata Utilities", () => {
  describe("normalizeWeblinkMetadata", () => {
    it("handles null and non-object inputs", () => {
      deepStrictEqual(
        normalizeWeblinkMetadata(null, "https://example.com"),
        {}
      );
      deepStrictEqual(
        normalizeWeblinkMetadata(undefined, "https://example.com"),
        {}
      );
      deepStrictEqual(
        normalizeWeblinkMetadata("string", "https://example.com"),
        {}
      );
    });

    it("normalizes OpenGraph meta tags", () => {
      const raw = {
        favicon: "https://example.com/icon.ico",
        "og:description": "Best frontend tool",
        "og:image": "https://example.com/og.png",
        "og:title": "Example Title",
      };

      const result = normalizeWeblinkMetadata(raw, "https://example.com");
      deepStrictEqual(result, {
        description: "Best frontend tool",
        icon: "https://example.com/icon.ico",
        image: "https://example.com/og.png",
        title: "Example Title",
        url: "https://example.com",
      });
    });

    it("normalizes metascraper output with logo and image", () => {
      const raw = {
        description: "Scraped description",
        image: "https://example.com/banner.jpg",
        logo: "https://example.com/logo.png",
        title: "Metascraper Title",
        url: "https://example.com/page",
      };

      const result = normalizeWeblinkMetadata(raw, "https://fallback.com");
      deepStrictEqual(result, {
        description: "Scraped description",
        icon: "https://example.com/logo.png",
        image: "https://example.com/banner.jpg",
        title: "Metascraper Title",
        url: "https://example.com/page",
      });
    });

    it("trims whitespace and ignores empty strings", () => {
      const raw = {
        description: "   ",
        image: " https://example.com/pic.png  ",
        title: "  Spaced Title  ",
      };

      const result = normalizeWeblinkMetadata(raw, "https://example.com");
      strictEqual(result.title, "Spaced Title");
      strictEqual(result.description, undefined);
      strictEqual(result.image, "https://example.com/pic.png");
    });
  });

  describe("createMetascraperAdapter", () => {
    it("adapts scraper function and normalizes result", async () => {
      let callCount = 0;
      const scraper = (url: string) => {
        callCount += 1;
        return Promise.resolve({
          description: "Awesome page",
          image: "https://site.com/og.png",
          title: "My Site",
          url,
        });
      };

      const fetcher = createMetascraperAdapter(scraper);
      const data = await fetcher("https://site.com");

      strictEqual(callCount, 1);
      deepStrictEqual(data, {
        description: "Awesome page",
        icon: undefined,
        image: "https://site.com/og.png",
        title: "My Site",
        url: "https://site.com",
      });
    });

    it("returns null when scraper throws", async () => {
      const fetcher = createMetascraperAdapter(() =>
        Promise.reject(new Error("Scraping failed"))
      );
      const data = await fetcher("https://site.com");

      strictEqual(data, null);
    });
  });

  describe("createEndpointWeblinkFetcher", () => {
    it("calls endpoint with query string and normalizes response", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (reqUrl: string | URL | Request) => {
        strictEqual(
          reqUrl.toString(),
          "/api/meta?url=https%3A%2F%2Fvite.dev%2Fguide"
        );
        return Promise.resolve(
          Response.json({
            description: "Vite guide",
            title: "Getting Started",
          })
        );
      };

      try {
        const fetcher = createEndpointWeblinkFetcher("/api/meta");
        const data = await fetcher("https://vite.dev/guide");

        strictEqual(data?.title, "Getting Started");
        strictEqual(data?.description, "Vite guide");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("appends with & if endpoint already has query parameters", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (reqUrl: string | URL | Request) => {
        strictEqual(
          reqUrl.toString(),
          "/api/meta?key=123&url=https%3A%2F%2Fexample.com"
        );
        return Promise.resolve(Response.json({ title: "Example" }));
      };

      try {
        const fetcher = createEndpointWeblinkFetcher("/api/meta?key=123");
        const data = await fetcher("https://example.com");
        strictEqual(data?.title, "Example");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("returns null if response is not ok", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = () =>
        Promise.resolve(new Response("Not found", { status: 404 }));

      try {
        const fetcher = createEndpointWeblinkFetcher("/api/meta");
        const data = await fetcher("https://example.com");
        strictEqual(data, null);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("createCachedWeblinkFetcher", () => {
    it("caches response for identical URL", async () => {
      let callCount = 0;
      const rawFetcher = (url: string) => {
        callCount += 1;
        return Promise.resolve({
          title: `Title for ${url}`,
          url,
        });
      };

      const cached = createCachedWeblinkFetcher(rawFetcher);

      const first = await cached("https://site.com");
      const second = await cached("https://site.com");

      deepStrictEqual(first, second);
      strictEqual(callCount, 1);
    });
  });

  describe("resolveWeblinkFetcher", () => {
    it("returns null for undefined", () => {
      strictEqual(resolveWeblinkFetcher(), null);
    });

    it("wraps string endpoint into cached fetcher", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = () =>
        Promise.resolve(Response.json({ title: "Resolved Title" }));

      try {
        const fetcher = resolveWeblinkFetcher("/api/metadata");
        strictEqual(typeof fetcher, "function");

        const data = await fetcher?.("https://test.com");
        strictEqual(data?.title, "Resolved Title");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
