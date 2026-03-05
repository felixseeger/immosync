import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadPropertyImage } from '../services/storageService';
import { addPropertyImage } from '../services/propertyService';

interface ImageUploadProps {
  propertyId: string;
  onUploadComplete: (url: string) => void;
}

export default function ImageUpload({ propertyId, onUploadComplete }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    const file = acceptedFiles[0]; // Handle one file at a time for simplicity

    try {
      const downloadURL = await uploadPropertyImage(file, propertyId, (progress) => {
        setProgress(progress);
      });

      await addPropertyImage(propertyId, downloadURL);
      onUploadComplete(downloadURL);
      setUploading(false);
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Failed to upload image. Please try again.");
      setUploading(false);
    }
  }, [propertyId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg', '.webp']
    },
    maxFiles: 1
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
          ${isDragActive ? 'border-neon-yellow bg-neon-yellow/10' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <UploadCloud className={`text-zinc-400 ${isDragActive ? 'text-neon-yellow' : ''}`} size={24} />
        </div>
        
        <h3 className="text-lg font-medium text-white mb-1">
          {isDragActive ? "Drop the image here" : "Upload Property Image"}
        </h3>
        <p className="text-sm text-zinc-500 max-w-xs mx-auto">
          Drag & drop a high-res image here, or click to select files.
        </p>
        
        {uploading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-neon-yellow mb-2" size={32} />
            <span className="text-white font-medium">{Math.round(progress)}% Uploading...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <X size={16} />
          {error}
        </div>
      )}
    </div>
  );
}
