import { sanitizeMediaUrl } from "../../url";
import type { WeblinkFaviconResolver, WeblinkMetadata } from "./types";

const GOOGLE_FAVICON_PREFIX = "https://www.google.com/s2/favicons?";

export const defaultWeblinkFaviconResolver = (hostname: string): string =>
  `${GOOGLE_FAVICON_PREFIX}domain=${encodeURIComponent(hostname)}&sz=64`;

export const isDefaultGoogleFavicon = (icon?: string): boolean =>
  typeof icon === "string" && icon.startsWith(GOOGLE_FAVICON_PREFIX);

export const resolveWeblinkFavicon = (
  hostname: string,
  resolver?: WeblinkFaviconResolver
): string | undefined => {
  if (resolver === false) {
    return undefined;
  }

  const candidate =
    typeof resolver === "function"
      ? resolver(hostname)
      : defaultWeblinkFaviconResolver(hostname);

  if (!candidate) {
    return undefined;
  }

  return (
    sanitizeMediaUrl(candidate, {
      allowDataImage: false,
      allowRelative: true,
    }) ?? undefined
  );
};

/**
 * Extracts immediate client-side metadata from a URL:
 * - Domain / Hostname (without www)
 * - Optional favicon (Google Favicons by default, overridable/disableable)
 * - Humanized title from the pathname or hostname
 */
export function resolveWeblinkMetadata(
  url: string,
  faviconResolver?: WeblinkFaviconResolver
): WeblinkMetadata {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./u, "");
    const icon = resolveWeblinkFavicon(hostname, faviconResolver);

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
