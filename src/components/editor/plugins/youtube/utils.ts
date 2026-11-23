const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/u;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

export const isValidYouTubeVideoId = (videoId: string): boolean =>
  YOUTUBE_VIDEO_ID_PATTERN.test(videoId);

export const parseYouTubeUrl = (url: string): string | null => {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) {
    return null;
  }

  const pathSegments = parsed.pathname.split("/").filter(Boolean);
  let candidate: string | null = null;

  if (host === "youtu.be" || host === "www.youtu.be") {
    candidate = pathSegments[0] ?? null;
  } else if (pathSegments[0] === "watch") {
    candidate = parsed.searchParams.get("v");
  } else if (
    pathSegments[0] === "embed" ||
    pathSegments[0] === "v" ||
    pathSegments[0] === "shorts" ||
    pathSegments[0] === "live"
  ) {
    candidate = pathSegments[1] ?? null;
  } else {
    candidate = parsed.searchParams.get("v");
  }

  if (candidate && isValidYouTubeVideoId(candidate)) {
    return candidate;
  }

  return null;
};
