import React, { useEffect, useState, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl, GeolocateControl, useMap } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Building2, Bed, Bath, Ruler, ExternalLink } from 'lucide-react';
import type { Property } from '../types';
import { geocodeAddresses } from '../utils/geocode';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const DEFAULT_VIEW = {
  latitude: 40.7128,
  longitude: -74.0060,
  zoom: 10,
  pitch: 60,
  bearing: 0,
};

/** Build best-available address string for geocoding so every property can be placed. */
function getAddressForGeocode(p: Property): string {
  const full = [
    p.address?.trim(),
    [p.street, p.houseNumber].filter(Boolean).join(' ').trim(),
    [p.zip, p.city, p.state, p.country].filter(Boolean).join(', ').trim(),
  ].find(Boolean);
  if (full) return full;
  // Fallbacks so we never send empty (geocode can still find city/country)
  if (p.city && p.country) return `${p.city}, ${p.country}`;
  if (p.state && p.country) return `${p.state}, ${p.country}`;
  if (p.country) return p.country;
  if (p.city) return p.city;
  if (p.state) return p.state;
  return p.title?.trim() || '';
}

interface PlacedProperty {
  property: Property;
  lng: number;
  lat: number;
}

function markerColor(property: Property): string {
  switch (property.status) {
    case 'Active': return '#D9FF00'; // neon-yellow
    case 'Pending': return '#3B82F6'; // blue-500
    case 'Sold': return '#71717A';   // zinc-500
    default: return '#71717A';
  }
}

function FitBounds({ placed }: { placed: PlacedProperty[] }) {
  const mapCollection = useMap();
  useEffect(() => {
    const mapRef = mapCollection?.current ?? (mapCollection as any)?.getMap?.();
    const map = typeof mapRef?.getMap === 'function' ? mapRef.getMap() : mapRef;
    if (!map?.fitBounds || placed.length === 0) return;
    const bounds = placed.reduce(
      (acc, { lng, lat }) => {
        acc[0] = Math.min(acc[0], lng);
        acc[1] = Math.min(acc[1], lat);
        acc[2] = Math.max(acc[2], lng);
        acc[3] = Math.max(acc[3], lat);
        return acc;
      },
      [Infinity, Infinity, -Infinity, -Infinity]
    );
    if (bounds[0] === Infinity) return;
    map.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], {
      padding: 60,
      maxZoom: 14,
      duration: 1000,
    });
  }, [mapCollection, placed]);
  return null;
}

interface PropertyMapProps {
  properties: Property[];
  isDarkMode?: boolean;
  onSelectProperty?: (propertyId: string) => void;
}

const PLOTS_SOURCE_ID = 'property-plots';
const PLOTS_LAYER_ID = 'property-plots-circle';
const ACTIVE_HIGHLIGHT_SOURCE_ID = 'property-active-3d-highlight';
const ACTIVE_HIGHLIGHT_LAYER_ID = 'property-active-3d-highlight-layer';

/** Small square polygon (in degrees) around a point for 3D extrusion. ~25m half-size at mid-lat. */
function squarePolygon(lng: number, lat: number, halfSizeDeg = 0.00015): [number, number][] {
  return [
    [lng - halfSizeDeg, lat - halfSizeDeg],
    [lng + halfSizeDeg, lat - halfSizeDeg],
    [lng + halfSizeDeg, lat + halfSizeDeg],
    [lng - halfSizeDeg, lat + halfSizeDeg],
    [lng - halfSizeDeg, lat - halfSizeDeg],
  ];
}

const MAP_STYLE_DARK = 'mapbox://styles/mapbox/dark-v11';
const MAP_STYLE_LIGHT = 'mapbox://styles/mapbox/light-v11';

