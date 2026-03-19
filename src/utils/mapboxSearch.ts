const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export interface NearbyPOI {
  name: string;
  address?: string;
  category: string;
  distance?: number;
  coordinates: { lng: number; lat: number };
}

/** Fetch nearby POIs by category using Mapbox Search Box Category API. */
export async function fetchNearbyPOIs(
  lng: number,
  lat: number,
  categories: string[],
  limitPerCategory = 5
): Promise<NearbyPOI[]> {
  if (!MAPBOX_TOKEN) return [];
  const proximity = `${lng},${lat}`;
  const results: NearbyPOI[] = [];

  await Promise.all(
    categories.map(async (category) => {
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        proximity,
        limit: String(limitPerCategory),
        types: 'poi',
      });
      const url = `https://api.mapbox.com/search/searchbox/v1/category/${encodeURIComponent(category)}?${params}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const features = data.features ?? [];
        for (const f of features) {
          const geom = f.geometry?.coordinates;
          const propCoords = f.properties?.coordinates;
          let lngP: number, latP: number;
          if (geom && Array.isArray(geom) && geom.length >= 2) {
            lngP = geom[0];
            latP = geom[1];
          } else if (propCoords && typeof propCoords.longitude === 'number' && typeof propCoords.latitude === 'number') {
            lngP = propCoords.longitude;
            latP = propCoords.latitude;
          } else continue;
          results.push({
            name: f.properties?.name ?? 'Unknown',
            address: f.properties?.address ?? f.properties?.full_address,
            category,
            coordinates: { lng: lngP, lat: latP },
          });
        }
      } catch {
        /* ignore */
      }
    })
  );

  return results;
}
