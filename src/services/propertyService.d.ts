import { Property } from '../types';
import { type PropertyImageArtifactReport } from '../utils/checkPropertyImageArtifacts';
export declare const createProperty: (data: Omit<Property, "id" | "createdAt">) => Promise<string>;
export declare const updatePropertyImages: (propertyId: string, images: string[]) => Promise<void>;
export declare const getProperties: () => Promise<Property[]>;
/** Fetch titles for given property IDs (for display in Contacts table). */
export declare const getPropertyTitles: (propertyIds: string[]) => Promise<Record<string, string>>;
export declare const addPropertyImage: (propertyId: string, imageUrl: string) => Promise<void>;
export declare const deletePropertyImage: (propertyId: string, imageUrl: string) => Promise<void>;
export declare const updatePropertyVideos: (propertyId: string, videos: string[]) => Promise<void>;
/** Delete a video from Storage and remove its URL from the property's videos array. */
export declare const deletePropertyVideo: (propertyId: string, videoUrl: string) => Promise<void>;
export declare const updateProperty: (propertyId: string, data: Partial<Omit<Property, "id" | "createdAt">>) => Promise<void>;
export declare const deleteProperty: (propertyId: string) => Promise<void>;
export declare const seedProperties: () => Promise<void>;
/**
 * Fetches all properties, finds the one matching "Lütticher Strasse" (title or address),
 * and returns a report on thumbnail/cache artifacts in its image URLs.
 * Run from browser console: (await import('./services/propertyService')).checkLutticherPropertyImageArtifacts();
 */
export declare const checkLutticherPropertyImageArtifacts: () => Promise<PropertyImageArtifactReport | null>;