export default function PropertyMap({ properties, isDarkMode = true, onSelectProperty }: PropertyMapProps) {
  const mapStyleUrl = isDarkMode ? MAP_STYLE_DARK : MAP_STYLE_LIGHT;
  const [placed, setPlaced] = useState<PlacedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [tilesLoading, setTilesLoading] = useState(true);
  const [popupProperty, setPopupProperty] = useState<PlacedProperty | null>(null);
  const [viewState, setViewState] = useState(DEFAULT_VIEW);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{
    getSource: (id: string) => { setData: (data: object) => void } | undefined;
    getLayer: (id: string) => unknown;
    addSource: (id: string, source: object) => void;
    addLayer: (layer: object) => void;
    flyTo: (options: { center: [number, number]; zoom?: number; duration?: number; pitch?: number }) => void;
  } | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onMapLoad = (evt: { target: { resize?: () => void; getLayer: (id: string) => unknown; getSource: (id: string) => { setData: (data: object) => void } | undefined; addSource: (id: string, source: object) => void; addLayer: (layer: object) => void; once: (type: string, fn: () => void) => void; flyTo: (options: { center: [number, number]; zoom?: number; duration?: number; pitch?: number }) => void } }) => {
    const map = evt.target;
    mapRef.current = map;
    if (typeof map.resize === 'function') map.resize();
    map.once('idle', () => setTilesLoading(false));
    // Plot circles: mark each property location (building/plot) on the map
    if (!map.getSource(PLOTS_SOURCE_ID)) {
      map.addSource(PLOTS_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }
    if (!map.getLayer(PLOTS_LAYER_ID)) {
      map.addLayer({
        id: PLOTS_LAYER_ID,
        type: 'circle',
        source: PLOTS_SOURCE_ID,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 4, 14, 14, 18, 28],
          'circle-color': 'rgba(0, 255, 136, 0.35)',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#00FF88',
        },
      });
    }
    // 3D buildings (dark-v11 has composite building layer)
    if (!map.getLayer('building-3d')) {
      try {
        map.addLayer({
          id: 'building-3d',
          type: 'fill-extrusion',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#2a2a2a',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.85,
          },
        });
      } catch {
        /* style may not have composite/building */
      }
    }
    // Yellow 3D highlight for active property buildings (drawn on top of 3D buildings)
    if (!map.getSource(ACTIVE_HIGHLIGHT_SOURCE_ID)) {
      map.addSource(ACTIVE_HIGHLIGHT_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }
    if (!map.getLayer(ACTIVE_HIGHLIGHT_LAYER_ID)) {
      map.addLayer({
        id: ACTIVE_HIGHLIGHT_LAYER_ID,
        type: 'fill-extrusion',
        source: ACTIVE_HIGHLIGHT_SOURCE_ID,
        minzoom: 14,
        paint: {
          'fill-extrusion-color': '#D9FF00',
          'fill-extrusion-height': 24,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.92,
        },
      });
    }
  };

  useEffect(() => {
    if (!properties.length) {
      setPlaced([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const addresses = properties.map((p) => getAddressForGeocode(p));
    geocodeAddresses(addresses)
      .then((results) => {
        const next: PlacedProperty[] = [];
        results.forEach((r, i) => {
          if (r && properties[i]) next.push({ property: properties[i], lng: r.lng, lat: r.lat });
        });
        setPlaced(next);
      })
      .catch(() => setPlaced([]))
      .finally(() => setLoading(false));
  }, [properties]);

  // Update plot circles on the map when placed properties change
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource(PLOTS_SOURCE_ID) || placed.length === 0) return;
    const geojson = {
      type: 'FeatureCollection' as const,
      features: placed.map(({ lng, lat }) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [lng, lat] },
        properties: {},
      })),
    };
    (map.getSource(PLOTS_SOURCE_ID) as { setData: (data: object) => void }).setData(geojson);
  }, [placed]);

  // Update yellow 3D highlight for active properties only
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource(ACTIVE_HIGHLIGHT_SOURCE_ID)) return;
    const active = placed.filter(({ property }) => property.status === 'Active');
    const geojson = {
      type: 'FeatureCollection' as const,
      features: active.map(({ lng, lat }) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [squarePolygon(lng, lat)],
        },
        properties: {},
      })),
    };
    (map.getSource(ACTIVE_HIGHLIGHT_SOURCE_ID) as { setData: (data: object) => void }).setData(geojson);
  }, [placed]);

  const activeCount = properties.filter((p) => p.status === 'Active').length;
  const pendingCount = properties.filter((p) => p.status === 'Pending').length;
  const soldCount = properties.filter((p) => p.status === 'Sold').length;

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full min-h-[400px] bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <MapPin className="text-zinc-500" size={32} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Mapbox Token Required</h3>
        <p className="text-zinc-400 text-sm max-w-md mb-4">
          Add <code className="text-neon-yellow">VITE_MAPBOX_TOKEN</code> to .env to view the map.
        </p>
      </div>
    );
  }

  const mapStyle = size.width > 0 && size.height > 0
    ? { width: size.width, height: size.height }
    : { width: '100%', height: '100%' };

  return (
    <div ref={containerRef} className="property-map-root absolute inset-0 w-full h-full min-h-[300px] rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-900">
      {loading && placed.length === 0 && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <span className="text-sm text-white">Geocoding addresses…</span>
        </div>
      )}
      {tilesLoading && !loading && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-lg bg-white/95 dark:bg-zinc-900/95 border border-gray-200 dark:border-zinc-700 shadow-xl flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span className="text-sm text-gray-700 dark:text-zinc-300">Loading map tiles…</span>
          <span className="text-xs text-gray-500 dark:text-zinc-500">Ensure your internet connection is stable.</span>
        </div>
      )}
      <Map
        key={mapStyleUrl}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onLoad={onMapLoad}
        style={mapStyle}
        mapStyle={mapStyleUrl}
        mapboxAccessToken={MAPBOX_TOKEN}
        maxPitch={85}
        initialViewState={placed.length > 0 ? undefined : DEFAULT_VIEW}
      >
        {placed.length > 0 && <FitBounds placed={placed} />}

        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl />
        <GeolocateControl position="top-right" />

        {placed.map(({ property, lng, lat }) => (
          <Marker
            key={property.id}
            longitude={lng}
            latitude={lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setPopupProperty({ property, lng, lat });
              mapRef.current?.flyTo?.({
                center: [lng, lat],
                zoom: 16,
                pitch: 45,
                duration: 800,
              });
            }}
          >
            <div className="cursor-pointer transition-transform hover:scale-110 flex flex-col items-center">
              {/* Beam: faint line extending from base (reference style) */}
              <div
                className="w-px shrink-0"
                style={{
                  height: 12,
                  background: 'linear-gradient(to bottom, rgba(0,255,136,0.6), rgba(0,255,136,0.05))',
                  boxShadow: '0 0 8px rgba(0,255,136,0.4)',
                }}
              />
              {/* Glowing neon green marker circle */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: markerColor(property),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: -1,
                  boxShadow: `0 0 0 4px rgba(0,255,136,0.35), 0 0 20px ${markerColor(property)}, 0 2px 8px rgba(0,0,0,0.4)`,
                }}
              >
                <Building2 size={16} style={{ color: property.status === 'Active' ? '#000' : '#fff' }} />
              </div>
            </div>
          </Marker>
        ))}

        {popupProperty && (
          <Popup
            longitude={popupProperty.lng}
            latitude={popupProperty.lat}
            onClose={() => setPopupProperty(null)}
            closeButton={true}
            closeOnClick={false}
            anchor="bottom"
            className="property-map-popup"
          >
            <div className="w-64 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 shadow-xl">
              <div className="aspect-video bg-gray-100 dark:bg-zinc-800 relative">
                <img
                  src={popupProperty.property.mainImage || `https://picsum.photos/seed/${popupProperty.property.id}/400/200`}
                  alt={popupProperty.property.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{popupProperty.property.title}</h4>
                <p className="text-xs text-neon-green mt-0.5 font-medium">
                  ${popupProperty.property.price?.toLocaleString()}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1"><Bed size={12} /> {popupProperty.property.bedrooms ?? '—'}</span>
                  <span className="flex items-center gap-1"><Bath size={12} /> {popupProperty.property.bathrooms ?? '—'}</span>
                  <span className="flex items-center gap-1"><Ruler size={12} /> {popupProperty.property.sqft ?? '—'} sqft</span>
                </div>
                {onSelectProperty && (
                  <button
                    type="button"
                    onClick={() => { onSelectProperty(popupProperty.property.id); setPopupProperty(null); }}
                    className="mt-3 w-full py-2 bg-neon-green text-black font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 hover:bg-white transition-colors"
                  >
                    <ExternalLink size={14} />
                    View property
                  </button>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      <div className="absolute top-4 left-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 p-4 rounded-xl z-10 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" style={{ boxShadow: '0 0 8px #00FF88' }} />
          <span className="text-xs font-bold text-neon-green uppercase tracking-wider">LIVE PORTFOLIO</span>
        </div>
        <h4 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">Global Asset View</h4>
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          {placed.length} {placed.length === 1 ? 'Property' : 'Properties'} Tracked
        </p>
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-zinc-700 space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-neon-green" style={{ boxShadow: '0 0 6px #00FF88' }} />
            <span className="text-gray-700 dark:text-zinc-300">Active ({activeCount})</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-gray-700 dark:text-zinc-300">Pending ({pendingCount})</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-zinc-500" />
            <span className="text-gray-700 dark:text-zinc-300">Sold ({soldCount})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
