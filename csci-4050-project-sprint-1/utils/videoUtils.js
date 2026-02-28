/**
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://www.youtube.com/embed/dQw4w9WgXcQ 
 */
export function getYouTubeEmbedUrl(url) {
  if (!url) return null;

  try {
    
    if (url.includes('youtube.com/embed/')) {
      return url;
    }

    
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }

    
    return url;
  } catch (error) {
    console.error('Error parsing YouTube URL:', error);
    return null;
  }
}


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
