function isGoogleMapsHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === 'www.google.com' ||
      host === 'google.com' ||
      host === 'maps.google.com' ||
      host === 'maps.googleapis.com'
    );
  } catch {
    return false;
  }
}

/** رابط ليس خريطة Google (موقع ويب، متجر، إلخ) */
function isNonMapWebsiteUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (!lower.startsWith('http://') && !lower.startsWith('https://')) return false;
  if (isGoogleMapsHost(url)) return false;
  if (lower.includes('goo.gl/maps') || lower.includes('maps.app.goo.gl')) return false;
  return true;
}

/** يحوّل رابط Google Maps أو العنوان إلى رابط embed للعرض داخل iframe */
export function toGoogleMapEmbedUrl(
  mapUrl?: string | null,
  address?: string | null,
): string | null {
  const src = mapUrl?.trim();

  if (src && !isNonMapWebsiteUrl(src)) {
    if (src.includes('/maps/embed') && isGoogleMapsHost(src)) return src;

    const coords = src.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coords) {
      return `https://www.google.com/maps?q=${coords[1]},${coords[2]}&output=embed`;
    }

    const place = src.match(/place\/([^/?]+)/);
    if (place) {
      const q = decodeURIComponent(place[1].replace(/\+/g, ' '));
      return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
    }

    if (isGoogleMapsHost(src) || src.includes('google.com/maps') || src.includes('goo.gl')) {
      return `https://www.google.com/maps?q=${encodeURIComponent(src)}&output=embed`;
    }
  }

  const addr = address?.trim();
  if (addr) {
    return `https://www.google.com/maps?q=${encodeURIComponent(addr)}&output=embed`;
  }

  return null;
}

/** رابط لفتح الموقع في تطبيق/موقع خرائط Google */
export function toGoogleMapOpenUrl(
  mapUrl?: string | null,
  address?: string | null,
): string | null {
  const src = mapUrl?.trim();
  if (src && !isNonMapWebsiteUrl(src)) return src;

  const addr = address?.trim();
  if (addr) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  }

  return null;
}
