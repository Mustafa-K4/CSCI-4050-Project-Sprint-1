/**
 * Converts a YouTube URL to an embeddable iframe URL
 * Supports formats:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://www.youtube.com/embed/dQw4w9WgXcQ (already in embed format)
 */
export function getYouTubeEmbedUrl(url) {
  if (!url) return null;

  try {
    // If already in embed format, return as-is
    if (url.includes('youtube.com/embed/')) {
      return url;
    }

    // Extract video ID from youtube.com/watch?v=
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }

    // If no match found, return original URL (might be a direct embed URL or other format)
    return url;
  } catch (error) {
    console.error('Error parsing YouTube URL:', error);
    return null;
  }
}

/**
 * Validates if a URL is a valid YouTube or video URL
 */
export function isValidVideoUrl(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes('youtube.com') ||
      urlObj.hostname.includes('youtu.be') ||
      urlObj.hostname.includes('youtube-nocookie.com')
    );
  } catch {
    return false;
  }
}
