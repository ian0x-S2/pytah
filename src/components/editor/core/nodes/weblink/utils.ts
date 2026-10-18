import type { WeblinkMetadata } from "./types";

/**
 * Extracts immediate client-side metadata from a URL:
 * - Domain / Hostname (without www)
 * - Google Favicons service for public, CORS-free high-res favicons
 * - Humanized title from the pathname or hostname
 */
export function resolveWeblinkMetadata(url: string): WeblinkMetadata {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./u, "");
    const icon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;

    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    const lastSegment = pathSegments.at(-1);

    let title = hostname;
    if (lastSegment) {
      const decoded = decodeURIComponent(lastSegment)
        .replaceAll(/[-_]+/gu, " ")
        .replace(/\.[a-z0-9]+$/iu, "")
        .trim();
      if (decoded.length > 0) {
        title = decoded.charAt(0).toUpperCase() + decoded.slice(1);
      }
    }

    return {
      icon,
      title,
      url,
    };
  } catch {
    return {
      title: url,
      url,
    };
  }
}
