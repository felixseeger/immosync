const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export interface GeocodedResult {
  lng: number;
  lat: number;
}

/** Forward geocode a single address using Mapbox Geocoding API. Returns null if not found or token missing. */
export async function geocodeAddress(address: string): Promise<GeocodedResult | null> {
  if (!MAPBOX_TOKEN || !address?.trim()) return null;
  const encoded = encodeURIComponent(address.trim());
  // Include address, place, locality, region, country so city/country-only queries work
  const types = 'address,place,locality,region,country';
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=${types}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature?.geometry?.coordinates?.length) return null;
    const [lng, lat] = feature.geometry.coordinates;
    return { lng, lat };
  } catch {
    return null;
  }
}

/** Geocode multiple addresses with a short delay between requests to avoid rate limits. */
export async function geocodeAddresses(
  addresses: string[],
  delayMs = 150
): Promise<(GeocodedResult | null)[]> {
  const results: (GeocodedResult | null)[] = [];
  for (let i = 0; i < addresses.length; i++) {
    const r = await geocodeAddress(addresses[i]);
    results.push(r);
    if (i < addresses.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return results;
}
