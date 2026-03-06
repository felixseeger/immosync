import React from 'react';
import { Property } from '../types';
import { MapPin, Bed, Bath, Ruler, ArrowRight } from 'lucide-react';

interface PropertyListProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
}

export default function PropertyList({ properties, onSelectProperty }: PropertyListProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900/50">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/80">
              <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">Property</th>
              <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">Address</th>
              <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">Price</th>
              <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">Beds</th>
              <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">Baths</th>
              <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">Sq ft</th>
              <th className="px-4 py-3 font-semibold text-gray-700 dark:text-zinc-300">Status</th>
              <th className="px-4 py-3 w-10" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => (
              <tr
                key={property.id}
                onClick={() => onSelectProperty(property)}
                className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-200 dark:bg-zinc-800">
                      <img
                        src={property.mainImage || `https://picsum.photos/seed/${property.id}/96/96`}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{property.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-zinc-400 max-w-[200px] truncate" title={property.address}>
                  {property.address}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                  €{property.price?.toLocaleString() ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{property.bedrooms ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{property.bathrooms ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{property.sqft ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300">
                    {property.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-gray-500 dark:text-zinc-400 group-hover:text-accent">
                    <ArrowRight size={14} />
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
