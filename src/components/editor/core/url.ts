const ALLOWED_LINK_PROTOCOLS = new Set([
  "http:",
  "https:",
  "mailto:",
  "sms:",
  "tel:",
]);

const ALLOWED_WEB_PROTOCOLS = new Set(["http:", "https:"]);

const ALLOWED_MEDIA_PROTOCOLS = new Set(["http:", "https:", "blob:"]);

const SAFE_DATA_IMAGE_PATTERN =
  /^data:image\/(?:png|jpeg|jpg|webp|gif|avif);base64,[a-z0-9+/=\s]+$/iu;

const SCHEME_PREFIX_PATTERN = /^[a-z][a-z0-9+.-]*:/iu;

export const LINK_PLACEHOLDER_URL = "https://";

export const normalizeEditorLinkUrl = (value: string): string => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (trimmedValue.toLowerCase().startsWith("www.")) {
    return `https://${trimmedValue}`;
  }

  if (!SCHEME_PREFIX_PATTERN.test(trimmedValue) && trimmedValue.includes("@")) {
    return `mailto:${trimmedValue}`;
  }

  return trimmedValue;
};

export const isValidEditorLinkUrl = (value: string): boolean => {
  const normalizedValue = normalizeEditorLinkUrl(value);
  if (!normalizedValue) {
    return false;
  }

  if (normalizedValue === LINK_PLACEHOLDER_URL) {
    return true;
  }

  try {
    const url = new URL(normalizedValue);
    return ALLOWED_LINK_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
};

export const sanitizeHrefUrl = (value: string): string => {
  const normalizedValue = normalizeEditorLinkUrl(value);
  if (!normalizedValue) {
    return "about:blank";
  }

  try {
    const url = new URL(normalizedValue);
    if (!ALLOWED_LINK_PROTOCOLS.has(url.protocol)) {
      return "about:blank";
    }
    return normalizedValue;
  } catch {
    return "about:blank";
  }
};

export const sanitizeWebUrl = (value: string): string | null => {
  const normalizedValue = normalizeEditorLinkUrl(value);
  if (!normalizedValue) {
    return null;
  }

  try {
    const url = new URL(normalizedValue);
    if (!ALLOWED_WEB_PROTOCOLS.has(url.protocol)) {
      return null;
    }
    return normalizedValue;
  } catch {
    return null;
  }
};

export interface SanitizeMediaUrlOptions {
  allowDataImage?: boolean;
  allowRelative?: boolean;
}

export const sanitizeMediaUrl = (
  value: string,
  options?: SanitizeMediaUrlOptions
): string | null => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const allowRelative = options?.allowRelative ?? true;
  if (
    allowRelative &&
    trimmedValue.startsWith("/") &&
    !trimmedValue.startsWith("//")
  ) {
    return trimmedValue;
  }

  if (options?.allowDataImage && SAFE_DATA_IMAGE_PATTERN.test(trimmedValue)) {
    return trimmedValue;
  }

  try {
    const url = new URL(trimmedValue);
    if (!ALLOWED_MEDIA_PROTOCOLS.has(url.protocol)) {
      return null;
    }
    return trimmedValue;
  } catch {
    return null;
  }
};
