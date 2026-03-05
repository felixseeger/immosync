import React, { useState } from 'react';
import { Property } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Bed, Bath, Ruler, CheckCircle, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
}

export default function PropertyDetail({ property, onClose }: PropertyDetailProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleUploadComplete = (url: string) => {
    // Optimistically update the local state or re-fetch
    // For simplicity, we might just append to the local property object if it's mutable, 
    // but ideally we should refetch or update the parent state.
    // Here we'll just show a success message or refresh the gallery.
    console.log("Image uploaded:", url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-zinc-400" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-white">{property.title}</h2>
              <div className="flex items-center text-zinc-400 text-sm">
                <MapPin size={14} className="mr-1" />
                {property.address}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              property.status === 'Active' ? 'bg-neon-yellow/10 border-neon-yellow/20 text-neon-yellow' :
              property.status === 'Pending' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
              'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
            }`}>
              {property.status}
            </span>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
              <X size={20} className="text-zinc-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Main Image */}
              <div className="aspect-video rounded-xl overflow-hidden bg-zinc-800 relative group">
                <img 
                  src={property.mainImage || `https://picsum.photos/seed/${property.id}/1200/800`} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <button className="bg-white text-black px-4 py-2 rounded-lg font-medium text-sm hover:bg-zinc-200 transition-colors">
                    View Full Screen
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">About this property</h3>
                <p className="text-zinc-400 leading-relaxed">
                  {property.description || "No description available for this property."}
                </p>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Features</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {property.features?.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-zinc-400 text-sm">
                      <CheckCircle size={14} className="text-neon-yellow" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gallery */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Gallery</h3>
                  <span className="text-xs text-zinc-500">{property.images?.length || 0} photos</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {property.images?.map((image, index) => (
                    <div 
                      key={index} 
                      className="aspect-square rounded-lg overflow-hidden bg-zinc-800 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage(image)}
                    >
                      <img src={image} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  
                  {/* Upload Placeholder */}
                  <div className="aspect-square rounded-lg border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-600 hover:border-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer">
                    <ImageIcon size={24} className="mb-2" />
                    <span className="text-xs">Add Photo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-800">
                <div className="text-3xl font-bold text-white mb-1">
                  ${property.price.toLocaleString()}
                </div>
                <div className="text-zinc-500 text-sm mb-6">
                  Est. Mortgage: ${Math.round(property.price * 0.0045).toLocaleString()}/mo
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                    <Bed size={20} className="mx-auto mb-1 text-zinc-400" />
                    <div className="text-lg font-bold text-white">{property.bedrooms}</div>
                    <div className="text-[10px] text-zinc-600 uppercase">Beds</div>
                  </div>
                  <div className="text-center p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                    <Bath size={20} className="mx-auto mb-1 text-zinc-400" />
                    <div className="text-lg font-bold text-white">{property.bathrooms}</div>
                    <div className="text-[10px] text-zinc-600 uppercase">Baths</div>
                  </div>
                  <div className="text-center p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                    <Ruler size={20} className="mx-auto mb-1 text-zinc-400" />
                    <div className="text-lg font-bold text-white">{property.sqft}</div>
                    <div className="text-[10px] text-zinc-600 uppercase">Sq Ft</div>
                  </div>
                </div>

                <button className="w-full bg-neon-yellow text-black font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors mb-3">
                  Schedule Tour
                </button>
                <button className="w-full bg-zinc-900 text-white font-medium py-3 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-colors">
                  Contact Agent
                </button>
              </div>

              {/* Upload Section */}
              <div className="bg-zinc-800/30 rounded-xl p-6 border border-zinc-800">
                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Manage Photos</h4>
                <ImageUpload 
                  propertyId={property.id} 
                  onUploadComplete={handleUploadComplete} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full text-white hover:bg-zinc-700"
              onClick={() => setSelectedImage(null)}
            >
              <X size={24} />
            </button>
            <img 
              src={selectedImage} 
              alt="Full screen" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
