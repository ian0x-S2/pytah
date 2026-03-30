const ALLOWED_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

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

  try {
    const url = new URL(normalizedValue);
    return ALLOWED_LINK_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
};
