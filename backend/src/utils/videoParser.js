import axios from 'axios';

/**
 * Parses YouTube or Vimeo URL to extract source and video ID
 * @param {string} url 
 * @returns {object|null} { source, id } or null
 */
export const parseVideoUrl = (url) => {
  if (!url) return null;

  // YouTube Patterns
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const ytMatch = url.match(youtubeRegex);
  if (ytMatch) {
    return { source: 'youtube', id: ytMatch[1] };
  }

  // Vimeo Patterns
  const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i;
  const vMatch = url.match(vimeoRegex);
  if (vMatch) {
    return { source: 'vimeo', id: vMatch[1] };
  }

  return null;
};

/**
 * Fetches video metadata via oEmbed
 * @param {string} source 'youtube' | 'vimeo'
 * @param {string} id Video ID
 * @returns {object} { title, thumbnail_url, duration }
 */
export const fetchVideoMetadata = async (source, id) => {
  try {
    let oEmbedUrl = '';
    if (source === 'youtube') {
      oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
    } else if (source === 'vimeo') {
      oEmbedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}`;
    }

    if (!oEmbedUrl) return null;

    const response = await axios.get(oEmbedUrl);
    const data = response.data;

    return {
      title: data.title,
      thumbnail_url: data.thumbnail_url,
      // oEmbed doesn't always provide duration, especially YouTube.
      // For YouTube, we'd need Data API v3 for duration, but user asked for oEmbed.
      // Vimeo provides duration in seconds.
      duration: data.duration || 0 
    };
  } catch (error) {
    console.error('Error fetching video metadata:', error.message);
    return null;
  }
};
