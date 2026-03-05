import React, { useRef, useEffect, useState } from 'react';
import Map, { Marker, NavigationControl, FullscreenControl, ScaleControl, GeolocateControl, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Building2 } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Sample property data (fallback if no real data)
const INITIAL_PROPERTIES = [
  { id: 1, name: "Downtown Tower", lat: 40.7128, lng: -74.0060, status: "Active" },
  { id: 2, name: "Westside Complex", lat: 40.7589, lng: -73.9851, status: "Pending" },
  { id: 3, name: "Harbor View", lat: 40.7033, lng: -74.0170, status: "Sold" }
];

const skyLayer = {
  id: 'sky',
  type: 'sky',
  paint: {
    'sky-type': 'atmosphere',
    'sky-atmosphere-sun': [0.0, 0.0],
    'sky-atmosphere-sun-intensity': 15
  }
};

export default function PropertyMap() {
  const [viewState, setViewState] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    zoom: 12,
    pitch: 75, // High pitch to see terrain
    bearing: 20
  });

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full min-h-[400px] bg-zinc-900 rounded-xl border border-border-dark flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <MapPin className="text-zinc-500" size={32} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Mapbox Token Required</h3>
        <p className="text-zinc-400 text-sm max-w-md mb-4">
          To view the 3D property map, please add your Mapbox public token to the .env file:
        </p>
        <code className="bg-black px-4 py-2 rounded text-neon-yellow text-xs font-mono border border-zinc-800">
          VITE_MAPBOX_TOKEN=pk.eyJ1...
        </code>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-border-dark relative group">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        terrain={{ source: 'mapbox-dem', exaggeration: 2.5 }}
        maxPitch={85}
      >
        <Source
          id="mapbox-dem"
          type="raster-dem"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxzoom={14}
        />
        <Layer {...skyLayer} />
        
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl />
        <GeolocateControl position="top-right" />

        {INITIAL_PROPERTIES.map((property) => (
          <Marker 
            key={property.id} 
            latitude={property.lat} 
            longitude={property.lng}
            anchor="bottom"
          >
            <div className="relative group cursor-pointer">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
                property.status === 'Active' ? 'bg-neon-yellow text-black' : 
                property.status === 'Pending' ? 'bg-blue-500 text-white' : 'bg-zinc-600 text-zinc-300'
              }`}>
                <Building2 size={16} />
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-zinc-800 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {property.name}
              </div>
            </div>
          </Marker>
        ))}
      </Map>
      
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-zinc-800 p-3 rounded-lg">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Portfolio Overview</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-neon-yellow" />
            <span className="text-white">Active (12)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-white">Pending (5)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-zinc-600" />
            <span className="text-white">Sold (8)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
