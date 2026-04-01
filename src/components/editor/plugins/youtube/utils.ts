const YOUTUBE_URL_PATTERN =
  /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;

export const parseYouTubeUrl = (url: string): string | null => {
  const match = YOUTUBE_URL_PATTERN.exec(url.trim());
  const videoId = match?.[1];

  if (videoId?.length === 11) {
    return videoId;
  }

  return null;
};
