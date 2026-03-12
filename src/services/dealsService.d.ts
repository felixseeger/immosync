import type { Deal, DealActivity, DealDocument, DealStageId, DealDocumentCategory } from '../types';
export declare const DEAL_STAGES: {
    id: DealStageId;
    label: string;
}[];
export type DealCreateInput = Omit<Deal, 'id' | 'createdAt' | 'updatedAt'> & {
    createdAt?: never;
    updatedAt?: never;
};
export declare function createDeal(data: DealCreateInput): Promise<string>;
export declare function updateDeal(dealId: string, data: Partial<Omit<Deal, 'id' | 'createdAt'>> & {
    updatedAt?: any;
}): Promise<void>;
export declare function updateDealStage(dealId: string, stageId: DealStageId, order: number): Promise<void>;
/** Optional context to show which deal was moved in Recent Activity */
export interface DealActivityContext {
    contactName?: string;
    propertyTitle?: string;
}
export declare function updateDealStageAndLog(dealId: string, stageId: DealStageId, order: number, previousStageId?: DealStageId, dealContext?: DealActivityContext): Promise<void>;
export declare function subscribeToDeals(callback: (deals: Deal[]) => void): () => void;
/** Single query by stageId then client-side sort by order/updatedAt for flexibility */
export declare function subscribeToDealsSimple(callback: (deals: Deal[]) => void): () => void;
export declare function getDeals(): Promise<Deal[]>;
export declare function getDealById(dealId: string): Promise<Deal | null>;
export declare function subscribeToDealActivity(dealId: string, callback: (activities: DealActivity[]) => void): () => void;
export declare function addDealActivity(dealId: string, type: DealActivity['type'], message: string, metadata?: Record<string, unknown>): Promise<string>;
export declare function subscribeToDealDocuments(dealId: string, callback: (documents: DealDocument[]) => void): () => void;
export declare function addDealDocumentRecord(dealId: string, data: {
    name: string;
    storagePath: string;
    downloadUrl: string;
    category: DealDocumentCategory;
}): Promise<string>;
export declare function deleteDealDocumentRecord(documentId: string): Promise<void>;
export declare function getDealDocumentById(documentId: string): Promise<DealDocument | null>;
/** Upload file to Storage and create Firestore document record; log activity. */
export declare function uploadDealDocument(dealId: string, file: File, category: DealDocumentCategory, onProgress: (progress: number) => void): Promise<void>;
/** Delete document record and Storage file; log activity. */
export declare function deleteDealDocument(documentId: string): Promise<void>;
