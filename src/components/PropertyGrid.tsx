import React from 'react';
import { Property, Contact } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';
import { MapPin, LayoutGrid, Bath, Box, Droplets, UtensilsCrossed, Car, Users } from 'lucide-react';

interface PropertyGridProps {
  properties: Property[];
  linkedContactsByPropertyId?: Record<string, Contact[]>;
  onSelectProperty: (property: Property) => void;
}

const STAT_ICON_SIZE = 14;

export default function PropertyGrid({ properties, linkedContactsByPropertyId = {}, onSelectProperty }: PropertyGridProps) {
  const { t } = useLanguage();

  const translateStatus = (status: Property['status']) => {
    switch (status) {
      case 'Active': return t.propertyStatus.active;
      case 'Pending': return t.propertyStatus.pending;
      case 'Rented': return t.propertyStatus.rented;
      case 'Sold': return t.propertyStatus.sold;
      case 'For Sale': return t.propertyStatus.forSale;
      case 'For Rent': return t.propertyStatus.forRent;
      default: return status;
    }
  };

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
          {/* Image */}
          <div className="aspect-[4/3] overflow-hidden relative">
            <img
              src={property.mainImage || `https://picsum.photos/seed/${property.id}/800/600`}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

            <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-xs font-medium text-white">
              {translateStatus(property.status)}
            </div>

            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-xl font-bold text-white mb-1 truncate">{property.title}</h3>
              <div className="flex items-center text-gray-200 text-sm">
                <MapPin size={12} className="mr-1 shrink-0" />
                <span className="truncate">{property.address}</span>
              </div>
              {(linkedContactsByPropertyId[property.id]?.length ?? 0) > 0 && (
                <div className="flex items-center gap-1 mt-1.5 text-white/80 text-xs truncate">
                  <Users size={11} className="shrink-0" />
                  <span className="truncate">
                    {(() => {
                      const contacts = linkedContactsByPropertyId[property.id];
                      const names = contacts.slice(0, 2).map((c) => c.name);
                      return contacts.length > 2 ? `${names.join(', ')} +${contacts.length - 2}` : names.join(', ');
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  €{property.price.toLocaleString()}
                </span>
                {property.livingSpace != null && (
                  <div className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{property.livingSpace} m²</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-zinc-500 uppercase tracking-wider font-medium">
                  {property.type}
                </div>
                {property.marketingType && (
                  <div className="text-xs text-accent font-medium mt-0.5">
                    {t.marketing[property.marketingType.toLowerCase() as keyof typeof t.marketing]}
                  </div>
                )}
              </div>
            </div>

            {/* 6-stat grid — compact */}
            <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-200 dark:border-zinc-800">
              <div className="flex flex-col items-center text-center gap-0.5">
                <LayoutGrid size={STAT_ICON_SIZE} className="text-gray-400 dark:text-zinc-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{property.rooms ?? '—'}</span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-600 uppercase tracking-wide">{t.propertyDetail.rooms}</span>
              </div>
              <div className="flex flex-col items-center text-center gap-0.5 border-l border-gray-200 dark:border-zinc-800">
                <Bath size={STAT_ICON_SIZE} className="text-gray-400 dark:text-zinc-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{property.bathrooms ?? '—'}</span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-600 uppercase tracking-wide">{t.propertyDetail.baths}</span>
              </div>
              <div className="flex flex-col items-center text-center gap-0.5 border-l border-gray-200 dark:border-zinc-800">
                <Box size={STAT_ICON_SIZE} className="text-gray-400 dark:text-zinc-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{property.balconies ?? '—'}</span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-600 uppercase tracking-wide">{t.propertyDetail.balconies}</span>
              </div>
              <div className="flex flex-col items-center text-center gap-0.5">
                <Droplets size={STAT_ICON_SIZE} className="text-gray-400 dark:text-zinc-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{property.bathtubs ?? '—'}</span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-600 uppercase tracking-wide">{t.propertyDetail.bathtubs}</span>
              </div>
              <div className="flex flex-col items-center text-center gap-0.5 border-l border-gray-200 dark:border-zinc-800">
                <UtensilsCrossed size={STAT_ICON_SIZE} className="text-gray-400 dark:text-zinc-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{property.kitchens ?? '—'}</span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-600 uppercase tracking-wide">{t.propertyDetail.kitchens}</span>
              </div>
              <div className="flex flex-col items-center text-center gap-0.5 border-l border-gray-200 dark:border-zinc-800">
                <Car size={STAT_ICON_SIZE} className="text-gray-400 dark:text-zinc-500" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{property.garage ?? '—'}</span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-600 uppercase tracking-wide">{t.propertyDetail.garage}</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
