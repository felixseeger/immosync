import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  MapPin,
  Loader2,
  Star,
  AlertCircle,
  Zap,
  UploadCloud,
  Trash2,
} from 'lucide-react';
import { createProperty, updatePropertyImages, updateProperty, deletePropertyImage } from '../services/propertyService';
import { uploadPropertyImage } from '../services/storageService';
import { auth } from '../firebase';
import type { MarketingType, HeatingType, Property } from '../types';

/* ─── Constants ────────────────────────────────────────────────────────────── */

const PROPERTY_TYPES = [
  'Apartment',
  'House',
  'Villa',
  'Penthouse',
  'Office',
  'Commercial',
  'Land',
  'Garage',
];

const HEATING_TYPES: HeatingType[] = [
  'Central Heating',
  'Gas',
  'Electric',
  'Heat Pump',
  'District Heating',
  'Oil',
  'Pellet',
  'Solar',
];

const STEPS = ['Basics', 'Address', 'Details', 'Media'];

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface FormState {
  // Step 1
  title: string;
  description: string;
  marketingType: 'Sale' | 'Rent';
  propertyType: string;
  status: 'Active' | 'Pending' | 'Sold';
  // Step 2
  street: string;
  houseNumber: string;
  zip: string;
  city: string;
  state: string;
  country: string;
  // Step 3
  livingSpace: string;
  lotSize: string;
  rooms: string;
  bathrooms: string;
  yearBuilt: string;
  price: string;
  additionalCosts: string;
  commission: string;
  energyCertificate: string;
  heatingType: string;
}

const DEFAULTS: FormState = {
  title: '',
  description: '',
  marketingType: 'Sale',
  propertyType: 'Apartment',
  status: 'Active',
  street: '',
  houseNumber: '',
  zip: '',
  city: '',
  state: '',
  country: 'Germany',
  livingSpace: '',
  lotSize: '',
  rooms: '',
  bathrooms: '',
  yearBuilt: '',
  price: '',
  additionalCosts: '',
  commission: '',
  energyCertificate: '',
  heatingType: 'Central Heating',
};

interface StagedFile {
  file: File;
  preview: string;
}

/* ─── Shared style tokens ───────────────────────────────────────────────────── */

const inputCls =
  'w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neon-yellow transition-colors placeholder:text-gray-500 dark:placeholder:text-zinc-600';

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
    {children}
    {required && <span className="text-neon-yellow ml-1">*</span>}
  </label>
);

/* ─── Step 1 — Basics ───────────────────────────────────────────────────────── */

