import React, { useState, useCallback, useEffect } from 'react';
import { Property } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { X, MapPin, LayoutGrid, Bath, Box, Droplets, UtensilsCrossed, Car, CheckCircle, Image as ImageIcon, ArrowLeft, Pencil, Trash2, Loader2, FileDown, Calendar, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import AddPropertyPanel from './AddPropertyPanel';
import ScheduleViewingModal from './ScheduleViewingModal';
import { deleteProperty, deletePropertyImage, updatePropertyImages } from '../services/propertyService';
import { downloadBrochurePdf } from '../utils/brochurePdf';
import { sfx } from '../utils/sfx';
import { t } from '../i18n/de';

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
  onDeleted?: () => void;
  /** Called after a successful edit so the parent can refetch and update the property. */
  onPropertyUpdated?: () => void;
}

export default function PropertyDetail({ property, onClose, onDeleted, onPropertyUpdated }: PropertyDetailProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showEditPanel, setShowEditPanel] = useState(false);

  const mainImage = property.mainImage || (property.images?.[0] ? property.images[0] : `https://picsum.photos/seed/${property.id}/1200/800`);
  const allImages = [mainImage, ...(property.images ?? []).filter((url) => url !== mainImage)];
  const safeIndex = allImages.length ? Math.min(carouselIndex, allImages.length - 1) : 0;
  const currentImage = allImages[safeIndex] ?? mainImage;
  const [editPanelInitialStep, setEditPanelInitialStep] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null);
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

  const handleDeleteImage = useCallback(
    async (imageUrl: string) => {
      setDeletingImageUrl(imageUrl);
      try {
        sfx.menuSelect();
        await deletePropertyImage(property.id, imageUrl);
        onPropertyUpdated?.();
      } catch (err) {
        console.error('Failed to delete image:', err);
      } finally {
        setDeletingImageUrl(null);
      }
    },
    [property.id, onPropertyUpdated]
  );

  const handleClose = useCallback(() => {
    sfx.menuClose();
    onClose();
  }, [onClose]);

  const handleGalleryDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination || result.source.index === result.destination.index) return;
      const reordered = [...allImages];
      const [removed] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, removed);
      try {
        sfx.menuSelect();
        await updatePropertyImages(property.id, reordered);
        onPropertyUpdated?.();
      } catch (err) {
        console.error('Failed to reorder gallery:', err);
      }
    },
    [property.id, allImages, onPropertyUpdated]
  );

  useEffect(() => {
    sfx.menuOpen();
  }, []);

  useEffect(() => {
    if (!selectedImage || allImages.length === 0) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImage(null);
        return;
      }
      const idx = Math.max(0, allImages.findIndex((url) => url === selectedImage));
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        sfx.menuSelect();
        setSelectedImage(allImages[idx <= 0 ? allImages.length - 1 : idx - 1]);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        sfx.menuSelect();
        setSelectedImage(allImages[idx >= allImages.length - 1 ? 0 : idx + 1]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedImage, allImages]);

  const panelTransition = { type: 'spring' as const, stiffness: 380, damping: 22 };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center pt-12 pb-4 px-4 sm:pt-16 sm:pb-6 sm:px-6 max-[1560px]:pt-10 max-[1560px]:pb-2 max-[1560px]:px-2"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 32 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={panelTransition}
        className="relative w-full max-w-5xl max-[1560px]:max-w-[94vw] max-[1560px]:max-h-[96vh] bg-app-light/85 dark:bg-app-dark/85 rounded-2xl max-[1560px]:rounded-xl overflow-hidden flex flex-col max-h-[90vh] border border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-sm"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-6 max-[1560px]:p-4 border-b border-gray-200 dark:border-zinc-800 bg-app-light/80 dark:bg-app-dark/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3 max-[1560px]:gap-2 min-w-0 flex-1">
            <button
              onClick={handleClose}
              aria-label={t.propertyDetail.goBack}
              className="p-2 shrink-0 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 text-gray-600 dark:text-zinc-400"
            >
              <ArrowLeft size={20} className="max-[1560px]:w-5 max-[1560px]:h-5" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <h2 className="text-2xl max-[1560px]:text-lg font-bold text-gray-900 dark:text-white truncate">{property.title}</h2>
              <div className="flex items-center text-gray-600 dark:text-zinc-400 text-sm max-[1560px]:text-xs truncate">
                <MapPin size={14} className="mr-1 shrink-0" />
                <span className="truncate">{property.address}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${
              property.status === 'Active' ? 'bg-accent/15 border-accent text-accent' :
              property.status === 'Pending' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
              property.status === 'Rented' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
              'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
            }`}>
              {property.status === 'Active' ? t.propertyStatus.active : property.status === 'Pending' ? t.propertyStatus.pending : property.status === 'Rented' ? t.propertyStatus.rented : t.propertyStatus.sold}
            </span>
            <button
              onClick={() => { sfx.menuSelect(); setEditPanelInitialStep(0); setShowEditPanel(true); }}
              className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
              aria-label={t.propertyDetail.editProperty}
            >
              <Pencil size={16} aria-hidden="true" />
            </button>
            <button
              onClick={() => { sfx.menuSelect(); setShowDeleteConfirm(true); }}
              className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 text-gray-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
              aria-label={t.propertyDetail.deleteProperty}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
            <button onClick={handleClose} aria-label={t.propertyDetail.close} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50">
              <X size={20} className="text-gray-600 dark:text-zinc-400" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-[1560px]:p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 max-[1560px]:grid-cols-1 gap-8 max-[1560px]:gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 max-[1560px]:col-span-1 space-y-8 max-[1560px]:space-y-6">
              {/* Image Carousel */}
              <div className="rounded-xl overflow-hidden bg-gray-300 dark:bg-zinc-800 border border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)] relative group aspect-video max-[1560px]:aspect-16/10">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={safeIndex}
                    src={currentImage}
                    alt={`${property.title} – ${carouselIndex + 1}`}
                    className="w-full h-full object-cover block"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </AnimatePresence>
                {allImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); sfx.menuSelect(); setCarouselIndex((i) => (i <= 0 ? allImages.length - 1 : i - 1)); }}
                      aria-label={t.propertyDetail.previousImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); sfx.menuSelect(); setCarouselIndex((i) => (i >= allImages.length - 1 ? 0 : i + 1)); }}
                      aria-label={t.propertyDetail.nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <ChevronRight size={24} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                      {allImages.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); sfx.menuSelect(); setCarouselIndex(i); }}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i === safeIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
                          }`}
                          aria-label={t.propertyDetail.goToImage.replace('{n}', String(i + 1))}
                        />
                      ))}
                    </div>
                  </>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6 pointer-events-none">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); sfx.menuSelect(); setSelectedImage(currentImage); }}
                    className="pointer-events-auto bg-accent text-white dark:text-black px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black/60"
                  >
                    {t.propertyDetail.viewFullScreen}
                  </button>
                </div>
              </div>

              {/* Gallery – thumbnails under carousel (reorderable) */}
              <div className="rounded-xl p-6 bg-app-light dark:bg-app-dark border border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.propertyDetail.gallery}</h3>
                  <span className="text-xs text-gray-600 dark:text-zinc-500">{allImages.length} {allImages.length !== 1 ? t.propertyDetail.photos : t.propertyDetail.photo}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-[1560px]:grid-cols-2 max-[1560px]:sm:grid-cols-3 gap-4">
                  <DragDropContext onDragEnd={handleGalleryDragEnd}>
                    <Droppable droppableId="gallery">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="contents"
                        >
                          {allImages.map((image, index) => (
                            <Draggable key={image} draggableId={`gallery-${index}`} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`relative group aspect-square rounded-lg overflow-hidden bg-gray-300 dark:bg-zinc-800 transition-all ring-2 ${
                                    safeIndex === index ? 'ring-accent ring-offset-2 ring-offset-white dark:ring-offset-zinc-900' : 'ring-transparent hover:opacity-90'
                                  } ${snapshot.isDragging ? 'opacity-90 shadow-xl ring-2 ring-accent z-10' : ''}`}
                                  onClick={() => { sfx.menuSelect(); setCarouselIndex(index); }}
                                >
                                  <div {...provided.dragHandleProps} className="absolute left-1 top-1 z-1 p-1 rounded bg-black/50 text-white/90 hover:bg-black/70 cursor-grab active:cursor-grabbing touch-none">
                                    <GripVertical size={16} />
                                  </div>
                                  <img src={image} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover pointer-events-none select-none" draggable={false} />
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(image); }}
                                    disabled={deletingImageUrl === image}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-red-500 disabled:opacity-60 disabled:cursor-wait transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50"
                                    title={t.propertyDetail.deleteImage}
                                  >
                                    {deletingImageUrl === image ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <Trash2 size={14} />
                                    )}
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                  <button
                    type="button"
                    className="aspect-square rounded-lg border-2 border-dashed border-white/40 dark:border-white/10 bg-app-light dark:bg-app-dark flex flex-col items-center justify-center text-gray-500 dark:text-zinc-500 hover:border-accent hover:text-accent active:border-accent active:bg-accent/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900 shadow-[0_4px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
                    onClick={() => { sfx.menuSelect(); setEditPanelInitialStep(3); setShowEditPanel(true); }}
                  >
                    <ImageIcon size={24} className="mb-2" />
                    <span className="text-xs">{t.propertyDetail.addPhoto}</span>
                  </button>
                </div>
              </div>

              {/* Short Description */}
              <div className="rounded-xl p-6 bg-app-light dark:bg-app-dark border border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.propertyDetail.shortDescription}</h3>
                <p className="text-gray-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                  {property.description || t.propertyDetail.noDescription}
                </p>
              </div>

              {/* Object Description */}
              {property.objectDescription && (
                <div className="rounded-xl p-6 bg-app-light dark:bg-app-dark border border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.propertyDetail.objectDescription}</h3>
                  <p className="text-gray-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                    {property.objectDescription}
                  </p>
                </div>
              )}

              {/* Location */}
              {property.locationDescription && (
                <div className="rounded-xl p-6 bg-app-light dark:bg-app-dark border border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.propertyDetail.location}</h3>
                  <p className="text-gray-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                    {property.locationDescription}
                  </p>
                </div>
              )}

              {/* Videos */}
              {property.videos && property.videos.length > 0 && (
                <div className="rounded-xl p-6 bg-app-light dark:bg-app-dark border border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.propertyDetail.videos}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {property.videos.map((videoUrl, index) => (
                      <div key={index} className="aspect-video rounded-lg overflow-hidden bg-gray-300 dark:bg-zinc-800 border border-white/40 dark:border-white/10">
                        <video
                          src={videoUrl}
                          controls
                          className="w-full h-full object-contain"
                          playsInline
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6 max-[1560px]:space-y-4 max-[1560px]:lg:col-span-1">
              <div className="rounded-xl p-6 max-[1560px]:p-4 bg-app-light dark:bg-app-dark border border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                <div className="text-3xl max-[1560px]:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  €{property.price.toLocaleString()}
                </div>
                <div className="text-gray-600 dark:text-zinc-500 text-sm max-[1560px]:text-xs mb-6 max-[1560px]:mb-4">
                  {t.propertyDetail.estMortgage.replace('{amount}', Math.round(property.price * 0.0045).toLocaleString())}
                </div>

                {property.status === 'Rented' && (property.moveInDate || property.moveOutDate) && (
                  <div className="mb-6 max-[1560px]:mb-4 p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 space-y-2">
                    {property.moveInDate && (
                      <p className="text-sm text-gray-700 dark:text-zinc-300">
                        <span className="text-gray-500 dark:text-zinc-500">{t.propertyRental.moveInDate}:</span>{' '}
                        {new Date(property.moveInDate + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                    )}
                    {property.moveOutDate && (
                      <p className="text-sm text-gray-700 dark:text-zinc-300">
                        <span className="text-gray-500 dark:text-zinc-500">{t.propertyRental.moveOutDate}:</span>{' '}
                        {new Date(property.moveOutDate + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                )}

                {property.status === 'Sold' && (property.purchaseDate || property.saleDate) && (
                  <div className="mb-6 max-[1560px]:mb-4 p-3 rounded-xl bg-zinc-500/10 dark:bg-zinc-500/15 border border-zinc-500/30 space-y-2">
                    {property.purchaseDate && (
                      <p className="text-sm text-gray-700 dark:text-zinc-300">
                        <span className="text-gray-500 dark:text-zinc-500">{t.propertySale.purchaseDate}:</span>{' '}
                        {new Date(property.purchaseDate + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                    )}
                    {property.saleDate && (
                      <p className="text-sm text-gray-700 dark:text-zinc-300">
                        <span className="text-gray-500 dark:text-zinc-500">{t.propertySale.saleDate}:</span>{' '}
                        {new Date(property.saleDate + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 max-[1560px]:gap-2 gap-3 mb-6 max-[1560px]:mb-4">
                  <div className="text-center p-3 bg-app-light dark:bg-app-dark rounded-lg border border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:border-accent/50 transition-colors">
                    <LayoutGrid size={20} className="mx-auto mb-1 text-gray-600 dark:text-zinc-400" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{property.rooms ?? '—'}</div>
                    <div className="text-[10px] text-gray-600 dark:text-white uppercase">{t.propertyDetail.rooms}</div>
                  </div>
                  <div className="text-center p-3 bg-app-light dark:bg-app-dark rounded-lg border border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:border-accent/50 transition-colors">
                    <Bath size={20} className="mx-auto mb-1 text-gray-600 dark:text-zinc-400" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{property.bathrooms ?? '—'}</div>
                    <div className="text-[10px] text-gray-600 dark:text-white uppercase">{t.propertyDetail.baths}</div>
                  </div>
                  <div className="text-center p-3 bg-app-light dark:bg-app-dark rounded-lg border border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:border-accent/50 transition-colors">
                    <Box size={20} className="mx-auto mb-1 text-gray-600 dark:text-zinc-400" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{property.balconies ?? '—'}</div>
                    <div className="text-[10px] text-gray-600 dark:text-white uppercase">{t.propertyDetail.balconies}</div>
                  </div>
                  <div className="text-center p-3 bg-app-light dark:bg-app-dark rounded-lg border border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:border-accent/50 transition-colors">
                    <Droplets size={20} className="mx-auto mb-1 text-gray-600 dark:text-zinc-400" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{property.bathtubs ?? '—'}</div>
                    <div className="text-[10px] text-gray-600 dark:text-white uppercase">{t.propertyDetail.bathtubs}</div>
                  </div>
                  <div className="text-center p-3 bg-app-light dark:bg-app-dark rounded-lg border border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:border-accent/50 transition-colors">
                    <UtensilsCrossed size={20} className="mx-auto mb-1 text-gray-600 dark:text-zinc-400" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{property.kitchens ?? '—'}</div>
                    <div className="text-[10px] text-gray-600 dark:text-white uppercase">{t.propertyDetail.kitchens}</div>
                  </div>
                  <div className="text-center p-3 bg-app-light dark:bg-app-dark rounded-lg border border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:border-accent/50 transition-colors">
                    <Car size={20} className="mx-auto mb-1 text-gray-600 dark:text-zinc-400" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{property.garage ?? '—'}</div>
                    <div className="text-[10px] text-gray-600 dark:text-white uppercase">{t.propertyDetail.garage}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { sfx.menuSelect(); handleGenerateBrochure(); }}
                  disabled={generatingBrochure}
                  className="w-full bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white font-medium py-3 rounded-xl border-2 border-gray-300 dark:border-zinc-700 hover:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors mb-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generatingBrochure ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
                  {generatingBrochure ? t.propertyDetail.generating : t.propertyDetail.generateBrochure}
                </button>
                <button
                  type="button"
                  onClick={() => { sfx.menuSelect(); setShowScheduleViewing(true); }}
                  className="w-full bg-accent text-white dark:text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity mb-3 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900"
                >
                  <Calendar size={18} />
                  {t.propertyDetail.scheduleViewing}
                </button>
              </div>

              {/* Features */}
              <div className="rounded-xl p-6 max-[1560px]:p-4 bg-app-light dark:bg-app-dark border border-white/40 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.propertyDetail.features}</h3>
                <div className="grid grid-cols-2 max-[1560px]:gap-2 gap-3">
                  {property.features?.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-700 dark:text-zinc-400 text-sm">
                      <CheckCircle size={14} className="text-accent shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (() => {
          const lightboxIndex = Math.max(0, allImages.findIndex((url) => url === selectedImage));
          const goPrev = (e: React.MouseEvent) => {
            e.stopPropagation();
            sfx.menuSelect();
            const next = lightboxIndex <= 0 ? allImages.length - 1 : lightboxIndex - 1;
            setSelectedImage(allImages[next]);
          };
          const goNext = (e: React.MouseEvent) => {
            e.stopPropagation();
            sfx.menuSelect();
            const next = lightboxIndex >= allImages.length - 1 ? 0 : lightboxIndex + 1;
            setSelectedImage(allImages[next]);
          };
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4"
              onClick={() => { sfx.menuSelect(); setSelectedImage(null); }}
            >
              <button
                type="button"
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-accent/20 hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                onClick={(e) => { e.stopPropagation(); sfx.menuSelect(); setSelectedImage(null); }}
                aria-label={t.propertyDetail.close}
              >
                <X size={24} />
              </button>
              <div
                className="flex flex-col items-center gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={selectedImage}
                  alt={`Full screen ${lightboxIndex + 1} of ${allImages.length}`}
                  className="max-w-[55vw] max-h-[60vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
                />
                {allImages.length > 1 && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={goPrev}
                      aria-label={t.propertyDetail.previousImage}
                      className="p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <ChevronLeft size={32} />
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      aria-label={t.propertyDetail.nextImage}
                      className="p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <ChevronRight size={32} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}
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
              className="bg-app-light dark:bg-app-dark border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-500/10 rounded-full">
                  <Trash2 size={20} className="text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.propertyDetail.deleteConfirmTitle}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-zinc-400 mb-6">
                {t.propertyDetail.deleteConfirmDesc}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { sfx.menuSelect(); setShowDeleteConfirm(false); }}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 hover:border-accent/50 border-2 border-transparent text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={() => { sfx.menuSelect(); handleDelete(); }}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  {isDeleting ? (
                    <><Loader2 className="animate-spin" size={14} /> {t.propertyDetail.deleting}</>
                  ) : (
                    t.common.delete
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
            initialStep={editPanelInitialStep}
            onClose={() => setShowEditPanel(false)}
            onSuccess={() => {
              setShowEditPanel(false);
              onPropertyUpdated?.();
            }}
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
