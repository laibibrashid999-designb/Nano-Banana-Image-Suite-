import React, { useState } from 'react';
import type { UploadedImage } from '../types';
import { ImageUploader } from './ImageUploader';
import { SparklesIcon, MegaphoneIcon } from './Icons';
import { marketingPresets } from '../constants/marketingPresets';
import { GenerationCountSelector } from './GenerationCountSelector';

interface MarketingModeProps {
    marketingPrompt: string;
    setMarketingPrompt: (prompt: string) => void;
    marketingProductImage: UploadedImage | null;
    setMarketingProductImage: (image: UploadedImage | null) => void;
    leaveSpaceForText: boolean;
    setLeaveSpaceForText: (enabled: boolean) => void;
    handleMarketingGenerate: () => void;
    loadingMessage: string | null;
    numberOfImages: 1 | 2;
    setNumberOfImages: (value: 1 | 2) => void;
}

export const MarketingMode: React.FC<MarketingModeProps> = ({
    marketingPrompt,
    setMarketingPrompt,
    marketingProductImage,
    setMarketingProductImage,
    leaveSpaceForText,
    setLeaveSpaceForText,
    handleMarketingGenerate,
    loadingMessage,
    numberOfImages,
    setNumberOfImages
}) => {
    const [showPresets, setShowPresets] = useState(false);
    const showProductUploader = marketingPrompt.includes('@product');
    const isGenerateDisabled = !!loadingMessage || !marketingPrompt || (showProductUploader && !marketingProductImage);

    const handlePresetClick = (prompt: string) => {
        let finalPrompt = prompt;
        finalPrompt = finalPrompt.replace(/\[your food product\]/g, '@product');
        finalPrompt = finalPrompt.replace(/\[your product\]/g, '@product');
        finalPrompt = finalPrompt.replace(/\[your tech product\]/g, '@product');
        setMarketingPrompt(finalPrompt);
    };

    return (
        <div className="space-y-4 animate-fade-in">
             <div className="neo-card p-6 space-y-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--nb-primary)] text-[var(--nb-border)] dark:text-[var(--nb-bg)] font-bold text-lg border-2 border-[var(--nb-border)]">
                        <MegaphoneIcon />
                    </div>
                    <h2 className="text-2xl font-bold">Marketing Image Generator</h2>
                </div>
                <p className="text-sm opacity-80 -mt-2">Describe the image you want to create. Use <code className="bg-[var(--nb-surface-alt)] font-semibold px-1 py-0.5 rounded">@product</code> to incorporate an uploaded product image.</p>
                <textarea
                    value={marketingPrompt}
                    onChange={(e) => setMarketingPrompt(e.target.value)}
                    placeholder="e.g., A futuristic cityscape, or a shot of @product on a beach..."
                    className="neo-textarea h-32"
                />
                {showProductUploader && (
                    <div className="animate-fade-in">
                        <p className="font-semibold mb-2 opacity-80">Product Image</p>
                        <ImageUploader image={marketingProductImage} onImageUpload={setMarketingProductImage} />
                    </div>
                )}
                 <div className="space-y-4 pt-4 border-t-2 border-dashed border-[var(--nb-border)]">
                    <div className="flex items-center justify-between">
                        <span id="space-for-text-label" className="flex flex-col pr-4">
                            <span className="font-semibold">Reserve Space for Text</span>
                            <span className="text-sm opacity-70">Leaves empty space at the top.</span>
                        </span>
                        <button type="button" role="switch" aria-checked={leaveSpaceForText} aria-labelledby="space-for-text-label" onClick={() => setLeaveSpaceForText(!leaveSpaceForText)}
                            className={`${leaveSpaceForText ? 'bg-[var(--nb-primary)]' : 'bg-[var(--nb-surface-alt)]'} relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-[var(--nb-border)] transition-colors duration-200 ease-in-out`}>
                            <span aria-hidden="true" className={`${leaveSpaceForText ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out border border-[var(--nb-border)]`} />
                        </button>
                    </div>
                    <GenerationCountSelector label="Number of Images" value={numberOfImages} onChange={setNumberOfImages} />
                 </div>
                 <div className="mt-2 text-center">
                    <button onClick={() => setShowPresets(!showPresets)} className="text-sm font-semibold opacity-70 hover:opacity-100">
                        {showPresets ? 'Hide' : 'Show'} Prompt Ideas
                    </button>
                </div>
                {showPresets && (
                    <div className="space-y-4 pt-2 animate-fade-in">
                        <div>
                            <h4 className="font-bold text-sm mb-2 opacity-80">🍽️ FOR FOOD PRODUCTS</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {marketingPresets.food.map(p => (
                                    <button key={p.name} onClick={() => handlePresetClick(p.prompt)} className="neo-button neo-button-secondary text-xs w-full h-full text-left justify-start">{p.name}</button>
                                ))}
                            </div>
                        </div>
                         <div>
                            <h4 className="font-bold text-sm mb-2 opacity-80">💻 FOR TECH & OTHER PRODUCTS</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {marketingPresets.tech.map(p => (
                                    <button key={p.name} onClick={() => handlePresetClick(p.prompt)} className="neo-button neo-button-secondary text-xs w-full h-full text-left justify-start">{p.name}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm mb-2 opacity-80">🎨 CONCEPTS & BACKGROUNDS</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {marketingPresets.concepts.map(p => (
                                    <button key={p.name} onClick={() => handlePresetClick(p.prompt)} className="neo-button neo-button-secondary text-xs w-full h-full text-left justify-start">{p.name}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <button onClick={handleMarketingGenerate} disabled={isGenerateDisabled} className="w-full neo-button neo-button-primary text-lg">
                <SparklesIcon />
                {loadingMessage ? 'Generating...' : 'Generate Marketing Image'}
            </button>
        </div>
    );
};
