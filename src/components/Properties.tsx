import React, { useState, useEffect } from 'react';
import { Property } from '../types';
import { getProperties, seedProperties } from '../services/propertyService';
import PropertyGrid from './PropertyGrid';
import PropertyList from './PropertyList';
import PropertyMap from './PropertyMap';
import PropertyDetail from './PropertyDetail';
import { Loader2, Plus, Filter, Search, Database, LayoutGrid, List, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AddPropertyPanel from './AddPropertyPanel';

interface PropertiesProps {
  showAddPanel?: boolean;
  onAddPanelChange?: (show: boolean) => void;
  initialSelectedPropertyId?: string | null;
  onClearInitialSelection?: () => void;
  isDarkMode?: boolean;
}

export default function Properties({
  showAddPanel: controlledShowAddPanel,
  onAddPanelChange,
  initialSelectedPropertyId,
  onClearInitialSelection,
  isDarkMode = true,
}: PropertiesProps = {}) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [filter, setFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [internalShowAddPanel, setInternalShowAddPanel] = useState(false);
  const isControlled = controlledShowAddPanel !== undefined && onAddPanelChange !== undefined;
  const showAddPanel = isControlled ? controlledShowAddPanel : internalShowAddPanel;
  const setShowAddPanel = isControlled ? onAddPanelChange! : setInternalShowAddPanel;

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await getProperties();
      setProperties(data);
    } catch (error) {
      console.error("Failed to load properties", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (!initialSelectedPropertyId || !onClearInitialSelection || properties.length === 0) return;
    const p = properties.find((x) => x.id === initialSelectedPropertyId);
    if (p) {
      setSelectedProperty(p);
      onClearInitialSelection();
    }
  }, [initialSelectedPropertyId, onClearInitialSelection, properties]);

  const handleSeedData = async () => {
    try {
      setSeeding(true);
      await seedProperties();
      await fetchProperties();
    } catch (error) {
      console.error("Failed to seed data", error);
    } finally {
      setSeeding(false);
    }
  };

  const filteredProperties = filter === 'All' 
    ? properties 
    : properties.filter(p => p.status === filter);

  if (loading && !seeding && properties.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-neon-yellow" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black relative">
      {/* Toolbar */}
      <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-white/90 dark:bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Properties</h2>
          <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-900 rounded-lg p-1 border border-gray-300 dark:border-zinc-800">
            {['All', 'Active', 'Pending', 'Sold'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === status 
                    ? 'bg-gray-300 dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-zinc-500 hover:text-gray-800 dark:hover:text-zinc-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Grid / List / Map view toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-900 rounded-lg p-1 border border-gray-300 dark:border-zinc-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'}`}
              title="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'}`}
              title="List view"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'}`}
              title="Map view"
            >
              <MapIcon size={18} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Search properties..." 
              className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800 text-gray-900 dark:text-white text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-neon-yellow w-64 transition-colors placeholder-gray-500 dark:placeholder-zinc-400"
            />
          </div>
          <button onClick={() => setShowAddPanel(true)} className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border-2 border-[#D9FF00] bg-[#D9FF00]/10 text-[#D9FF00] hover:bg-[#D9FF00]/20 transition-colors">
            <Plus size={16} className="text-[#D9FF00]" />
            Add Property
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {properties.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600 dark:text-zinc-500">
            <div className="w-16 h-16 bg-gray-200 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <Database className="text-gray-400 dark:text-zinc-600" size={32} />
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No properties found</p>
            <p className="text-sm text-gray-600 dark:text-zinc-500 mb-6 max-w-xs text-center">
              Your portfolio is currently empty. Add a new property or load demo data to get started.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={handleSeedData}
                disabled={seeding}
                className="px-4 py-2 bg-gray-300 dark:bg-zinc-800 hover:bg-gray-400 dark:hover:bg-zinc-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {seeding ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
                Load Demo Data
              </button>
              <button onClick={() => setShowAddPanel(true)} className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border-2 border-[#D9FF00] bg-[#D9FF00]/10 text-[#D9FF00] hover:bg-[#D9FF00]/20 transition-colors">
                <Plus size={16} className="text-[#D9FF00]" />
                Add Property
              </button>
            </div>
          </div>
        ) : viewMode === 'map' ? (
          <div className="flex-1 flex flex-col min-h-0 p-4">
            <div className="flex-1 min-h-[420px] w-full rounded-xl overflow-hidden border border-zinc-800 relative">
              <PropertyMap
                properties={properties}
                isDarkMode={isDarkMode}
                onSelectProperty={(id) => {
                  const p = properties.find((x) => x.id === id);
                  if (p) setSelectedProperty(p);
                }}
              />
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="flex-1 overflow-y-auto p-6">
            <PropertyList properties={filteredProperties} onSelectProperty={setSelectedProperty} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <PropertyGrid properties={filteredProperties} onSelectProperty={setSelectedProperty} />
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedProperty && (
          <PropertyDetail 
            property={selectedProperty} 
            onClose={() => setSelectedProperty(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddPanel && (
          <AddPropertyPanel
            onClose={() => setShowAddPanel(false)}
            onSuccess={() => { setShowAddPanel(false); fetchProperties(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