function Step1({
  form,
  set,
  setForm,
}: {
  form: FormState;
  set: (f: keyof FormState) => (e: React.ChangeEvent<any>) => void;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  return (
    <div className="space-y-5">
      <div>
        <Label required>Internal Title</Label>
        <input
          type="text"
          value={form.title}
          onChange={set('title')}
          placeholder="e.g. Penthouse München Schwabing"
          className={inputCls}
          autoFocus
        />
      </div>

      <div>
        <Label>Marketing Type</Label>
        <div className="flex bg-white dark:bg-zinc-800 rounded-lg p-1 border border-gray-300 dark:border-zinc-700 gap-1">
          {(['Sale', 'Rent'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, marketingType: t }))}
              className={`flex-1 py-2.5 rounded-md text-sm font-bold transition-all ${
                form.marketingType === t
                  ? 'bg-neon-yellow text-black shadow'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              For {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Property Type</Label>
        <div className="grid grid-cols-4 gap-2">
          {PROPERTY_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, propertyType: t }))}
              className={`py-2 px-1 rounded-lg text-xs font-medium transition-all border ${
                form.propertyType === t
                  ? 'bg-neon-yellow/10 border-neon-yellow/50 text-neon-yellow'
                  : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Status</Label>
        <div className="flex bg-white dark:bg-zinc-800 rounded-lg p-1 border border-gray-300 dark:border-zinc-700 gap-1">
          {(['Active', 'Pending', 'Sold'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setForm((f) => ({ ...f, status: s }))}
              className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${
                form.status === s
                  ? s === 'Active'
                    ? 'bg-neon-yellow text-black'
                    : s === 'Pending'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-400 dark:bg-zinc-500 text-white'
                  : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <textarea
          value={form.description}
          onChange={set('description')}
          placeholder="Describe this property for marketing materials..."
          className={`${inputCls} resize-none`}
          rows={4}
        />
      </div>
    </div>
  );
}

/* ─── Step 2 — Address ──────────────────────────────────────────────────────── */

function Step2({
  form,
  set,
}: {
  form: FormState;
  set: (f: keyof FormState) => (e: React.ChangeEvent<any>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Label>Street</Label>
          <input
            type="text"
            value={form.street}
            onChange={set('street')}
            placeholder="Maximilianstraße"
            className={inputCls}
          />
        </div>
        <div>
          <Label>No.</Label>
          <input
            type="text"
            value={form.houseNumber}
            onChange={set('houseNumber')}
            placeholder="12a"
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>ZIP Code</Label>
          <input
            type="text"
            value={form.zip}
            onChange={set('zip')}
            placeholder="80539"
            className={inputCls}
          />
        </div>
        <div>
          <Label required>City</Label>
          <input
            type="text"
            value={form.city}
            onChange={set('city')}
            placeholder="Munich"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <Label>State / Province</Label>
        <input
          type="text"
          value={form.state}
          onChange={set('state')}
          placeholder="Bavaria"
          className={inputCls}
        />
      </div>

      <div>
        <Label>Country</Label>
        <input
          type="text"
          value={form.country}
          onChange={set('country')}
          placeholder="Germany"
          className={inputCls}
        />
      </div>

      {/* Map preview placeholder */}
      <div className="bg-gray-200 dark:bg-zinc-800/40 border border-gray-300 dark:border-zinc-700/50 border-dashed rounded-xl h-28 flex items-center justify-center">
        <div className="text-center">
          <MapPin size={20} className="mx-auto mb-1 text-gray-500 dark:text-zinc-600" />
          <p className="text-xs text-gray-600 dark:text-zinc-600">Map preview available after creation</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3 — Details ──────────────────────────────────────────────────────── */

function Step3({
  form,
  set,
}: {
  form: FormState;
  set: (f: keyof FormState) => (e: React.ChangeEvent<any>) => void;
}) {
  return (
    <div className="space-y-7">
      {/* Physical */}
      <div>
        <p className="text-[11px] font-bold text-gray-600 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2 before:flex-1 before:h-px before:bg-gray-300 dark:before:bg-zinc-800 after:flex-1 after:h-px after:bg-gray-300 dark:after:bg-zinc-800">
          <span>Physical Properties</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Living Space (m²)</Label>
            <input
              type="number"
              value={form.livingSpace}
              onChange={set('livingSpace')}
              placeholder="120"
              className={inputCls}
              min={0}
            />
          </div>
          <div>
            <Label>Lot Size (m²)</Label>
            <input
              type="number"
              value={form.lotSize}
              onChange={set('lotSize')}
              placeholder="350"
              className={inputCls}
              min={0}
            />
          </div>
          <div>
            <Label>Total Rooms</Label>
            <input
              type="number"
              value={form.rooms}
              onChange={set('rooms')}
              placeholder="4"
              className={inputCls}
              min={0}
              step={0.5}
            />
          </div>
          <div>
            <Label>Bathrooms</Label>
            <input
              type="number"
              value={form.bathrooms}
              onChange={set('bathrooms')}
              placeholder="2"
              className={inputCls}
              min={0}
              step={0.5}
            />
          </div>
        </div>
        <div className="mt-3">
          <Label>Year of Construction</Label>
          <input
            type="number"
            value={form.yearBuilt}
            onChange={set('yearBuilt')}
            placeholder="2012"
            className={inputCls}
            min={1800}
            max={2030}
          />
        </div>
      </div>

      {/* Pricing */}
      <div>
        <p className="text-[11px] font-bold text-gray-600 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2 before:flex-1 before:h-px before:bg-gray-300 dark:before:bg-zinc-800 after:flex-1 after:h-px after:bg-gray-300 dark:after:bg-zinc-800">
          <span>Pricing</span>
        </p>
        <div className="space-y-3">
          <div>
            <Label required>
              {form.marketingType === 'Rent' ? 'Monthly Rent (€)' : 'Purchase Price (€)'}
            </Label>
            <input
              type="number"
              value={form.price}
              onChange={set('price')}
              placeholder={form.marketingType === 'Rent' ? '2500' : '450000'}
              className={inputCls}
              min={0}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Additional Costs (€)</Label>
              <input
                type="number"
                value={form.additionalCosts}
                onChange={set('additionalCosts')}
                placeholder="3500"
                className={inputCls}
                min={0}
              />
            </div>
            <div>
              <Label>Commission (%)</Label>
              <input
                type="number"
                value={form.commission}
                onChange={set('commission')}
                placeholder="3.57"
                className={inputCls}
                min={0}
                step={0.01}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Energy & Legal */}
      <div>
        <p className="text-[11px] font-bold text-gray-600 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2 before:flex-1 before:h-px before:bg-gray-300 dark:before:bg-zinc-800 after:flex-1 after:h-px after:bg-gray-300 dark:after:bg-zinc-800">
          <span>Energy &amp; Legal</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Energy Certificate (kWh/m²a)</Label>
            <input
              type="number"
              value={form.energyCertificate}
              onChange={set('energyCertificate')}
              placeholder="85"
              className={inputCls}
              min={0}
            />
          </div>
          <div>
            <Label>Heating Type</Label>
            <select value={form.heatingType} onChange={set('heatingType')} className={inputCls}>
              {HEATING_TYPES.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 4 — Media ────────────────────────────────────────────────────────── */

function Step4({
  stagedFiles,
  getRootProps,
  getInputProps,
  isDragActive,
  removeFile,
  isEditing,
  propertyImages,
  isDeleting,
  deletingImageUrl,
  onDeleteImage,
}: {
  stagedFiles: StagedFile[];
  getRootProps: () => object;
  getInputProps: () => object;
  isDragActive: boolean;
  removeFile: (i: number) => void;
  isEditing: boolean;
  propertyImages: string[];
  isDeleting: boolean;
  deletingImageUrl: string | null;
  onDeleteImage: (url: string) => Promise<void>;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-400 leading-relaxed">
        Upload property photos to Firebase Storage. The{' '}
        <span className="text-neon-yellow font-semibold">first image</span> becomes the cover photo
        on the dashboard grid. Drag to reorder in the preview below.
      </p>

      {/* Existing images section (edit mode) */}
      {isEditing && propertyImages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
              {propertyImages.length} existing image{propertyImages.length !== 1 ? 's' : ''}
            </p>
            <p className="text-[11px] text-gray-600 dark:text-zinc-600">Click image to delete</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {propertyImages.map((imageUrl, i) => (
              <div
                key={imageUrl}
                className="relative group aspect-square rounded-xl overflow-hidden bg-gray-300 dark:bg-zinc-800 ring-1 ring-gray-300 dark:ring-zinc-700"
              >
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {i === 0 && (
                  <div className="absolute top-2 left-2 bg-neon-yellow text-black text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow">
                    <Star size={8} fill="currentColor" />
                    COVER
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onDeleteImage(imageUrl)}
                  disabled={isDeleting && deletingImageUrl === imageUrl}
                  className="absolute top-2 right-2 p-1 bg-black/70 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 disabled:opacity-50 disabled:cursor-wait"
                >
                  {isDeleting && deletingImageUrl === imageUrl ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Trash2 size={10} />
                  )}
                </button>
                <div className="absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-black/60 to-transparent" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New files section */}
      <div>
        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none ${
            isDragActive
              ? 'border-neon-yellow bg-neon-yellow/5 scale-[1.01]'
              : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800/30'
          }`}
        >
          <input {...getInputProps()} />
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors ${
            isDragActive ? 'bg-neon-yellow/20' : 'bg-gray-200 dark:bg-zinc-800'
          }`}
        >
          <UploadCloud
            className={isDragActive ? 'text-neon-yellow' : 'text-gray-600 dark:text-zinc-500'}
            size={26}
          />
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {isDragActive ? 'Release to upload' : 'Drag & drop images here'}
        </p>
          <p className="text-xs text-gray-600 dark:text-zinc-500">or click to browse · JPG, PNG, WebP · max 20 MB</p>
        </div>

        {/* Preview grid */}
        {stagedFiles.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
                {stagedFiles.length} image{stagedFiles.length !== 1 ? 's' : ''} staged
              </p>
              <p className="text-[11px] text-gray-600 dark:text-zinc-600">First image = cover</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {stagedFiles.map((sf, i) => (
                <div
                  key={i}
                  className="relative group aspect-square rounded-xl overflow-hidden bg-gray-300 dark:bg-zinc-800 ring-1 ring-gray-300 dark:ring-zinc-700"
                >
                  <img
                    src={sf.preview}
                    alt=""
                    className="w-full h-full object-cover"
                    onLoad={() => URL.revokeObjectURL(sf.preview)}
                  />
                  {i === 0 && (
                    <div className="absolute top-2 left-2 bg-neon-yellow text-black text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow">
                      <Star size={8} fill="currentColor" />
                      COVER
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-2 right-2 p-1 bg-black/70 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <X size={10} />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-1.5 right-2 text-[10px] text-gray-600 dark:text-zinc-400">
                    {Math.round(sf.file.size / 1024)}KB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────────── */

interface AddPropertyPanelProps {
  onClose: () => void;
  onSuccess: () => void;
  property?: Property;
}

export default function AddPropertyPanel({ onClose, onSuccess, property }: AddPropertyPanelProps) {
  const isEditing = Boolean(property);

  const initialForm: FormState = property
    ? {
        title: property.title ?? '',
        description: property.description ?? '',
        marketingType: (property.marketingType as 'Sale' | 'Rent') ?? 'Sale',
        propertyType: property.propertyType ?? 'Apartment',
        status: property.status ?? 'Active',
        street: property.street ?? '',
        houseNumber: property.houseNumber ?? '',
        zip: property.zip ?? '',
        city: property.city ?? '',
        state: property.state ?? '',
        country: property.country ?? 'Germany',
        livingSpace: property.livingSpace != null ? String(property.livingSpace) : '',
        lotSize: property.lotSize != null ? String(property.lotSize) : '',
        rooms: property.rooms != null ? String(property.rooms) : '',
        bathrooms: property.bathrooms != null ? String(property.bathrooms) : '',
        yearBuilt: property.yearBuilt != null ? String(property.yearBuilt) : '',
        price: property.price != null ? String(property.price) : '',
        additionalCosts: property.additionalCosts != null ? String(property.additionalCosts) : '',
        commission: property.commission != null ? String(property.commission) : '',
        energyCertificate: property.energyCertificate != null ? String(property.energyCertificate) : '',
        heatingType: property.heatingType ?? 'Central Heating',
      }
    : DEFAULTS;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ current: number; total: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null);
  const [propertyImages, setPropertyImages] = useState<string[]>(property?.images ?? []);

  // Generic field setter
  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  /* Dropzone */
  const onDrop = useCallback((accepted: File[]) => {
    const staged: StagedFile[] = accepted.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setStagedFiles((prev) => [...prev, ...staged]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 20 * 1024 * 1024,
  });

  const removeFile = (idx: number) => {
    setStagedFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!property) return;
    setIsDeleting(true);
    setDeletingImageUrl(imageUrl);
    setError(null);

    try {
      console.log('Starting image deletion for:', imageUrl);
      await deletePropertyImage(property.id, imageUrl);
      setPropertyImages((prev) => prev.filter((img) => img !== imageUrl));
      console.log('Image deleted successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('Delete image error:', errorMsg);
      setError(`Failed to delete image: ${errorMsg}`);
    } finally {
      setIsDeleting(false);
      setDeletingImageUrl(null);
    }
  };

  /* Step validation */
  const canAdvance = () => {
    if (step === 0) return form.title.trim().length > 0;
    if (step === 2) return form.price.trim().length > 0;
    return true;
  };

  /* Submit */
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setUploadStatus(null);

    try {
      console.log('=== handleSubmit started ===');
      console.log('Mode:', isEditing ? 'EDIT' : 'CREATE');
      console.log('Form data:', {
        title: form.title,
        price: form.price,
        street: form.street,
        city: form.city,
        country: form.country,
        userUid: auth.currentUser?.uid,
      });
      
      const addressParts = [
        [form.street, form.houseNumber].filter(Boolean).join(' '),
        [form.zip, form.city].filter(Boolean).join(' '),
        form.country,
      ].filter(Boolean);
      const address = addressParts.join(', ');
      console.log('Constructed address:', address);

      const legacyTypeMap: Record<string, Property['type']> = {
        Apartment: 'Residential',
        House: 'Residential',
        Villa: 'Residential',
        Penthouse: 'Residential',
        Office: 'Commercial',
        Commercial: 'Commercial',
        Land: 'Land',
        Garage: 'Commercial',
      };

      const livingSpaceNum = parseFloat(form.livingSpace) || 0;
      const roomsNum = parseFloat(form.rooms) || 0;

      const propertyData: Omit<Property, 'id' | 'createdAt'> = {
        title: form.title.trim(),
        description: form.description.trim(),
        address,
        street: form.street || '',
        houseNumber: form.houseNumber || '',
        zip: form.zip || '',
        city: form.city || '',
        state: form.state || '',
        country: form.country || '',
        marketingType: form.marketingType as MarketingType,
        propertyType: form.propertyType,
        status: form.status,
        type: legacyTypeMap[form.propertyType] ?? 'Residential',
        price: parseFloat(form.price) || 0,
        additionalCosts: parseFloat(form.additionalCosts) || 0,
        commission: parseFloat(form.commission) || 0,
        livingSpace: livingSpaceNum || 0,
        lotSize: parseFloat(form.lotSize) || 0,
        rooms: roomsNum || 0,
        bedrooms: roomsNum || 0,
        bathrooms: parseFloat(form.bathrooms) || 0,
        sqft: Math.round(livingSpaceNum * 10.764),
        yearBuilt: parseInt(form.yearBuilt) || 0,
        energyCertificate: parseFloat(form.energyCertificate) || 0,
        heatingType: form.heatingType ? (form.heatingType as HeatingType) : 'Gas',
        mainImage: isEditing ? (property?.mainImage ?? '') : '',
        images: isEditing ? (property?.images ?? []) : [],
        features: [],
        agentId: auth.currentUser?.uid ?? 'unknown',
      };

      console.log('=== propertyData constructed ===');
      console.log('Data being sent to service:', propertyData);
      console.log('Field types check:', {
        title: typeof propertyData.title,
        price: typeof propertyData.price,
        address: typeof propertyData.address,
        agentId: typeof propertyData.agentId,
      });
      console.log('Validation:', {
        titleLength: propertyData.title.length,
        priceValue: propertyData.price,
        addressLength: propertyData.address.length,
      });

      if (isEditing && property) {
        // When editing, preserve existing images unless new ones are uploaded
        await updateProperty(property.id, propertyData);
        if (stagedFiles.length > 0) {
          const existingImages = propertyImages; // Use current state, reflecting any deletions
          const urls: string[] = [];
          for (let i = 0; i < stagedFiles.length; i++) {
            setUploadStatus({ current: i + 1, total: stagedFiles.length });
            const url = await uploadPropertyImage(stagedFiles[i].file, property.id, () => {});
            urls.push(url);
          }
          const allImages = [...existingImages, ...urls];
          await updatePropertyImages(property.id, allImages);
        }
      } else {
        // When creating, upload to new property
        console.log('=== CREATE MODE ===');
        console.log('Calling createProperty() with propertyData');
        const propertyId = await createProperty(propertyData);
        console.log('=== createProperty returned ===');
        console.log('Property created:', propertyId);
        console.log('Type of propertyId:', typeof propertyId);
        console.log('propertyId length:', propertyId?.length ?? 'null/undefined');
        
        if (!propertyId) {
          console.error('ERROR: propertyId is null or undefined!');
          throw new Error('Failed to create property: no ID returned');
        }
        
        if (stagedFiles.length > 0) {
          console.log(`Uploading ${stagedFiles.length} image(s) to property ${propertyId}...`);
          const urls: string[] = [];
          for (let i = 0; i < stagedFiles.length; i++) {
            setUploadStatus({ current: i + 1, total: stagedFiles.length });
            const url = await uploadPropertyImage(stagedFiles[i].file, propertyId, () => {});
            console.log(`Image ${i + 1} uploaded:`, url);
            urls.push(url);
          }
          console.log('All images uploaded, updating Firestore with URLs:', urls);
          console.log('Calling updatePropertyImages() with propertyId:', propertyId, 'urls:', urls);
          await updatePropertyImages(propertyId, urls);
          console.log('updatePropertyImages() completed successfully');
        } else {
          console.log('No images to upload for this property');
        }
      }

      console.log('Calling onSuccess()');
      onSuccess();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('=== HANDLE SUBMIT ERROR ===');
      console.error('Error message:', errorMsg);
      console.error('Full error:', err);
      console.error('Error stack:', err instanceof Error ? err.stack : 'no stack');
      setError(`Error: ${errorMsg}`);
    } finally {
      setSubmitting(false);
      setUploadStatus(null);
      // Clear staged files after successful upload
      setStagedFiles([]);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 h-full w-full sm:w-135 bg-white dark:bg-zinc-950 border-l border-gray-300 dark:border-zinc-800 z-50 flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.8)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-300 dark:border-zinc-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{isEditing ? 'Edit Property' : 'Add Property'}</h2>
            <p className="text-[11px] text-gray-600 dark:text-zinc-500 mt-0.5 font-mono uppercase tracking-wider">
              Step {step + 1} / {STEPS.length} — {STEPS[step]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-300 dark:border-zinc-800/60 shrink-0">
          <div className="flex items-center">
            {STEPS.map((label, i) => (
              <React.Fragment key={i}>
                <button
                  type="button"
                  onClick={() => i <= step && setStep(i)}
                  disabled={i > step}
                  className={`flex items-center gap-2 transition-all ${
                    i > step ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                      i < step
                        ? 'bg-neon-yellow text-black'
                        : i === step
                        ? 'bg-neon-yellow text-black ring-[3px] ring-neon-yellow/25'
                        : 'bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-zinc-500 border border-gray-300 dark:border-zinc-700'
                    }`}
                  >
                    {i < step ? <Check size={12} strokeWidth={3} /> : i + 1}
                  </div>
                  <span
                    className={`text-xs font-semibold hidden sm:block whitespace-nowrap ${
                      i === step ? 'text-gray-900 dark:text-white' : i < step ? 'text-neon-yellow' : 'text-gray-600 dark:text-zinc-600'
                    }`}
                  >
                    {label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-3 transition-colors ${
                      i < step ? 'bg-neon-yellow/60' : 'bg-gray-300 dark:bg-zinc-800'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Scrollable form content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {step === 0 && <Step1 form={form} set={set} setForm={setForm} />}
              {step === 1 && <Step2 form={form} set={set} />}
              {step === 2 && <Step3 form={form} set={set} />}
              {step === 3 && (
                <Step4
                  stagedFiles={stagedFiles}
                  getRootProps={getRootProps}
                  getInputProps={getInputProps}
                  isDragActive={isDragActive}
                  removeFile={removeFile}
                  isEditing={isEditing}
                  propertyImages={propertyImages}
                  isDeleting={isDeleting}
                  deletingImageUrl={deletingImageUrl}
                  onDeleteImage={handleDeleteImage}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 shrink-0">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-xs mb-3 flex items-center gap-2"
            >
              <AlertCircle size={12} />
              {error}
            </motion.p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => (step > 0 ? setStep((s) => s - 1) : onClose())}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
              <ChevronLeft size={16} />
              {step === 0 ? 'Cancel' : 'Back'}
            </button>

            <div className="flex-1" />

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance()}
                className="flex items-center gap-2 px-5 py-2.5 bg-neon-yellow text-black text-sm font-bold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-neon-yellow text-black text-sm font-bold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 min-w-40 justify-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={15} />
                    {uploadStatus
                      ? `Uploading ${uploadStatus.current}/${uploadStatus.total}`
                      : isEditing ? 'Saving…' : 'Creating…'}
                  </>
                ) : (
                  <>
                    <Zap size={15} />
                    Save Property
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
