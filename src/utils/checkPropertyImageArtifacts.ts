import type { Property } from '../types';

/** Patterns that suggest a URL is a thumbnail or cache artifact rather than full-size. */
const THUMB_CACHE_PATTERNS = {
  path: [
    /thumb/i,
    /thumbnail/i,
    /_thumb/i,
    /cache/i,
    /small/i,
    /medium/i,
    /preview/i,
    /resized/i,
    /scaled/i,
    /thumb_/i,
    /_small/i,
    /_medium/i,
  ],
  searchParams: [
    /^size=(thumb|small|medium|preview)/i,
    /thumb=/i,
    /cache=/i,
    /resize=/i,
  ],
};

export interface ImageArtifactReport {
  url: string;
  role: 'mainImage' | 'image';
  index?: number;
  isLikelyThumbOrCache: boolean;
  matchedPath: string[];
  matchedParams: string[];
}

export interface PropertyImageArtifactReport {
  propertyId: string;
  title: string;
  address: string;
  mainImage: string | undefined;
  images: string[];
  reports: ImageArtifactReport[];
  summary: {
    totalUrls: number;
    likelyArtifacts: number;
    urlsWithoutArtifacts: number;
  };
}

function checkUrl(url: string): { path: string[]; params: string[] } {
  const path: string[] = [];
  const params: string[] = [];
  try {
    const u = new URL(url);
    const pathLower = u.pathname.toLowerCase();
    for (const re of THUMB_CACHE_PATTERNS.path) {
      if (re.test(pathLower)) path.push(re.source);
    }
    u.searchParams.forEach((value, key) => {
      const pair = `${key}=${value}`;
      for (const re of THUMB_CACHE_PATTERNS.searchParams) {
        if (re.test(pair)) params.push(pair);
      }
    });
  } catch {
    // invalid URL
  }
  return { path, params };
}

/**
 * Analyzes a property's mainImage and images[] for thumbnail/cache-style URLs.
 * Returns a report listing each URL and whether it looks like an artifact.
 */
export function getPropertyImageArtifactReport(property: Property): PropertyImageArtifactReport {
  const reports: ImageArtifactReport[] = [];
  const urls: { url: string; role: 'mainImage' | 'image'; index?: number }[] = [];

  if (property.mainImage) {
    urls.push({ url: property.mainImage, role: 'mainImage' });
  }
  (property.images ?? []).forEach((url, index) => {
    urls.push({ url, role: 'image', index });
  });

  for (const { url, role, index } of urls) {
    const { path: matchedPath, params: matchedParams } = checkUrl(url);
    const isLikelyThumbOrCache = matchedPath.length > 0 || matchedParams.length > 0;
    reports.push({
      url,
      role,
      index,
      isLikelyThumbOrCache,
      matchedPath,
      matchedParams,
    });
  }

  const likelyArtifacts = reports.filter((r) => r.isLikelyThumbOrCache).length;
  return {
    propertyId: property.id,
    title: property.title ?? '',
    address: property.address ?? '',
    mainImage: property.mainImage,
    images: property.images ?? [],
    reports,
    summary: {
      totalUrls: reports.length,
      likelyArtifacts,
      urlsWithoutArtifacts: reports.length - likelyArtifacts,
    },
  };
}

/**
 * Finds a property by title or address containing the given search string (case-insensitive)
 * and returns its image artifact report.
 */
export function findPropertyAndReport(
  properties: Property[],
  searchTitleOrAddress: string
): PropertyImageArtifactReport | null {
  const needle = searchTitleOrAddress.trim().toLowerCase();
  const property = properties.find(
    (p) =>
      (p.title ?? '').toLowerCase().includes(needle) ||
      (p.address ?? '').toLowerCase().includes(needle) ||
      (p.street ?? '').toLowerCase().includes(needle)
  );
  if (!property) return null;
  return getPropertyImageArtifactReport(property);
}
