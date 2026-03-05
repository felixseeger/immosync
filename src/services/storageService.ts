import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

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
