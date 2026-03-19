import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Star,
  AlertCircle,
  Zap,
  UploadCloud,
  Trash2,
  Video,
  Users,
  Link2,
  UserMinus,
} from 'lucide-react';
import { createProperty, updatePropertyImages, updatePropertyVideos, updateProperty, deletePropertyImage, deletePropertyVideo } from '../services/propertyService';
import { getContacts, getContactById, getLinkedContactIdsForProperty, linkContactToProperty, unlinkContactFromProperty } from '../services/contactsService';
import { sfx } from '../utils/sfx';
import { uploadPropertyImage, uploadPropertyVideo } from '../services/storageService';
import { auth } from '../firebase';
import { useLanguage } from '../contexts/LanguageContext';
import type { MarketingType, HeatingType, Property, Contact } from '../types';

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



/* ─── Types ────────────────────────────────────────────────────────────────── */

interface FormState {
  // Step 1
  title: string;
  description: string;
  marketingType: 'Sale' | 'Rent';
  propertyType: string;
  status: 'Active' | 'Pending' | 'Sold' | 'Rented' | 'For Sale' | 'For Rent';
  moveInDate: string;
  moveOutDate: string;
  purchaseDate: string;
  saleDate: string;
  // Step 2
  street: string;
  houseNumber: string;
  zip: string;
  city: string;
  state: string;
  country: string;
  // Step 3
  livingSpace: string;
  rooms: string;
  bathrooms: string;
  balconies: string;
  bathtubs: string;
  kitchens: string;
  garage: string;
  objectDescription: string;
  featuresInput: string;
  locationDescription: string;
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
  moveInDate: '',
  moveOutDate: '',
  purchaseDate: '',
  saleDate: '',
  street: '',
  houseNumber: '',
  zip: '',
  city: '',
  state: '',
  country: 'Germany',
  livingSpace: '',
  rooms: '',
  bathrooms: '',
  balconies: '',
  bathtubs: '',
  kitchens: '',
  garage: '',
  objectDescription: '',
  featuresInput: '',
  locationDescription: '',
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

interface StagedVideoFile {
  file: File;
  preview: string;
}

/* ─── Shared style tokens ───────────────────────────────────────────────────── */

const inputCls =
  'w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors placeholder:text-gray-500 dark:placeholder:text-zinc-600';

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-[11px] font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
    {children}
    {required && <span className="text-accent ml-1">*</span>}
  </label>
);

/* ─── Step 1 — Basics ───────────────────────────────────────────────────────── */

