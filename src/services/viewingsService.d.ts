import type { Viewing } from '../types';
export type ViewingCreateInput = Omit<Viewing, 'id' | 'createdAt' | 'updatedAt'> & {
    createdAt?: never;
    updatedAt?: never;
};
export declare function createViewing(data: ViewingCreateInput, 
/** Optional description for Recent Activity (e.g. "123 Main St with John Doe") */
activityDetail?: string): Promise<string>;
export declare function updateViewing(viewingId: string, data: Partial<Omit<Viewing, 'id' | 'createdAt'>>): Promise<void>;
export declare function deleteViewing(viewingId: string): Promise<void>;
export declare function subscribeToViewingsByProperty(propertyId: string, callback: (viewings: Viewing[]) => void): () => void;
export declare function subscribeToViewings(callback: (viewings: Viewing[]) => void): () => void;
export declare function getViewings(): Promise<Viewing[]>;
