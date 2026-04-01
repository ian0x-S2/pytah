const ALLOWED_LINK_PROTOCOLS = new Set([
  "http:",
  "https:",
  "mailto:",
  "sms:",
  "tel:",
]);

export const LINK_PLACEHOLDER_URL = "https://";

export const normalizeEditorLinkUrl = (value: string): string => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (trimmedValue.includes("@") && !trimmedValue.includes("://")) {
    return `mailto:${trimmedValue}`;
  }

  if (trimmedValue.startsWith("tel:")) {
    return trimmedValue;
  }

  if (trimmedValue.startsWith("www.")) {
    return `https://${trimmedValue}`;
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

export const sanitizeEditorLinkUrl = (value: string): string => {
  const normalizedValue = normalizeEditorLinkUrl(value);

  try {
    const url = new URL(normalizedValue);
    if (!ALLOWED_LINK_PROTOCOLS.has(url.protocol)) {
      return "about:blank";
    }
  } catch {
    return normalizedValue;
  }

  return normalizedValue;
};
