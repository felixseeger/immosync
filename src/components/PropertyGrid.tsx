import React from 'react';
import { Property } from '../types';
import { motion } from 'motion/react';
import { MapPin, LayoutGrid, Bath, Box, Droplets, UtensilsCrossed, Car, ArrowRight } from 'lucide-react';

interface PropertyGridProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
}

export default function PropertyGrid({ properties, onSelectProperty }: PropertyGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {properties.map((property) => (
        <motion.div
          key={property.id}
          layoutId={`property-${property.id}`}
          onClick={() => onSelectProperty(property)}
          className="group relative glass rounded-2xl overflow-hidden hover:border-gray-400 dark:hover:border-white/20 transition-colors cursor-pointer"
          whileHover={{ y: -4 }}
        >
          {/* Image Container */}
          <div className="aspect-[4/3] overflow-hidden relative">
            <img 
              src={property.mainImage || `https://picsum.photos/seed/${property.id}/800/600`} 
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
            
            <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-xs font-medium text-white">
              {property.status}
            </div>
            
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-xl font-bold text-white mb-1 truncate">{property.title}</h3>
              <div className="flex items-center text-gray-200 dark:text-zinc-400 text-sm">
                <MapPin size={14} className="mr-1" />
                <span className="truncate">{property.address}</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                €{property.price.toLocaleString()}
              </span>
              <span className="text-xs text-gray-600 dark:text-zinc-500 uppercase tracking-wider font-medium">
                {property.type}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 py-6 border-t border-gray-300 dark:border-zinc-800">
              <div className="flex flex-col items-center text-center">
                <LayoutGrid size={28} className="text-gray-600 dark:text-zinc-400 mb-1" />
                <span className="text-xl font-medium text-gray-900 dark:text-white">{property.rooms ?? '—'}</span>
                <span className="text-sm text-gray-500 dark:text-zinc-600 uppercase">Rooms</span>
              </div>
              <div className="flex flex-col items-center text-center border-l border-gray-300 dark:border-zinc-800">
                <Bath size={28} className="text-gray-600 dark:text-zinc-400 mb-1" />
                <span className="text-xl font-medium text-gray-900 dark:text-white">{property.bathrooms ?? '—'}</span>
                <span className="text-sm text-gray-500 dark:text-zinc-600 uppercase">Baths</span>
              </div>
              <div className="flex flex-col items-center text-center border-l border-gray-300 dark:border-zinc-800">
                <Box size={28} className="text-gray-600 dark:text-zinc-400 mb-1" />
                <span className="text-xl font-medium text-gray-900 dark:text-white">{property.balconies ?? '—'}</span>
                <span className="text-sm text-gray-500 dark:text-zinc-600 uppercase">Balc.</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Droplets size={28} className="text-gray-600 dark:text-zinc-400 mb-1" />
                <span className="text-xl font-medium text-gray-900 dark:text-white">{property.bathtubs ?? '—'}</span>
                <span className="text-sm text-gray-500 dark:text-zinc-600 uppercase">Tubs</span>
              </div>
              <div className="flex flex-col items-center text-center border-l border-gray-300 dark:border-zinc-800">
                <UtensilsCrossed size={28} className="text-gray-600 dark:text-zinc-400 mb-1" />
                <span className="text-xl font-medium text-gray-900 dark:text-white">{property.kitchens ?? '—'}</span>
                <span className="text-sm text-gray-500 dark:text-zinc-600 uppercase">Kit.</span>
              </div>
              <div className="flex flex-col items-center text-center border-l border-gray-300 dark:border-zinc-800">
                <Car size={28} className="text-gray-600 dark:text-zinc-400 mb-1" />
                <span className="text-xl font-medium text-gray-900 dark:text-white">{property.garage ?? '—'}</span>
                <span className="text-sm text-gray-500 dark:text-zinc-600 uppercase">Garage</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-zinc-800 flex justify-between items-center group/btn">
              <span className="text-xs text-gray-600 dark:text-zinc-500">View Details</span>
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-zinc-800 flex items-center justify-center group-hover/btn:bg-accent group-hover/btn:text-white dark:group-hover/btn:text-black transition-colors text-blue-600 dark:text-blue-400 group-hover/btn:text-black">
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
