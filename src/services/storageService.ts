import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

export const uploadPropertyImage = async (
  file: File,
  propertyId: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  try {
    console.log(`uploadPropertyImage starting for file: ${file.name}, propertyId: ${propertyId}`);
    const storageRef = ref(storage, `properties/${propertyId}/${file.name}-${Date.now()}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log(`uploadPropertyImage completed successfully: ${downloadURL}`);
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error("Error initiating upload:", error);
    throw error;
  }
};

/** Upload a property video (MP4, WebM, etc.) to Firebase Storage. Same path pattern as images. */
export const uploadPropertyVideo = async (
  file: File,
  propertyId: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  const storageRef = ref(storage, `properties/${propertyId}/${file.name}-${Date.now()}`);
  const uploadTask = uploadBytesResumable(storageRef, file);
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};

/** Upload a document for a deal (lease, credit check, notary, etc.). Returns download URL. */
export const uploadDealDocument = async (
  file: File,
  dealId: string,
  onProgress: (progress: number) => void
): Promise<{ storagePath: string; downloadUrl: string }> => {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `deals/${dealId}/${Date.now()}-${safeName}`;
  const storageRef = ref(storage, storagePath);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => reject(error),
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ storagePath, downloadUrl });
      }
    );
  });
};

/** Delete a file from Storage by path (e.g. deal document). */
export const deleteStorageFile = async (storagePath: string): Promise<void> => {
  const fileRef = ref(storage, storagePath);
  await deleteObject(fileRef);
};