function Step1({
  form,
  set,
  setForm,
  onSelect,
}: {
  form: FormState;
  set: (f: keyof FormState) => (e: React.ChangeEvent<any>) => void;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSelect?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="space-y-5">
      <div>
        <Label required>{t.addProperty.propertyName}</Label>
        <input
          type="text"
          value={form.title}
          onChange={set('title')}
          placeholder={t.addProperty.propertyNamePlaceholder}
          className={inputCls}
          autoFocus
        />
      </div>

      <div>
        <Label>{t.addProperty.marketingType}</Label>
        <div className="flex bg-white dark:bg-zinc-800 rounded-lg p-1 border border-gray-300 dark:border-zinc-700 gap-1">
          {(['Sale', 'Rent'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                onSelect?.();
                setForm((f) => {
                  let newStatus = f.status;
                  if (f.status === 'Active' || f.status === 'For Sale' || f.status === 'For Rent') {
                    newStatus = mode === 'Sale' ? 'For Sale' : 'For Rent';
                  }
                  return { ...f, marketingType: mode, status: newStatus };
                });
              }}
              className={`flex-1 py-2.5 rounded-md text-sm font-bold transition-all border-2 ${
                form.marketingType === mode
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-transparent text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {mode === 'Sale' ? t.addProperty.forSale : t.addProperty.forRent}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>{t.addProperty.propertyType}</Label>
        <div className="grid grid-cols-4 gap-2">
          {PROPERTY_TYPES.map((propType) => (
            <button
              key={propType}
              type="button"
              onClick={() => {
                onSelect?.();
                setForm((f) => ({ ...f, propertyType: propType }));
              }}
              className={`py-2 px-1 rounded-lg text-xs font-medium transition-all border-2 ${
                form.propertyType === propType
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {propType}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>{t.addProperty.statusLabel}</Label>
        <div className="flex flex-wrap bg-white dark:bg-zinc-800 rounded-lg p-1 border border-gray-300 dark:border-zinc-700 gap-1">
          {(['Active', 'For Sale', 'For Rent', 'Pending', 'Sold', 'Rented'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onSelect?.();
                setForm((f) => ({ ...f, status: s }));
              }}
              className={`flex-1 min-w-[80px] py-2 rounded-md text-[10px] font-bold transition-all ring-2 ${
                form.status === s
                  ? (s === 'Active' || s === 'For Sale' || s === 'For Rent')
                    ? 'ring-accent bg-accent/15 text-accent'
                    : s === 'Pending'
                    ? 'ring-accent bg-blue-500/90 text-white'
                    : s === 'Rented'
                    ? 'ring-accent bg-emerald-500/90 text-white dark:bg-emerald-600'
                    : 'ring-accent bg-gray-400 dark:bg-zinc-500 text-white'
                  : 'ring-transparent text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {s === 'Active' 
                ? t.propertyStatus.active 
                : s === 'For Sale' 
                ? t.propertyStatus.forSale 
                : s === 'For Rent' 
                ? t.propertyStatus.forRent 
                : s === 'Pending' 
                ? t.propertyStatus.pending 
                : s === 'Rented' 
                ? t.propertyStatus.rented 
                : t.propertyStatus.sold}
            </button>
          ))}
        </div>
      </div>

      {form.status === 'Rented' && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30">
          <div>
            <Label>{t.propertyRental.moveInDate}</Label>
            <input
              type="date"
              value={form.moveInDate}
              onChange={set('moveInDate')}
              className={inputCls}
            />
          </div>
          <div>
            <Label>{t.propertyRental.moveOutDate}</Label>
            <input
              type="date"
              value={form.moveOutDate}
              onChange={set('moveOutDate')}
              className={inputCls}
            />
          </div>
        </div>
      )}

      {form.status === 'Sold' && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-500/10 dark:bg-zinc-500/15 border border-gray-500/30 dark:border-zinc-500/30">
          <div>
            <Label>{t.propertySale.purchaseDate}</Label>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={set('purchaseDate')}
              className={inputCls}
            />
          </div>
          <div>
            <Label>{t.propertySale.saleDate}</Label>
            <input
              type="date"
              value={form.saleDate}
              onChange={set('saleDate')}
              className={inputCls}
            />
          </div>
        </div>
      )}

      <div>
        <Label>{t.addProperty.shortDescription}</Label>
        <textarea
          value={form.description}
          onChange={set('description')}
          placeholder={t.addProperty.objectDescriptionPlaceholder}
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
  const { t } = useLanguage();
  return ( 
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Label>{t.addProperty.street}</Label>
          <input
            type="text"
            value={form.street}
            onChange={set('street')}
            placeholder={t.addProperty.streetPlaceholder}
            className={inputCls}
          />
        </div>
        <div>
          <Label>{t.addProperty.houseNumber}</Label>
          <input
            type="text"
            value={form.houseNumber}
            onChange={set('houseNumber')}
            placeholder={t.addProperty.houseNumberPlaceholder}
            className={inputCls}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t.addProperty.zip}</Label>
          <input
            type="text"
            value={form.zip}
            onChange={set('zip')}
            placeholder={t.addProperty.zipPlaceholder}
            className={inputCls}
          />
        </div>
        <div>
          <Label required>{t.addProperty.city}</Label>
          <input
            type="text"
            value={form.city}
            onChange={set('city')}
            placeholder={t.addProperty.cityPlaceholder}
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <Label>{t.addProperty.state}</Label>
        <input
          type="text"
          value={form.state}
          onChange={set('state')}
          placeholder={t.addProperty.statePlaceholder}
          className={inputCls}
        />
      </div>
      <div>
        <Label>{t.addProperty.country}</Label>
        <input
          type="text"
          value={form.country}
          onChange={set('country')}
          placeholder={t.addProperty.countryPlaceholder}
          className={inputCls}
        />
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
  const { t } = useLanguage();
  return (
    <div className="space-y-7">
      {/* Object Description, Features, Location */}
      <div>
        <p className="text-[11px] font-bold text-gray-600 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2 before:flex-1 before:h-px before:bg-gray-300 dark:before:bg-zinc-800 after:flex-1 after:h-px after:bg-gray-300 dark:after:bg-zinc-800">
          <span>{t.addProperty.sectionContent}</span>
        </p>
        <div className="space-y-3">
          <div>
            <Label>{t.addProperty.objectDescription}</Label>
            <textarea
              value={form.objectDescription}
              onChange={set('objectDescription')}
              placeholder={t.addProperty.objectDescriptionPlaceholder}
              className={`${inputCls} resize-none`}
              rows={4}
            />
          </div>
          <div>
            <Label>{t.addProperty.features}</Label>
            <input
              type="text"
              value={form.featuresInput}
              onChange={set('featuresInput')}
              placeholder={t.addProperty.featuresPlaceholder}
              className={inputCls}
            />
          </div>
          <div>
            <Label>{t.addProperty.locationDescription}</Label>
            <textarea
              value={form.locationDescription}
              onChange={set('locationDescription')}
              placeholder={t.addProperty.locationDescriptionPlaceholder}
              className={`${inputCls} resize-none`}
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Physical */}
      <div>
        <p className="text-[11px] font-bold text-gray-600 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2 before:flex-1 before:h-px before:bg-gray-300 dark:before:bg-zinc-800 after:flex-1 after:h-px after:bg-gray-300 dark:after:bg-zinc-800">
          <span>{t.addProperty.sectionRooms}</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t.addProperty.livingSpace}</Label>
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
            <Label>{t.addProperty.rooms}</Label>
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
            <Label>{t.addProperty.bathrooms}</Label>
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
          <div>
            <Label>{t.addProperty.balconies}</Label>
            <input
              type="number"
              value={form.balconies}
              onChange={set('balconies')}
              placeholder="0"
              className={inputCls}
              min={0}
            />
          </div>
          <div>
            <Label>{t.addProperty.bathtubs}</Label>
            <input
              type="number"
              value={form.bathtubs}
              onChange={set('bathtubs')}
              placeholder="0"
              className={inputCls}
              min={0}
            />
          </div>
          <div>
            <Label>{t.addProperty.kitchens}</Label>
            <input
              type="number"
              value={form.kitchens}
              onChange={set('kitchens')}
              placeholder="1"
              className={inputCls}
              min={0}
            />
          </div>
          <div>
            <Label>{t.addProperty.garage}</Label>
            <input
              type="number"
              value={form.garage}
              onChange={set('garage')}
              placeholder="0"
              className={inputCls}
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div>
        <p className="text-[11px] font-bold text-gray-600 dark:text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2 before:flex-1 before:h-px before:bg-gray-300 dark:before:bg-zinc-800 after:flex-1 after:h-px after:bg-gray-300 dark:after:bg-zinc-800">
          <span>{t.addProperty.sectionPricing}</span>
        </p>
        <div className="space-y-3">
          <div>
            <Label required>
              {form.marketingType === 'Rent' ? t.addProperty.monthlyRent : t.addProperty.purchasePrice}
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
            <Label>{t.addProperty.additionalCosts}</Label>
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
            <Label>{t.addProperty.commission}</Label>
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
          <span>{t.addProperty.sectionEnergy}</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t.addProperty.energyCertificate}</Label>
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
            <Label>{t.addProperty.heatingType}</Label>
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
  propertyVideos,
  stagedVideoFiles,
  getVideoRootProps,
  getVideoInputProps,
  isVideoDragActive,
  removeVideoFile,
  isDeletingVideo,
  deletingVideoUrl,
  onDeleteVideo,
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
  propertyVideos: string[];
  stagedVideoFiles: StagedVideoFile[];
  getVideoRootProps: () => object;
  getVideoInputProps: () => object;
  isVideoDragActive: boolean;
  removeVideoFile: (i: number) => void;
  isDeletingVideo: boolean;
  deletingVideoUrl: string | null;
  onDeleteVideo: (url: string) => Promise<void>;
}) {
  const { t } = useLanguage();
  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-400 leading-relaxed">{t.addProperty.mediaHint}</p>

      {/* Existing images section (edit mode) */}
      {isEditing && propertyImages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
              {propertyImages.length} {propertyImages.length === 1 ? t.addProperty.existingImageSingular : t.addProperty.existingImagePlural}
            </p>
            <p className="text-[11px] text-gray-600 dark:text-zinc-600">{t.addProperty.clickImageToDelete}</p>
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
                  <div className="absolute top-2 left-2 bg-accent text-white dark:text-black text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow">
                    <Star size={8} fill="currentColor" />
                    {t.addProperty.coverLabel}
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
              ? 'border-accent bg-accent/5 scale-[1.01]'
              : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800/30'
          }`}
        >
          <input {...getInputProps()} />
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors ${
            isDragActive ? 'bg-accent/20' : 'bg-gray-200 dark:bg-zinc-800'
          }`}
        >
          <UploadCloud
            className={isDragActive ? 'text-accent' : 'text-gray-600 dark:text-zinc-500'}
            size={26}
          />
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {isDragActive ? t.addProperty.dropToUpload : t.addProperty.dragImagesHere}
        </p>
          <p className="text-xs text-gray-600 dark:text-zinc-500">{t.addProperty.clickToSelectHint}</p>
        </div>

        {/* Preview grid */}
        {stagedFiles.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider">
                {stagedFiles.length} {stagedFiles.length === 1 ? t.addProperty.preparedImageSingular : t.addProperty.preparedImagePlural}
              </p>
              <p className="text-[11px] text-gray-600 dark:text-zinc-600">{t.addProperty.firstImageIsCover}</p>
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
                    <div className="absolute top-2 left-2 bg-accent text-white dark:text-black text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow">
                      <Star size={8} fill="currentColor" />
                      {t.addProperty.coverLabel}
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

      {/* Videos section */}
      <div className="pt-6 border-t border-gray-300 dark:border-zinc-800">
            <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 uppercase tracking-wider mb-3">{t.addProperty.videosOptional}</p>
        {isEditing && propertyVideos.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] text-gray-600 dark:text-zinc-600 mb-2">{t.addProperty.existingVideosHint}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {propertyVideos.map((videoUrl) => (
                <div key={videoUrl} className="relative group aspect-video rounded-xl overflow-hidden bg-gray-300 dark:bg-zinc-800 ring-1 ring-gray-300 dark:ring-zinc-700">
                  <video src={videoUrl} className="w-full h-full object-cover" muted playsInline />
                  <button
                    type="button"
                    onClick={() => onDeleteVideo(videoUrl)}
                    disabled={isDeletingVideo && deletingVideoUrl === videoUrl}
                    className="absolute top-2 right-2 p-1 bg-black/70 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 disabled:opacity-50"
                  >
                    {isDeletingVideo && deletingVideoUrl === videoUrl ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div
          {...getVideoRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all ${
            isVideoDragActive ? 'border-accent bg-accent/5' : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-500'
          }`}
        >
          <input {...getVideoInputProps()} />
          <Video className="text-gray-500 dark:text-zinc-500 mb-2" size={22} />
          <p className="text-xs text-gray-600 dark:text-zinc-500">{t.addProperty.dragVideosHere}</p>
        </div>
        {stagedVideoFiles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {stagedVideoFiles.map((sv, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-200 dark:bg-zinc-800 rounded-lg px-2 py-1.5 text-xs">
                <Video size={12} />
                <span className="truncate max-w-[120px]">{sv.file.name}</span>
                <button type="button" onClick={() => removeVideoFile(i)} className="p-0.5 hover:bg-gray-300 dark:hover:bg-zinc-600 rounded">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Step 5 — Contacts ─────────────────────────────────────────────────────── */

function Step5Contacts({
  isEditing,
  propertyId,
  linkedContacts,
  contactsToLink,
  allContacts,
  onLink,
  onUnlink,
  onAddToLink,
  onRemoveFromLink,
  loading,
}: {
  isEditing: boolean;
  propertyId?: string;
  linkedContacts: Contact[];
  contactsToLink: Contact[];
  allContacts: Contact[];
  onLink: (contactId: string) => Promise<void>;
  onUnlink: (contactId: string) => Promise<void>;
  onAddToLink: (contactId: string) => void;
  onRemoveFromLink: (contactId: string) => void;
  loading: boolean;
}) {
  const { t } = useLanguage();
  const [showPicker, setShowPicker] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const displayContacts = isEditing ? linkedContacts : contactsToLink;
  const availableToAdd = allContacts.filter(
    (c) => !displayContacts.some((d) => d.id === c.id)
  );

  const handleLink = async (contactId: string) => {
    setLinkingId(contactId);
    try {
      await onLink(contactId);
      setShowPicker(false);
    } finally {
      setLinkingId(null);
    }
  };

  const handleUnlink = async (contactId: string) => {
    setLinkingId(contactId);
    try {
      await onUnlink(contactId);
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600 dark:text-zinc-400">{t.addProperty.contactsHint}</p>
      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 dark:text-zinc-500 py-8">
          <Loader2 size={18} className="animate-spin" />
          <span>{t.common.loading}</span>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {displayContacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-zinc-800 rounded-lg border border-gray-300 dark:border-zinc-700"
              >
                <Users size={14} className="text-gray-600 dark:text-zinc-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</span>
                {c.company && (
                  <span className="text-xs text-gray-500 dark:text-zinc-500">— {c.company}</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (isEditing && propertyId) {
                      handleUnlink(c.id);
                    } else {
                      onRemoveFromLink(c.id);
                    }
                  }}
                  disabled={isEditing && linkingId === c.id}
                  className="p-1 hover:bg-gray-300 dark:hover:bg-zinc-600 rounded transition-colors text-gray-600 dark:text-zinc-400 hover:text-red-600 disabled:opacity-50"
                  aria-label="Remove"
                >
                  {isEditing && linkingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />}
                </button>
              </div>
            ))}
          </div>
          {displayContacts.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-zinc-500 py-4">{t.addProperty.noContactsLinked}</p>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-accent text-gray-600 dark:text-zinc-400 hover:text-accent transition-colors text-sm font-medium"
            >
              <Link2 size={16} />
              {t.addProperty.linkContact}
            </button>
            {showPicker && availableToAdd.length > 0 && (
              <div className="absolute left-0 top-full mt-2 w-full max-h-48 overflow-y-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 py-2">
                {availableToAdd.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (isEditing && propertyId) {
                        handleLink(c.id);
                      } else {
                        onAddToLink(c.id);
                        setShowPicker(false);
                      }
                    }}
                    disabled={linkingId === c.id}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-zinc-800 text-sm text-gray-900 dark:text-white flex items-center justify-between disabled:opacity-50"
                  >
                    <span>{c.name}</span>
                    {c.company && <span className="text-xs text-gray-500">{c.company}</span>}
                    {linkingId === c.id && <Loader2 size={14} className="animate-spin" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────── */

interface AddPropertyPanelProps {
  onClose: () => void;
  onSuccess: () => void;
  property?: Property;
  /** When editing, open directly at this step (0=Basics, 1=Address, 2=Details, 3=Media). */
  initialStep?: number;
}

export default function AddPropertyPanel({ onClose, onSuccess, property, initialStep = 0 }: AddPropertyPanelProps) {
  const { t } = useLanguage();
  const STEPS = [t.addProperty.basics, t.addProperty.address, t.addProperty.details, t.addProperty.media, t.addProperty.contacts];
  const isEditing = Boolean(property);
  const stepIndex = Math.min(STEPS.length - 1, Math.max(0, initialStep));

  const initialForm: FormState = property
    ? {
        title: property.title ?? '',
        description: property.description ?? '',
        objectDescription: property.objectDescription ?? '',
        marketingType: (property.marketingType as 'Sale' | 'Rent') ?? 'Sale',
        propertyType: property.propertyType ?? 'Apartment',
        status: (property.status ?? 'Active') as FormState['status'],
        moveInDate: property.moveInDate ?? '',
        moveOutDate: property.moveOutDate ?? '',
        purchaseDate: property.purchaseDate ?? '',
        saleDate: property.saleDate ?? '',
        street: property.street ?? '',
        houseNumber: property.houseNumber ?? '',
        zip: property.zip ?? '',
        city: property.city ?? '',
        state: property.state ?? '',
        country: property.country ?? 'Germany',
        livingSpace: property.livingSpace != null ? String(property.livingSpace) : '',
        rooms: property.rooms != null ? String(property.rooms) : '',
        bathrooms: property.bathrooms != null ? String(property.bathrooms) : '',
        balconies: property.balconies != null ? String(property.balconies) : '',
        bathtubs: property.bathtubs != null ? String(property.bathtubs) : '',
        kitchens: property.kitchens != null ? String(property.kitchens) : '',
        garage: property.garage != null ? String(property.garage) : '',
        featuresInput: property.features?.length ? property.features.join(', ') : '',
        locationDescription: property.locationDescription ?? '',
        price: property.price != null ? String(property.price) : '',
        additionalCosts: property.additionalCosts != null ? String(property.additionalCosts) : '',
        commission: property.commission != null ? String(property.commission) : '',
        energyCertificate: property.energyCertificate != null ? String(property.energyCertificate) : '',
        heatingType: property.heatingType ?? 'Central Heating',
      }
    : DEFAULTS;

  const [step, setStep] = useState(stepIndex);
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
  const [propertyVideos, setPropertyVideos] = useState<string[]>(property?.videos ?? []);
  const [stagedVideoFiles, setStagedVideoFiles] = useState<StagedVideoFile[]>([]);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
  const [deletingVideoUrl, setDeletingVideoUrl] = useState<string | null>(null);
  const [linkedContacts, setLinkedContacts] = useState<Contact[]>([]);
  const [contactsToLink, setContactsToLink] = useState<Contact[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

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

  const onVideoDrop = useCallback((accepted: File[]) => {
    const staged: StagedVideoFile[] = accepted.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setStagedVideoFiles((prev) => [...prev, ...staged]);
  }, []);

  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps, isDragActive: isVideoDragActive } = useDropzone({
    onDrop: onVideoDrop,
    accept: { 'video/*': ['.mp4', '.webm', '.mov'] },
    maxSize: 5 * 1024 * 1024,
  });

  const removeFile = (idx: number) => {
    setStagedFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const removeVideoFile = (idx: number) => {
    setStagedVideoFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleClose = useCallback(() => {
    sfx.menuClose();
    onClose();
  }, [onClose]);

  useEffect(() => {
    sfx.menuOpen();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setContactsLoading(true);
    (async () => {
      try {
        const contacts = await getContacts();
        if (cancelled) return;
        setAllContacts(contacts);
        if (property?.id) {
          const ids = await getLinkedContactIdsForProperty(property.id);
          if (cancelled) return;
          const linked = (await Promise.all(ids.map((id) => getContactById(id)))).filter(Boolean) as Contact[];
          setLinkedContacts(linked);
        }
      } finally {
        if (!cancelled) setContactsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [property?.id]);

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

  const handleDeleteVideo = async (videoUrl: string) => {
    if (!property) return;
    setIsDeletingVideo(true);
    setDeletingVideoUrl(videoUrl);
    setError(null);
    try {
      await deletePropertyVideo(property.id, videoUrl);
      setPropertyVideos((prev) => prev.filter((v) => v !== videoUrl));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete video');
    } finally {
      setIsDeletingVideo(false);
      setDeletingVideoUrl(null);
    }
  };

  /* Step validation */
  const canAdvance = () => {
    if (step === 0) return form.title.trim().length > 0;
    if (step === 2) return form.price.trim().length > 0;
    if (step === 4) return true;
    return true;
  };

  /* Submit */
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setUploadStatus(null);

    try {
      const addressParts = [
        [form.street, form.houseNumber].filter(Boolean).join(' '),
        [form.zip, form.city].filter(Boolean).join(' '),
        form.country,
      ].filter(Boolean);
      const address = addressParts.join(', ');

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

      const descriptionTrim = form.description.trim();
      const objectDescriptionTrim = form.objectDescription.trim();
      const featuresList = (form.featuresInput ?? '')
        .split(/[,;\n]/)
        .map((x) => x.trim())
        .filter(Boolean);

      const propertyData: Omit<Property, 'id' | 'createdAt'> = {
        title: form.title.trim(),
        description: descriptionTrim,
        objectDescription: objectDescriptionTrim,
        locationDescription: form.locationDescription.trim() || undefined,
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
        moveInDate: form.status === 'Rented' && form.moveInDate ? form.moveInDate : undefined,
        moveOutDate: form.status === 'Rented' && form.moveOutDate ? form.moveOutDate : undefined,
        purchaseDate: form.status === 'Sold' && form.purchaseDate ? form.purchaseDate : undefined,
        saleDate: form.status === 'Sold' && form.saleDate ? form.saleDate : undefined,
        type: legacyTypeMap[form.propertyType] ?? 'Residential',
        price: parseFloat(form.price) || 0,
        additionalCosts: parseFloat(form.additionalCosts) || 0,
        commission: parseFloat(form.commission) || 0,
        livingSpace: livingSpaceNum || 0,
        rooms: roomsNum || 0,
        bedrooms: roomsNum || 0,
        bathrooms: parseFloat(form.bathrooms) || 0,
        balconies: parseFloat(form.balconies) || 0,
        bathtubs: parseFloat(form.bathtubs) || 0,
        kitchens: parseFloat(form.kitchens) || 0,
        garage: parseFloat(form.garage) || 0,
        sqft: Math.round(livingSpaceNum * 10.764),
        energyCertificate: parseFloat(form.energyCertificate) || 0,
        heatingType: form.heatingType ? (form.heatingType as HeatingType) : 'Gas',
        mainImage: isEditing ? (propertyImages[0] ?? property?.mainImage ?? '') : '',
        images: isEditing ? propertyImages : [],
        videos: isEditing ? propertyVideos : [],
        features: featuresList,
        agentId: auth.currentUser?.uid ?? 'unknown',
      };

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
        if (stagedVideoFiles.length > 0) {
          const videoUrls: string[] = [];
          for (let i = 0; i < stagedVideoFiles.length; i++) {
            setUploadStatus({ current: i + 1, total: stagedVideoFiles.length });
            const url = await uploadPropertyVideo(stagedVideoFiles[i].file, property.id, () => {});
            videoUrls.push(url);
          }
          await updatePropertyVideos(property.id, [...propertyVideos, ...videoUrls]);
        }
      } else {
        const propertyId = await createProperty(propertyData);
        if (!propertyId) {
          throw new Error('Failed to create property: no ID returned');
        }
        if (stagedFiles.length > 0) {
          const urls: string[] = [];
          for (let i = 0; i < stagedFiles.length; i++) {
            setUploadStatus({ current: i + 1, total: stagedFiles.length });
            const url = await uploadPropertyImage(stagedFiles[i].file, propertyId, () => {});
            urls.push(url);
          }
          await updatePropertyImages(propertyId, urls);
        }
        if (stagedVideoFiles.length > 0) {
          const videoUrls: string[] = [];
          for (let i = 0; i < stagedVideoFiles.length; i++) {
            setUploadStatus({ current: i + 1, total: stagedVideoFiles.length });
            const url = await uploadPropertyVideo(stagedVideoFiles[i].file, propertyId, () => {});
            videoUrls.push(url);
          }
          await updatePropertyVideos(propertyId, videoUrls);
        }
        for (const c of contactsToLink) {
          await linkContactToProperty(propertyId, c.id);
        }
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
      setUploadStatus(null);
      setStagedFiles([]);
      setStagedVideoFiles([]);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50"
        onClick={handleClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed right-0 top-0 h-full w-full sm:w-135 bg-app-light dark:bg-app-dark border-l border-gray-300 dark:border-zinc-800 z-60 flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.8)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-300 dark:border-zinc-800 shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{isEditing ? t.addProperty.editProperty : t.addProperty.addProperty}</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-300 dark:border-zinc-800/60 shrink-0">
          <div className="flex items-center gap-6">
            {STEPS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  sfx.menuSelect();
                  setStep(i);
                }}
                className={`text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  i === step ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-300'
                }`}
              >
                {label}
              </button>
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
              {step === 0 && <Step1 form={form} set={set} setForm={setForm} onSelect={() => sfx.menuSelect()} />}
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
                  propertyVideos={propertyVideos}
                  stagedVideoFiles={stagedVideoFiles}
                  getVideoRootProps={getVideoRootProps}
                  getVideoInputProps={getVideoInputProps}
                  isVideoDragActive={isVideoDragActive}
                  removeVideoFile={removeVideoFile}
                  isDeletingVideo={isDeletingVideo}
                  deletingVideoUrl={deletingVideoUrl}
                  onDeleteVideo={handleDeleteVideo}
                />
              )}
              {step === 4 && (
                <Step5Contacts
                  isEditing={isEditing}
                  propertyId={property?.id}
                  linkedContacts={linkedContacts}
                  contactsToLink={contactsToLink}
                  allContacts={allContacts}
                  onLink={async (contactId) => {
                    if (!property?.id) return;
                    await linkContactToProperty(property.id, contactId);
                    const c = allContacts.find((x) => x.id === contactId);
                    if (c) setLinkedContacts((prev) => [...prev, c]);
                  }}
                  onUnlink={async (contactId) => {
                    if (!property?.id) return;
                    await unlinkContactFromProperty(property.id, contactId);
                    setLinkedContacts((prev) => prev.filter((c) => c.id !== contactId));
                  }}
                  onAddToLink={(contactId) => {
                    const c = allContacts.find((x) => x.id === contactId);
                    if (c) setContactsToLink((prev) => [...prev, c]);
                  }}
                  onRemoveFromLink={(contactId) =>
                    setContactsToLink((prev) => prev.filter((c) => c.id !== contactId))
                  }
                  loading={contactsLoading}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-300 dark:border-zinc-800 bg-app-light/80 dark:bg-app-dark shrink-0">
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
              onClick={() => {
                if (step > 0) {
                  sfx.menuSelect();
                  setStep((s) => s - 1);
                } else {
                  handleClose();
                }
              }}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
              <ChevronLeft size={16} />
              {step === 0 ? t.addProperty.cancel : t.addProperty.back}
            </button>

            <div className="flex-1" />

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  sfx.menuSelect();
                  setStep((s) => s + 1);
                }}
                disabled={!canAdvance()}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white dark:text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t.addProperty.continue}
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white dark:text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 min-w-40 justify-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={15} />
                    {uploadStatus
                      ? t.addProperty.uploadingCount.replace('{current}', String(uploadStatus.current)).replace('{total}', String(uploadStatus.total))
                      : isEditing ? t.addProperty.saving : t.addProperty.creating}
                  </>
                ) : (
                  <>
                    <Zap size={15} />
                    {t.addProperty.saveProperty}
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
