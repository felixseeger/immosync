import type { Property } from '../types';
export interface ImageArtifactReport {
    url: string;
    role: 'mainImage' | 'image';
    index?: number;
    isLikelyThumbOrCache: boolean;
    matchedPath: string[];
    matchedParams: string[];
}
export interface PropertyImageArtifactReport {
    propertyId: string;
    title: string;
    address: string;
    mainImage: string | undefined;
    images: string[];
    reports: ImageArtifactReport[];
    summary: {
        totalUrls: number;
        likelyArtifacts: number;
        urlsWithoutArtifacts: number;
    };
}
/**
 * Analyzes a property's mainImage and images[] for thumbnail/cache-style URLs.
 * Returns a report listing each URL and whether it looks like an artifact.
 */
export declare function getPropertyImageArtifactReport(property: Property): PropertyImageArtifactReport;
/**
 * Finds a property by title or address containing the given search string (case-insensitive)
 * and returns its image artifact report.
 */
export declare function findPropertyAndReport(properties: Property[], searchTitleOrAddress: string): PropertyImageArtifactReport | null;
