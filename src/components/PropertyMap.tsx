import React, { useEffect, useState, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl, GeolocateControl, useMap } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Building2, LayoutGrid, Bath, Car, ExternalLink, PanelLeftClose, PanelRightOpen } from 'lucide-react';
import type { Property } from '../types';
import { geocodeAddresses } from '../utils/geocode';
import { t } from '../i18n/de';
import { sfx } from '../utils/sfx';

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
    case 'Active': return '#9372c9'; // accent purple
    case 'Pending': return '#3B82F6'; // blue-500
    case 'Rented': return '#10B981';  // emerald-500
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
  /** When set, this property's building is highlighted using actual building geometry from the map. */
  selectedPropertyId?: string | null;
}

const PLOTS_SOURCE_ID = 'property-plots';
const PLOTS_LAYER_ID = 'property-plots-circle';
const ACTIVE_HIGHLIGHT_SOURCE_ID = 'property-active-3d-highlight';
const ACTIVE_HIGHLIGHT_LAYER_ID = 'property-active-3d-highlight-layer';
const TRAFFIC_SOURCE_ID = 'mapbox-traffic';
const TRAFFIC_LAYER_ID = 'traffic-congestion';
const TRAFFIC_SIMULATE_LAYER_ID = 'traffic-simulate-flow';

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
const SELECTED_HIGHLIGHT_COLOR = '#D9FF00';
const ACTIVE_HIGHLIGHT_COLOR = '#9372c9';
const DEFAULT_HEIGHT = 24;
const DEFAULT_MIN_HEIGHT = 0;

