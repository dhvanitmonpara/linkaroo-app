import scraper from 'metadata-scraper';

/**
 * Detect content type from URL and Open Graph type.
 * Order matters — more specific patterns first.
 */
export function detectContentType(url, ogType = '') {
  try {
    const { hostname, pathname } = new URL(url);
    const lower = url.toLowerCase();
    const host = hostname.replace('www.', '');

    // YouTube
    if (host === 'youtube.com' || host === 'youtu.be') {
      if (pathname.includes('/watch') || host === 'youtu.be') return 'youtube';
    }

    // Twitter / X
    if (host === 'twitter.com' || host === 'x.com') return 'twitter';

    // GitHub
    if (host === 'github.com') return 'github';

    // Instagram
    if (host === 'instagram.com') return 'instagram';

    // Books
    if (host === 'goodreads.com' || host === 'books.google.com' || host === 'openlibrary.org') {
      return 'book';
    }

    // Movies / TV
    if (host === 'imdb.com' || host === 'letterboxd.com' || host === 'rottentomatoes.com') {
      return 'movie';
    }

    // Products / Shopping
    if (
      host === 'amazon.com' ||
      host === 'amazon.in' ||
      host === 'ebay.com' ||
      host === 'etsy.com' ||
      host === 'flipkart.com'
    ) {
      return 'product';
    }

    // Spotify / Music
    if (host === 'open.spotify.com' || host === 'soundcloud.com') {
      return 'audio';
    }

    // Raw image files
    if (/\.(jpe?g|png|gif|webp|svg|avif|bmp)(\?.*)?$/.test(lower)) {
      return 'image';
    }

    // Raw audio files
    if (/\.(mp3|wav|ogg|flac|aac|m4a)(\?.*)?$/.test(lower)) {
      return 'audio';
    }

    // Open Graph type hints
    if (ogType) {
      const og = ogType.toLowerCase();
      if (og === 'video.other' || og === 'video.movie' || og === 'video.episode') return 'movie';
      if (og === 'music.song' || og === 'music.album') return 'audio';
      if (og === 'book') return 'book';
      if (og === 'article' || og === 'blog') return 'article';
      if (og === 'profile') return 'link'; // keep generic for unknown profiles
    }

    // Medium / Substack / dev.to / Hashnode → articles
    if (
      host.includes('medium.com') ||
      host.includes('substack.com') ||
      host === 'dev.to' ||
      host.includes('hashnode.dev') ||
      host === 'hackernoon.com'
    ) {
      return 'article';
    }

    // Fallback
    return 'link';
  } catch {
    return 'link';
  }
}

async function fetchMetadata(url) {
  try {
    const metadata = await scraper(url);

    const title = metadata.title || 'No title found';
    const description = metadata.description || 'No description found';
    const image = metadata.image || metadata.cover_url || null;
    const icon = metadata.icon || metadata.logo || null;
    const contentType = detectContentType(url, metadata.type || '');

    return { title, description, image, icon, contentType };
  } catch (error) {
    console.error('Error scraping metadata:', error);
    return { title: 'Unknown Title', description: '', image: null, icon: null, contentType: 'link' };
  }
}

export default fetchMetadata;