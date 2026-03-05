import React from 'react';
import { Property } from '../types';
import { motion } from 'motion/react';
import { MapPin, Bed, Bath, Ruler, ArrowRight } from 'lucide-react';

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
          className="group relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
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
              <div className="flex items-center text-zinc-400 text-sm">
                <MapPin size={14} className="mr-1" />
                <span className="truncate">{property.address}</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-white">
                ${property.price.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                {property.type}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-4 border-t border-zinc-800">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center text-zinc-400 mb-1">
                  <Bed size={16} className="mr-1" />
                  <span className="text-sm font-medium">{property.bedrooms}</span>
                </div>
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Beds</span>
              </div>
              <div className="flex flex-col items-center text-center border-l border-zinc-800">
                <div className="flex items-center text-zinc-400 mb-1">
                  <Bath size={16} className="mr-1" />
                  <span className="text-sm font-medium">{property.bathrooms}</span>
                </div>
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Baths</span>
              </div>
              <div className="flex flex-col items-center text-center border-l border-zinc-800">
                <div className="flex items-center text-zinc-400 mb-1">
                  <Ruler size={16} className="mr-1" />
                  <span className="text-sm font-medium">{property.sqft}</span>
                </div>
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Sq Ft</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center group/btn">
              <span className="text-xs text-zinc-500">View Details</span>
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover/btn:bg-neon-yellow group-hover/btn:text-black transition-colors">
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
