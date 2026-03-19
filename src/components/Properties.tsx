import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Property, Contact } from '../types';
import { getProperties, seedProperties } from '../services/propertyService';
import { getContacts, getLinkedContactIdsForProperties } from '../services/contactsService';
import PropertyGrid from './PropertyGrid';
import PropertyList from './PropertyList';
import PropertyMap from './PropertyMap';
import PropertyDetail from './PropertyDetail';
import { Loader2, Plus, Filter, Database, LayoutGrid, List, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AddPropertyPanel from './AddPropertyPanel';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { t } = useLanguage();
  const [properties, setProperties] = useState<Property[]>([]);
  const [linkedContactsByPropertyId, setLinkedContactsByPropertyId] = useState<Record<string, Contact[]>>({});
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [filter, setFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [internalShowAddPanel, setInternalShowAddPanel] = useState(false);
  const isControlled = controlledShowAddPanel !== undefined && onAddPanelChange !== undefined;
  const showAddPanel = isControlled ? controlledShowAddPanel : internalShowAddPanel;
  const setShowAddPanel = isControlled ? onAddPanelChange! : setInternalShowAddPanel;

  const fetchProperties = async (): Promise<Property[]> => {
    try {
      setLoading(true);
      const [data, contacts] = await Promise.all([getProperties(), getContacts()]);
      setProperties(data);
      const ids = data.map((p) => p.id);
      const linkedIds = await getLinkedContactIdsForProperties(ids);
      const byProp: Record<string, Contact[]> = {};
      ids.forEach((pid) => {
        const cids = linkedIds[pid] || [];
        byProp[pid] = cids.map((cid) => contacts.find((c) => c.id === cid)).filter(Boolean) as Contact[];
      });
      setLinkedContactsByPropertyId(byProp);
      return data;
    } catch (error) {
      console.error("Failed to load properties", error);
      return [];
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
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-app-light dark:bg-app-dark relative">
      {/* Toolbar */}
      <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between gap-4 bg-app-light/90 dark:bg-app-dark/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex-1 flex items-center min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t.property.properties}</h2>
        </div>

        <div className="hidden lg:flex items-center gap-2 bg-gray-100 dark:bg-zinc-900 rounded-lg p-1 border border-gray-300 dark:border-zinc-800 shrink-0 overflow-x-auto">
          {['All', 'Active', 'For Sale', 'For Rent', 'Pending', 'Sold', 'Rented'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filter === status
                  ? 'bg-gray-300 dark:bg-zinc-800 text-accent shadow-sm'
                  : 'text-gray-600 dark:text-zinc-500 hover:text-gray-800 dark:hover:text-zinc-300'
              }`}
            >
              {status === 'All' 
                ? t.propertyFilter.all 
                : status === 'Active' 
                ? t.propertyStatus.active 
                : status === 'For Sale' 
                ? t.propertyStatus.forSale 
                : status === 'For Rent' 
                ? t.propertyStatus.forRent 
                : status === 'Pending' 
                ? t.propertyStatus.pending 
                : status === 'Rented' 
                ? t.propertyStatus.rented 
                : t.propertyStatus.sold}
            </button>
          ))}
        </div>

        <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
          {/* Grid / List / Map view toggle - hidden on narrow viewports */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-900 rounded-lg p-1 border border-gray-300 dark:border-zinc-800 max-[450px]:hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'}`}
              title={t.propertyUi.gridView}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'}`}
              title={t.propertyUi.listView}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'}`}
              title={t.propertyUi.mapView}
            >
              <MapIcon size={18} />
            </button>
          </div>
          <button
            onClick={() => setShowAddPanel(true)}
            title={t.property.addPropertyButton}
            className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 btn-outline-accent max-[320px]:px-2 max-[320px]:py-2 [&_svg]:text-current"
          >
            <Plus size={16} />
            <span className="max-[320px]:hidden">{t.property.addPropertyButton}</span>
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
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t.property.noPropertiesFound}</p>
            <p className="text-sm text-gray-600 dark:text-zinc-500 mb-6 max-w-xs text-center">
              {t.property.portfolioEmptyHint}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={handleSeedData}
                disabled={seeding}
                className="px-4 py-2 bg-gray-300 dark:bg-zinc-800 hover:bg-gray-400 dark:hover:bg-zinc-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {seeding ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
                {t.property.loadDemoData}
              </button>
              <button
                onClick={() => setShowAddPanel(true)}
                title={t.property.addPropertyButton}
                className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 btn-outline-accent max-[320px]:px-2 max-[320px]:py-2 [&_svg]:text-current"
              >
                <Plus size={16} />
                <span className="max-[320px]:hidden">{t.property.addPropertyButton}</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'map' ? (
          <div className="flex-1 flex flex-col min-h-0 p-4">
            <div className="flex-1 min-h-[420px] w-full rounded-xl overflow-hidden border border-zinc-800 relative">
              <PropertyMap
                properties={properties}
                isDarkMode={isDarkMode}
                selectedPropertyId={selectedProperty?.id ?? null}
                onSelectProperty={(id) => {
                  const p = properties.find((x) => x.id === id);
                  if (p) setSelectedProperty(p);
                }}
              />
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="flex-1 overflow-y-auto p-6">
            <PropertyList properties={filteredProperties} linkedContactsByPropertyId={linkedContactsByPropertyId} onSelectProperty={setSelectedProperty} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <PropertyGrid properties={filteredProperties} onSelectProperty={setSelectedProperty} />
          </div>
        )}
      </div>

      {/* Detail Modal - portaled to body so it overlays Aside and Topbar */}
      {createPortal(
        <AnimatePresence>
          {selectedProperty && (
            <PropertyDetail
              property={selectedProperty}
              onClose={() => setSelectedProperty(null)}
              onPropertyUpdated={async () => {
                const data = await fetchProperties();
                const updated = data.find((p) => p.id === selectedProperty?.id);
                if (updated) setSelectedProperty(updated);
              }}
            />
          )}
        </AnimatePresence>,
        document.body
      )}

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
