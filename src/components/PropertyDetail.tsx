import React, { useState, useCallback, useEffect } from 'react';
import { Property } from '../types';
import MatchingProspects from './MatchingProspects';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Bed, Bath, Ruler, CheckCircle, Image as ImageIcon, ArrowLeft, Pencil, Trash2, Loader2, FileDown, Calendar } from 'lucide-react';
import ImageUpload from './ImageUpload';
import AddPropertyPanel from './AddPropertyPanel';
import ScheduleViewingModal from './ScheduleViewingModal';
import { deleteProperty } from '../services/propertyService';
import { downloadBrochurePdf } from '../utils/brochurePdf';
import { sfx } from '../utils/sfx';

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
  onDeleted?: () => void;
}

export default function PropertyDetail({ property, onClose, onDeleted }: PropertyDetailProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [generatingBrochure, setGeneratingBrochure] = useState(false);
  const [showScheduleViewing, setShowScheduleViewing] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProperty(property.id);
      onDeleted?.();
      onClose();
    } catch (err) {
      console.error('Failed to delete property:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleUploadComplete = (url: string) => {
    console.log("Image uploaded:", url);
  };

  const handleGenerateBrochure = async () => {
    setGeneratingBrochure(true);
    try {
      await downloadBrochurePdf(property);
    } catch (err) {
      console.error('Brochure generation failed', err);
    } finally {
      setGeneratingBrochure(false);
    }
  };

  const handleClose = useCallback(() => {
    sfx.menuClose();
    onClose();
  }, [onClose]);

  useEffect(() => {
    sfx.menuOpen();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-300 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#D9FF00]/50 text-gray-600 dark:text-zinc-400"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{property.title}</h2>
              <div className="flex items-center text-gray-600 dark:text-zinc-400 text-sm">
                <MapPin size={14} className="mr-1" />
                {property.address}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${
              property.status === 'Active' ? 'bg-[#D9FF00]/15 border-[#D9FF00] text-[#D9FF00]' :
              property.status === 'Pending' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
              'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
            }`}>
              {property.status}
            </span>
            <button
              onClick={() => { sfx.menuSelect(); setShowEditPanel(true); }}
              className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#D9FF00]/50 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
              title="Edit property"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => { sfx.menuSelect(); setShowDeleteConfirm(true); }}
              className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#D9FF00]/50 text-gray-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
              title="Delete property"
            >
              <Trash2 size={16} />
            </button>
            <button onClick={handleClose} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#D9FF00]/50">
              <X size={20} className="text-gray-600 dark:text-zinc-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Main Image */}
              <div className="aspect-video rounded-xl overflow-hidden bg-gray-300 dark:bg-zinc-800 relative group">
                <img 
                  src={property.mainImage || `https://picsum.photos/seed/${property.id}/1200/800`} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <button
                    onClick={(e) => { e.stopPropagation(); sfx.menuSelect(); setSelectedImage(property.mainImage || null); }}
                    className="bg-[#D9FF00] text-black px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#D9FF00] focus:ring-offset-2 focus:ring-offset-black/60"
                  >
                    View Full Screen
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">About this property</h3>
                <p className="text-gray-600 dark:text-zinc-400 leading-relaxed">
                  {property.description || "No description available for this property."}
                </p>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Features</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {property.features?.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-700 dark:text-zinc-400 text-sm">
                      <CheckCircle size={14} className="text-[#D9FF00] shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gallery */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gallery</h3>
                  <span className="text-xs text-gray-600 dark:text-zinc-500">{property.images?.length || 0} photos</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {property.images?.map((image, index) => (
                    <div 
                      key={index} 
                      className={`aspect-square rounded-lg overflow-hidden bg-gray-300 dark:bg-zinc-800 cursor-pointer transition-all ring-2 ${
                        selectedImage === image ? 'ring-[#D9FF00] ring-offset-2 ring-offset-white dark:ring-offset-zinc-900' : 'ring-transparent hover:opacity-90'
                      }`}
                      onClick={() => { sfx.menuSelect(); setSelectedImage(image); }}
                    >
                      <img src={image} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  
                  {/* Upload Placeholder */}
                  <div
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-400 dark:border-zinc-800 flex flex-col items-center justify-center text-gray-500 dark:text-zinc-600 hover:border-[#D9FF00] hover:text-[#D9FF00] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D9FF00]/50"
                    onClick={() => sfx.menuSelect()}
                  >
                    <ImageIcon size={24} className="mb-2" />
                    <span className="text-xs">Add Photo</span>
                  </div>
                </div>
              </div>
            </div>

            <MatchingProspects property={property} />

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-800/50 rounded-xl p-6 border border-gray-300 dark:border-zinc-800">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  ${property.price.toLocaleString()}
                </div>
                <div className="text-gray-600 dark:text-zinc-500 text-sm mb-6">
                  Est. Mortgage: ${Math.round(property.price * 0.0045).toLocaleString()}/mo
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-100 dark:bg-zinc-900 rounded-lg border-2 border-gray-300 dark:border-zinc-800 hover:border-[#D9FF00]/50 transition-colors">
                    <Bed size={20} className="mx-auto mb-1 text-gray-600 dark:text-zinc-400" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{property.bedrooms}</div>
                    <div className="text-[10px] text-gray-600 dark:text-zinc-600 uppercase">Beds</div>
                  </div>
                  <div className="text-center p-3 bg-gray-100 dark:bg-zinc-900 rounded-lg border-2 border-gray-300 dark:border-zinc-800 hover:border-[#D9FF00]/50 transition-colors">
                    <Bath size={20} className="mx-auto mb-1 text-gray-600 dark:text-zinc-400" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{property.bathrooms}</div>
                    <div className="text-[10px] text-gray-600 dark:text-zinc-600 uppercase">Baths</div>
                  </div>
                  <div className="text-center p-3 bg-gray-100 dark:bg-zinc-900 rounded-lg border-2 border-gray-300 dark:border-zinc-800 hover:border-[#D9FF00]/50 transition-colors">
                    <Ruler size={20} className="mx-auto mb-1 text-gray-600 dark:text-zinc-400" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{property.sqft}</div>
                    <div className="text-[10px] text-gray-600 dark:text-zinc-600 uppercase">Sq Ft</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { sfx.menuSelect(); handleGenerateBrochure(); }}
                  disabled={generatingBrochure}
                  className="w-full bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium py-3 rounded-xl border-2 border-gray-300 dark:border-zinc-700 hover:border-[#D9FF00]/50 focus:outline-none focus:ring-2 focus:ring-[#D9FF00]/50 transition-colors mb-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generatingBrochure ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
                  {generatingBrochure ? 'Generating…' : 'Generate Brochure'}
                </button>
                <button
                  type="button"
                  onClick={() => { sfx.menuSelect(); setShowScheduleViewing(true); }}
                  className="w-full bg-[#D9FF00] text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity mb-3 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#D9FF00] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900"
                >
                  <Calendar size={18} />
                  Schedule Viewing
                </button>
                <button
                  type="button"
                  onClick={() => sfx.menuSelect()}
                  className="w-full bg-gray-200 dark:bg-zinc-900 text-gray-900 dark:text-white font-medium py-3 rounded-xl border-2 border-gray-300 dark:border-zinc-700 hover:border-[#D9FF00]/50 focus:outline-none focus:ring-2 focus:ring-[#D9FF00]/50 transition-colors"
                >
                  Contact Agent
                </button>
              </div>

              {/* Upload Section */}
              <div className="bg-gray-100 dark:bg-zinc-800/30 rounded-xl p-6 border border-gray-300 dark:border-zinc-800">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Manage Photos</h4>
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
            className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4"
            onClick={() => { sfx.menuSelect(); setSelectedImage(null); }}
          >
            <button 
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-[#D9FF00]/20 hover:text-[#D9FF00] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D9FF00]"
              onClick={(e) => { e.stopPropagation(); sfx.menuSelect(); setSelectedImage(null); }}
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-500/10 rounded-full">
                  <Trash2 size={20} className="text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Property?</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-zinc-400 mb-6">
                This will permanently delete{' '}
                <span className="text-gray-900 dark:text-white font-medium">{property.title}</span>{' '}                and all associated images. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { sfx.menuSelect(); setShowDeleteConfirm(false); }}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 hover:border-[#D9FF00]/50 border-2 border-transparent text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#D9FF00]/50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { sfx.menuSelect(); handleDelete(); }}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  {isDeleting ? (
                    <><Loader2 className="animate-spin" size={14} /> Deleting…</>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Panel */}
      <AnimatePresence>
        {showEditPanel && (
          <AddPropertyPanel
            property={property}
            onClose={() => setShowEditPanel(false)}
            onSuccess={() => setShowEditPanel(false)}
          />
        )}
      </AnimatePresence>

      {/* Schedule Viewing Modal */}
      <AnimatePresence>
        {showScheduleViewing && (
          <ScheduleViewingModal
            property={property}
            onClose={() => setShowScheduleViewing(false)}
            onSuccess={() => setShowScheduleViewing(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
