export declare const uploadPropertyImage: (file: File, propertyId: string, onProgress: (progress: number) => void) => Promise<string>;
/** Upload a property video (MP4, WebM, etc.) to Firebase Storage. Same path pattern as images. */
export declare const uploadPropertyVideo: (file: File, propertyId: string, onProgress: (progress: number) => void) => Promise<string>;
/** Upload a document for a deal (lease, credit check, notary, etc.). Returns download URL. */
export declare const uploadDealDocument: (file: File, dealId: string, onProgress: (progress: number) => void) => Promise<{
    storagePath: string;
    downloadUrl: string;
}>;
/** Delete a file from Storage by path (e.g. deal document). */
export declare const deleteStorageFile: (storagePath: string) => Promise<void>;