export default function PropertyMap({ properties, isDarkMode = true, onSelectProperty, selectedPropertyId }: PropertyMapProps) {
  const mapStyleUrl = isDarkMode ? MAP_STYLE_DARK : MAP_STYLE_LIGHT;
  const [placed, setPlaced] = useState<PlacedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [tilesLoading, setTilesLoading] = useState(true);
  const [popupProperty, setPopupProperty] = useState<PlacedProperty | null>(null);
  const [viewState, setViewState] = useState(DEFAULT_VIEW);
  const [portfolioFilter, setPortfolioFilter] = useState<'All' | 'Active' | 'Pending' | 'Sold' | 'Rented'>('All');
  const [showTraffic, setShowTraffic] = useState(false);
  const [simulateTraffic, setSimulateTraffic] = useState(false);
  const [livePortfolioOpen, setLivePortfolioOpen] = useState(true);
  const trafficSimulateRef = useRef<number>(0);
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
          'fill-extrusion-color': ACTIVE_HIGHLIGHT_COLOR,
          'fill-extrusion-height': ['coalesce', ['get', 'height'], DEFAULT_HEIGHT],
          'fill-extrusion-base': ['coalesce', ['get', 'min_height'], DEFAULT_MIN_HEIGHT],
          'fill-extrusion-opacity': 0.92,
        },
      });
    }
    // Traffic (Mapbox Traffic v1 – real-time congestion, ~8 min updates)
    if (!map.getSource(TRAFFIC_SOURCE_ID)) {
      map.addSource(TRAFFIC_SOURCE_ID, {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-traffic-v1',
      });
    }
    if (!map.getLayer(TRAFFIC_LAYER_ID)) {
      map.addLayer({
        id: TRAFFIC_LAYER_ID,
        type: 'line',
        source: TRAFFIC_SOURCE_ID,
        'source-layer': 'traffic',
        minzoom: 10,
        layout: { visibility: 'none' },
        paint: {
          'line-color': [
            'match',
            ['get', 'congestion'],
            'low', '#22c55e',
            'moderate', '#eab308',
            'heavy', '#f97316',
            'severe', '#ef4444',
            '#64748b',
          ],
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 14, 3, 18, 5],
          'line-opacity': 0.85,
        },
      });
    }
    if (!map.getLayer(TRAFFIC_SIMULATE_LAYER_ID)) {
      map.addLayer({
        id: TRAFFIC_SIMULATE_LAYER_ID,
        type: 'line',
        source: TRAFFIC_SOURCE_ID,
        'source-layer': 'traffic',
        minzoom: 10,
        layout: { visibility: 'none' },
        paint: {
          'line-color': ['match', ['get', 'congestion'], 'low', '#22c55e', 'moderate', '#eab308', 'heavy', '#f97316', 'severe', '#ef4444', '#64748b'],
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 14, 3, 18, 5],
          'line-opacity': 0.7,
          'line-dasharray': [2, 2],
          'line-dash-offset': 0,
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

  // Update 3D highlight: selected = one square marker (accent); otherwise all Active = square markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource(ACTIVE_HIGHLIGHT_SOURCE_ID)) return;
    const isSelected = Boolean(selectedPropertyId);
    const candidates = isSelected
      ? placed.filter(({ property }) => property.id === selectedPropertyId)
      : placed.filter(({ property }) => property.status === 'Active');

    const makeSquareFeature = (lng: number, lat: number) => ({
      type: 'Feature' as const,
      geometry: { type: 'Polygon' as const, coordinates: [squarePolygon(lng, lat)] },
      properties: { height: DEFAULT_HEIGHT, min_height: DEFAULT_MIN_HEIGHT },
    });

    const source = map.getSource(ACTIVE_HIGHLIGHT_SOURCE_ID) as { setData: (data: object) => void };
    const setPaint = (color: string, opacity: number) => {
      (map as { setPaintProperty: (id: string, name: string, value: unknown) => void }).setPaintProperty(
        ACTIVE_HIGHLIGHT_LAYER_ID,
        'fill-extrusion-color',
        color
      );
      (map as { setPaintProperty: (id: string, name: string, value: unknown) => void }).setPaintProperty(
        ACTIVE_HIGHLIGHT_LAYER_ID,
        'fill-extrusion-opacity',
        opacity
      );
    };

    if (candidates.length === 0) {
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const geojson = {
      type: 'FeatureCollection' as const,
      features: candidates.map(({ lng, lat }) => makeSquareFeature(lng, lat)),
    };
    source.setData(geojson);
    setPaint(isSelected ? SELECTED_HIGHLIGHT_COLOR : ACTIVE_HIGHLIGHT_COLOR, isSelected ? 1 : 0.92);
  }, [placed, selectedPropertyId]);

  // Traffic layer visibility and simulate (animated dash) 
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer(TRAFFIC_LAYER_ID)) return;
    const setVisibility = (layerId: string, visible: boolean) => {
      (map as { setLayoutProperty: (id: string, name: string, value: unknown) => void }).setLayoutProperty(
        layerId,
        'visibility',
        visible ? 'visible' : 'none'
      );
    };
    setVisibility(TRAFFIC_LAYER_ID, showTraffic && !simulateTraffic);
    setVisibility(TRAFFIC_SIMULATE_LAYER_ID, showTraffic && simulateTraffic);
  }, [showTraffic, simulateTraffic]);

  // Animate traffic flow (line-dash-offset) when simulate is on
  useEffect(() => {
    if (!simulateTraffic || !showTraffic) return;
    const map = mapRef.current;
    if (!map?.getLayer(TRAFFIC_SIMULATE_LAYER_ID)) return;
    let offset = 0;
    const step = () => {
      trafficSimulateRef.current = requestAnimationFrame(step);
      offset += 0.4;
      (map as { setPaintProperty: (id: string, name: string, value: unknown) => void }).setPaintProperty(
        TRAFFIC_SIMULATE_LAYER_ID,
        'line-dash-offset',
        offset
      );
      (map as { triggerRepaint?: () => void }).triggerRepaint?.();
    };
    step();
    return () => {
      if (trafficSimulateRef.current) cancelAnimationFrame(trafficSimulateRef.current);
    };
  }, [simulateTraffic, showTraffic]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full min-h-[400px] bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <MapPin className="text-zinc-500" size={32} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Mapbox Token Required</h3>
        <p className="text-zinc-400 text-sm max-w-md mb-4">
          {t.property.addMapboxToken}
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
              onSelectProperty?.(property.id);
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
                <Building2 size={16} style={{ color: property.status === 'Active' || property.status === 'Rented' ? '#000' : '#fff' }} />
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
            <div className="w-64 glass rounded-xl overflow-hidden shadow-xl">
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
                  €{popupProperty.property.price?.toLocaleString()}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1"><LayoutGrid size={12} /> {popupProperty.property.rooms ?? '—'} R</span>
                  <span className="flex items-center gap-1"><Bath size={12} /> {popupProperty.property.bathrooms ?? '—'} B</span>
                  <span className="flex items-center gap-1"><Car size={12} /> {popupProperty.property.garage ?? '—'} G</span>
                </div>
                {onSelectProperty && (
                  <button
                    type="button"
                    onClick={() => { sfx.menuSelect(); onSelectProperty(popupProperty.property.id); setPopupProperty(null); }}
                    className="mt-3 w-full py-2 bg-accent text-white dark:text-black font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-colors border-2 border-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <ExternalLink size={14} />
                    {t.property.viewDetails}
                  </button>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Live Portfolio panel: toggle in/out */}
      {livePortfolioOpen ? (
        <div className="absolute top-4 left-4 glass border-2 border-accent/40 p-4 rounded-xl z-10 shadow-xl shadow-black/10 max-w-[280px]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ boxShadow: '0 0 8px var(--tw-accent, #9372c9)' }} />
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">LIVE PORTFOLIO</span>
            </div>
            <button
              type="button"
              onClick={() => { sfx.menuSelect(); setLivePortfolioOpen(false); }}
              className="p-1 rounded-md text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 hover:text-gray-900 dark:hover:text-white transition-colors"
              aria-label="Close Live Portfolio panel"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">Global Asset View</h4>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">
            {placed.length} {placed.length === 1 ? t.property.propertyTracked : t.property.propertiesTracked}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <button
              type="button"
              onClick={() => { sfx.menuSelect(); setShowTraffic(!showTraffic); if (showTraffic) setSimulateTraffic(false); }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                showTraffic ? 'bg-accent text-white dark:text-black' : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600'
              }`}
              title="Real-time traffic (Mapbox, ~8 min updates)"
            >
              Traffic
            </button>
            <button
              type="button"
              onClick={() => { sfx.menuSelect(); setSimulateTraffic(!simulateTraffic); if (simulateTraffic && !showTraffic) setShowTraffic(true); }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                simulateTraffic ? 'bg-accent text-white dark:text-black' : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600'
              }`}
              title="Simulate traffic flow (animated)"
            >
              Simulate
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(['All', 'Active', 'Pending', 'Sold', 'Rented'] as const).map((status) => {
              const count = status === 'All' ? placed.length : placed.filter(({ property }) => property.status === status).length;
              const isActive = portfolioFilter === status;
              const label = status === 'All' ? t.propertyFilter.all : status === 'Active' ? t.propertyStatus.active : status === 'Pending' ? t.propertyStatus.pending : status === 'Rented' ? t.propertyStatus.rented : t.propertyStatus.sold;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => { sfx.menuSelect(); setPortfolioFilter(status); }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-accent text-white dark:text-black'
                      : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
          <div className="pt-3 border-t border-gray-200 dark:border-zinc-700 max-h-[240px] overflow-y-auto space-y-1">
            {(() => {
              const filtered = placed.filter(({ property }) => portfolioFilter === 'All' || property.status === portfolioFilter);
              if (filtered.length === 0) {
                return (
                  <p className="text-xs text-gray-500 dark:text-zinc-500 px-2 py-2">No {portfolioFilter === 'All' ? 'properties' : portfolioFilter.toLowerCase()} to show.</p>
                );
              }
              return filtered.map(({ property, lng, lat }) => (
                <button
                  key={property.id}
                  type="button"
                  onClick={() => {
                    sfx.menuSelect();
                    mapRef.current?.flyTo?.({ center: [lng, lat], zoom: 16, pitch: 45, duration: 800 });
                    setPopupProperty(null);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-sm text-accent hover:bg-accent/20 truncate border border-transparent hover:border-accent/40 transition-colors"
                >
                  {property.title}
                </button>
              ));
            })()}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { sfx.menuSelect(); setLivePortfolioOpen(true); }}
          className="absolute top-4 left-4 glass border-2 border-accent/40 px-3 py-2 rounded-xl z-10 shadow-xl shadow-black/10 flex items-center gap-2 hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
          aria-label="Open Live Portfolio panel"
        >
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ boxShadow: '0 0 8px var(--tw-accent, #9372c9)' }} />
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">LIVE PORTFOLIO</span>
          <PanelRightOpen size={18} className="text-gray-500 dark:text-zinc-400" />
        </button>
      )}
    </div>
  );
}
