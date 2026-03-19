const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export type IsochroneProfile = 'mapbox/driving' | 'mapbox/walking' | 'mapbox/cycling' | 'mapbox/driving-traffic';

export interface IsochroneOptions {
  profile?: IsochroneProfile;
  contoursMinutes?: number[];
  polygons?: boolean;
}

const DEFAULT_OPTIONS: Required<IsochroneOptions> = {
  profile: 'mapbox/driving',
  contoursMinutes: [5, 10, 15],
  polygons: true,
};

export interface IsochroneFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: 'Polygon'; coordinates: number[][][] };
    properties?: Record<string, unknown>;
  }>;
}

/** Fetch isochrone polygons from Mapbox Isochrone API. Returns GeoJSON FeatureCollection or null. */
export async function fetchIsochrone(
  lng: number,
  lat: number,
  options: IsochroneOptions = {}
): Promise<IsochroneFeatureCollection | null> {
  if (!MAPBOX_TOKEN) return null;
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const coords = `${lng},${lat}`;
  const contours = opts.contoursMinutes.join(',');
  const params = new URLSearchParams({
    contours_minutes: contours,
    polygons: String(opts.polygons),
    access_token: MAPBOX_TOKEN,
  });
  const url = `https://api.mapbox.com/isochrone/v1/${opts.profile}/${coords}?${params}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) return null;
    return data as IsochroneFeatureCollection;
  } catch {
    return null;
  }
}
