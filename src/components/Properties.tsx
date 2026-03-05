import React, { useState, useEffect } from 'react';
import { Property } from '../types';
import { getProperties, seedProperties } from '../services/propertyService';
import PropertyGrid from './PropertyGrid';
import PropertyDetail from './PropertyDetail';
import { Loader2, Plus, Filter, Search, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AddPropertyPanel from './AddPropertyPanel';

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [filter, setFilter] = useState('All');
  const [showAddPanel, setShowAddPanel] = useState(false);

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
    <div className="h-full flex flex-col bg-black relative">
      {/* Toolbar */}
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">Properties</h2>
          <div className="h-6 w-px bg-zinc-800" />
          <div className="flex items-center gap-2 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            {['All', 'Active', 'Pending', 'Sold'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === status 
                    ? 'bg-zinc-800 text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Search properties..." 
              className="bg-zinc-900 border border-zinc-800 text-white text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-neon-yellow w-64 transition-colors"
            />
          </div>
          <button onClick={() => setShowAddPanel(true)} className="bg-neon-yellow text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-yellow-400 transition-colors">
            <Plus size={16} />
            Add Property
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {properties.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <Database className="text-zinc-600" size={32} />
            </div>
            <p className="text-lg font-medium text-white mb-2">No properties found</p>
            <p className="text-sm text-zinc-500 mb-6 max-w-xs text-center">
              Your portfolio is currently empty. Add a new property or load demo data to get started.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={handleSeedData}
                disabled={seeding}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                {seeding ? <Loader2 className="animate-spin" size={16} /> : <Database size={16} />}
                Load Demo Data
              </button>
              <button onClick={() => setShowAddPanel(true)} className="px-4 py-2 bg-neon-yellow text-black hover:bg-yellow-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <Plus size={16} />
                Add Property
              </button>
            </div>
          </div>
        ) : (
          <PropertyGrid 
            properties={filteredProperties} 
            onSelectProperty={setSelectedProperty} 
          />
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
