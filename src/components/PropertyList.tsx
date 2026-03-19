import React from 'react';
import { Property, Contact } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, Users } from 'lucide-react';

interface PropertyListProps {
  properties: Property[];
  linkedContactsByPropertyId?: Record<string, Contact[]>;
  onSelectProperty: (property: Property) => void;
}

export default function PropertyList({ properties, linkedContactsByPropertyId = {}, onSelectProperty }: PropertyListProps) {
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

  const statusColor = (status: Property['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'Pending': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'Sold': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'Rented': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      default: return 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400';
    }
  };

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/80">
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-zinc-400">{t.property.property}</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-zinc-400">{t.property.address}</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-zinc-400">{t.propertyUi.price}</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-zinc-400">{t.propertyDetail.rooms}</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-zinc-400">{t.propertyDetail.baths}</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-zinc-400">{t.propertyDetail.balconies}</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-zinc-400">{t.propertyDetail.bathtubs}</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-zinc-400">{t.propertyDetail.kitchens}</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-zinc-400">{t.propertyDetail.garage}</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-zinc-400">{t.contact.contacts ?? 'Contacts'}</th>
              <th className="px-4 py-3 font-semibold text-gray-600 dark:text-zinc-400">{t.propertyUi.status}</th>
              <th className="px-4 py-3 w-10" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => (
              <tr
                key={property.id}
                onClick={() => onSelectProperty(property)}
                className="border-b border-gray-100 dark:border-zinc-800 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-200 dark:bg-zinc-800">
                      <img
                        src={property.mainImage || `https://picsum.photos/seed/${property.id}/80/80`}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate max-w-[180px]">{property.title}</p>
                      {property.type && (
                        <p className="text-xs text-gray-400 dark:text-zinc-600">{property.type}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-zinc-400 max-w-[180px] truncate" title={property.address}>
                  {property.address}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-semibold text-gray-900 dark:text-white">€{property.price?.toLocaleString() ?? '—'}</span>
                  {property.livingSpace != null && (
                    <span className="text-xs text-gray-400 dark:text-zinc-500 ml-1">{property.livingSpace} m²</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{property.rooms ?? property.bedrooms ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{property.bathrooms ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{property.balconies ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{property.bathtubs ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{property.kitchens ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{property.garage ?? '—'}</td>
                <td className="px-4 py-3">
                  {(linkedContactsByPropertyId[property.id]?.length ?? 0) > 0 ? (
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400 text-sm max-w-[180px]">
                      <Users size={13} className="shrink-0" />
                      <span className="truncate" title={linkedContactsByPropertyId[property.id].map((c) => c.name).join(', ')}>
                        {linkedContactsByPropertyId[property.id].map((c) => c.name).join(', ')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-300 dark:text-zinc-700">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(property.status)}`}>
                    {translateStatus(property.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-500 group-hover:text-accent">
                    <ArrowRight size={13} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
