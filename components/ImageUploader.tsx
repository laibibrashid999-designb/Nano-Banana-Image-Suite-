import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { UploadedImage } from '../types';
import { UploadCloudIcon, XIcon } from './Icons';

interface ImageUploaderProps {
  onImageUpload: (image: UploadedImage | null) => void;
  image?: UploadedImage | null;
  isLoading?: boolean;
  loadingMessage?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, image = null, isLoading = false, loadingMessage = "Loading..." }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (image) {
      const dataUrl = `data:${image.type};base64,${image.base64}`;
      if (preview !== dataUrl) {
        setPreview(dataUrl);
        setFileName('prepared_model.png'); // Give a generic name for prepared images
      }
    } else {
      // This handles clearing the image from the parent
      if (preview !== null) {
        setPreview(null);
        setFileName(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    }
  }, [image, preview]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setPreview(reader.result as string);
        onImageUpload({
          base64: base64String,
          type: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
       setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setPreview(reader.result as string);
        onImageUpload({
          base64: base64String,
          type: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);
  
  const handleRemoveImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPreview(null);
    setFileName(null);
    onImageUpload(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }, [onImageUpload]);

  return (
    <div className="w-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-[var(--nb-surface)] opacity-80 backdrop-blur-sm flex flex-col justify-center items-center z-10 rounded-lg">
            <svg className="animate-spin h-8 w-8 text-[var(--nb-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-3 font-semibold">{loadingMessage}</p>
        </div>
      )}
      {preview ? (
        <div className="relative w-full h-48 rounded-lg overflow-hidden neo-card !shadow-none !p-1">
          <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-md" />
           <button
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 neo-button neo-icon-button neo-button-danger !p-1.5"
            aria-label="Remove image"
          >
            <XIcon />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-[var(--nb-border)] text-[var(--nb-bg)] text-xs text-center p-1 truncate">
            {fileName}
          </div>
        </div>
      ) : (
        <label
          className="flex flex-col items-center justify-center w-full h-48 border-3 border-[var(--nb-border)] border-dashed rounded-xl cursor-pointer bg-[var(--nb-surface-alt)] hover:bg-[var(--nb-accent)] transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadCloudIcon />
            <p className="mb-2 text-sm opacity-80">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs opacity-70">PNG, JPG, GIF up to 10MB</p>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
      )}
    </div>
  );
};
