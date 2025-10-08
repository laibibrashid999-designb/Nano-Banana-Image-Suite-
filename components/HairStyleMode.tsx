import React from 'react';
import type { UploadedImage } from '../types';
import { ImageUploader } from './ImageUploader';
import { SparklesIcon } from './Icons';
import { GenerationCountSelector } from './GenerationCountSelector';

interface HairStyleModeProps {
    modelImage: UploadedImage | null;
    handleModelImageUpload: (image: UploadedImage | null) => void;
    hairStyleImage: UploadedImage | null;
    setHairStyleImage: (image: UploadedImage | null) => void;
    handleHairStyleGenerate: () => void;
    loadingMessage: string | null;
    numberOfImages: 1 | 2;
    setNumberOfImages: (value: 1 | 2) => void;
}

export const HairStyleMode: React.FC<HairStyleModeProps> = ({
    modelImage,
    handleModelImageUpload,
    hairStyleImage,
    setHairStyleImage,
    handleHairStyleGenerate,
    loadingMessage,
    numberOfImages,
    setNumberOfImages,
}) => {
    const isGenerateDisabled = !!loadingMessage || !modelImage || !hairStyleImage;

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="neo-card p-6 space-y-4">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--nb-primary)] text-[var(--nb-border)] dark:text-[var(--nb-bg)] font-bold text-lg border-2 border-[var(--nb-border)]">1</div>
                    <h2 className="text-2xl font-bold">Your Model</h2>
                </div>
                <p className="text-sm opacity-80 -mt-2">Upload an image of the person whose hair you want to change.</p>
                <ImageUploader image={modelImage} onImageUpload={handleModelImageUpload} />
            </div>

            <div className="neo-card p-6 space-y-4">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--nb-primary)] text-[var(--nb-border)] dark:text-[var(--nb-bg)] font-bold text-lg border-2 border-[var(--nb-border)]">2</div>
                    <h2 className="text-2xl font-bold">Target Hairstyle</h2>
                </div>
                 <p className="text-sm opacity-80 -mt-2">Upload an image of the hairstyle you want to try on.</p>
                <ImageUploader image={hairStyleImage} onImageUpload={setHairStyleImage} />
                 <div className="pt-4 border-t-2 border-dashed border-[var(--nb-border)]">
                    <GenerationCountSelector label="Number of Images" value={numberOfImages} onChange={setNumberOfImages} />
                </div>
            </div>
            <button onClick={handleHairStyleGenerate} disabled={isGenerateDisabled} className="w-full neo-button neo-button-primary text-lg">
                <SparklesIcon />
                {loadingMessage ? 'Styling Hair...' : 'Generate Hairstyle'}
            </button>
        </div>
    );
};
