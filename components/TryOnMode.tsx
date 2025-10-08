import React from 'react';
import type { UploadedImage } from '../types';
import { InputType } from '../types';
import { AccordionSection } from './AccordionSection';
import { ImageUploader } from './ImageUploader';
import { TabButton } from './TabButton';
import { presetTextPrompts, presetImages } from '../constants/presets';
import { UserIcon, TShirtIcon, SparklesIcon, UsersIcon, CrosshairIcon, XIcon, LinkIcon, LockIcon, UnlockIcon, WandIcon } from './Icons';
import { GenerationCountSelector } from './GenerationCountSelector';

interface TryOnModeProps {
    activeAccordion: 'model' | 'clothing' | 'style' | null;
    setActiveAccordion: React.Dispatch<React.SetStateAction<'model' | 'clothing' | 'style' | null>>;
    originalModelImage: UploadedImage | null;
    handleModelImageUpload: (image: UploadedImage | null) => void;
    modelImage: UploadedImage | null;
    isFaceRestoreEnabled: boolean;
    setIsFaceRestoreEnabled: (enabled: boolean) => void;
    isSelectingPerson: boolean;
    setIsSelectingPerson: (isSelecting: boolean) => void;
    targetPersonPoint: { x: number; y: number } | null;
    setTargetPersonPoint: (point: { x: number; y: number } | null) => void;
    clothingImage: UploadedImage | null;
    clothingText: string;
    setClothingText: (text: string) => void;
    activeTab: InputType;
    setActiveTab: (tab: InputType) => void;
    clothingImageUrl: string;
    setClothingImageUrl: (url: string) => void;
    isUrlLoading: boolean;
    handleLoadFromUrlInput: () => void;
    handlePresetImageSelect: (url: string) => void;
    handleClothingImageUpload: (image: UploadedImage | null) => void;
    showPresets: boolean;
    setShowPresets: React.Dispatch<React.SetStateAction<boolean>>;
    selectedPresetUrl: string | null;
    isPoseLocked: boolean;
    setIsPoseLocked: (locked: boolean) => void;
    handleGenerate: () => void;
    loadingMessage: string | null;
    isPreparingModel: boolean;
    handlePrepareModel: () => void;
    numberOfImages: 1 | 2;
    setNumberOfImages: (value: 1 | 2) => void;
}

export const TryOnMode: React.FC<TryOnModeProps> = ({
    activeAccordion, setActiveAccordion, originalModelImage, handleModelImageUpload, modelImage, isFaceRestoreEnabled,
    setIsFaceRestoreEnabled, isSelectingPerson, setIsSelectingPerson, targetPersonPoint, setTargetPersonPoint, clothingImage,
    clothingText, setClothingText, activeTab, setActiveTab, clothingImageUrl, setClothingImageUrl, isUrlLoading,
    handleLoadFromUrlInput, handlePresetImageSelect, handleClothingImageUpload, showPresets, setShowPresets, selectedPresetUrl,
    isPoseLocked, setIsPoseLocked, handleGenerate, loadingMessage, isPreparingModel, handlePrepareModel,
    numberOfImages, setNumberOfImages,
}) => {
    const clothingInputMissing = (activeTab === InputType.TEXT && !clothingText) || (activeTab === InputType.IMAGE && !clothingImage);
    const isGenerateButtonDisabled = !!loadingMessage || !originalModelImage || clothingInputMissing || isPreparingModel;

    return (
        <div className="space-y-4 animate-fade-in">
            <AccordionSection Icon={UserIcon} title="1. Model" sectionId="model" activeSection={activeAccordion} setActiveSection={setActiveAccordion} isComplete={!!originalModelImage}>
                <ImageUploader image={originalModelImage} onImageUpload={handleModelImageUpload} />
                {originalModelImage && (
                    <div className="space-y-4 pt-4">
                        <div className="space-y-4 pt-4 border-t-2 border-[var(--nb-border)] border-dashed">
                            <div className="flex items-center justify-between">
                                <span id="face-restore-label" className="flex flex-col pr-4">
                                    <span className="font-semibold">Restore Original Face (Turn on only for still camera with just detail changes)</span>
                                </span>
                                <button type="button" role="switch" aria-checked={isFaceRestoreEnabled} aria-labelledby="face-restore-label" onClick={() => setIsFaceRestoreEnabled(!isFaceRestoreEnabled)}
                                    className={`${isFaceRestoreEnabled ? 'bg-[var(--nb-primary)]' : 'bg-[var(--nb-surface-alt)]'} relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-[var(--nb-border)] transition-colors duration-200 ease-in-out`}>
                                    <span aria-hidden="true" className={`${isFaceRestoreEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out border border-[var(--nb-border)]`} />
                                </button>
                            </div>
                            <div>
                                <p className="font-semibold flex items-center gap-2 text-base"><UsersIcon /> Multi-Person Selection</p>
                                <p className="text-sm opacity-70 mb-2">If your photo has multiple people, click to select who to style.</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsSelectingPerson(!isSelectingPerson)} className={`w-full neo-button text-sm ${isSelectingPerson ? 'neo-button-danger' : 'neo-button-secondary'}`}>
                                        <CrosshairIcon /> {isSelectingPerson ? 'Cancel Selection' : 'Select Person'}
                                    </button>
                                    {targetPersonPoint && (
                                        <button onClick={() => setTargetPersonPoint(null)} className="neo-button neo-icon-button neo-button-secondary" aria-label="Clear selected person"><XIcon /></button>
                                    )}
                                </div>
                                {targetPersonPoint && <p className="text-xs text-center font-semibold text-[var(--nb-primary)] animate-fade-in mt-2">✓ Person selected. Style will be applied here.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </AccordionSection>

            <AccordionSection Icon={TShirtIcon} title="2. Clothing" sectionId="clothing" activeSection={activeAccordion} setActiveSection={setActiveAccordion} isEnabled={!!originalModelImage} isComplete={!!clothingImage || (activeTab === InputType.TEXT && !!clothingText)}>
                <div className="space-y-4">
                    <div className="neo-tab-container">
                        <TabButton label="Describe" isActive={activeTab === InputType.TEXT} onClick={() => setActiveTab(InputType.TEXT)} />
                        <TabButton label="Upload" isActive={activeTab === InputType.IMAGE} onClick={() => setActiveTab(InputType.IMAGE)} />
                    </div>
                    {activeTab === InputType.TEXT ? (
                    <div>
                        <p className="opacity-80 mb-2 text-sm">Describe the design in detail.</p>
                        <textarea value={clothingText} onChange={(e) => {setClothingText(e.target.value); if(e.target.value) setActiveAccordion('style');}} 
                         className="neo-textarea" placeholder="e.g., a black sequin mini dress" />
                        <div className="mt-2 text-center">
                            <button onClick={() => setShowPresets(!showPresets)} className="text-sm font-semibold opacity-70 hover:opacity-100">
                                {showPresets ? 'Hide' : 'Show'} Presets
                            </button>
                        </div>
                        {showPresets && (
                            <div className="grid grid-cols-2 gap-2 mt-2 animate-fade-in">
                                {presetTextPrompts.map(p => (
                                    <button key={p.name} onClick={() => {setClothingText(p.prompt); setActiveAccordion('style');}} className="neo-button neo-button-secondary text-xs w-full">{p.name}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="opacity-80 text-sm">Upload a photo of the clothing item.</p>
                            <ImageUploader image={clothingImage} onImageUpload={handleClothingImageUpload} isLoading={isUrlLoading} />
                            <div className="flex items-center gap-2">
                                <hr className="flex-grow border-t border-[var(--nb-border)] opacity-30" />
                                <span className="text-xs font-semibold opacity-70">OR</span>
                                <hr className="flex-grow border-t border-[var(--nb-border)] opacity-30" />
                            </div>
                            <div className="flex gap-2">
                                <input type="text" value={clothingImageUrl} onChange={e => setClothingImageUrl(e.target.value)} className="neo-input w-full" placeholder="Enter image URL" />
                                <button onClick={handleLoadFromUrlInput} disabled={isUrlLoading} className="neo-button neo-button-secondary"><LinkIcon /></button>
                            </div>
                             <div className="text-center">
                                <button onClick={() => setShowPresets(!showPresets)} className="text-sm font-semibold opacity-70 hover:opacity-100">
                                    {showPresets ? 'Hide' : 'Show'} Image Presets
                                </button>
                            </div>
                            {showPresets && (
                                <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto animate-fade-in">
                                    {presetImages.map(p => (
                                        <button key={p.name} onClick={() => handlePresetImageSelect(p.url)} className={`rounded-lg overflow-hidden border-4 transition-colors ${selectedPresetUrl === p.url ? 'border-[var(--nb-primary)]' : 'border-transparent hover:border-[var(--nb-accent)]'}`}>
                                            <img src={p.url} alt={p.name} className="w-full h-24 object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </AccordionSection>
            
            <AccordionSection Icon={WandIcon} title="3. Style" sectionId="style" activeSection={activeAccordion} setActiveSection={setActiveAccordion} isEnabled={!!originalModelImage && !clothingInputMissing} isComplete={false}>
                 <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <span id="pose-lock-label" className="flex flex-col pr-4">
                            <span className="font-semibold flex items-center gap-2">{isPoseLocked ? <LockIcon /> : <UnlockIcon />} {isPoseLocked ? 'Pose Locked' : 'Creative Mode'}</span>
                            <span className="text-sm opacity-70">{isPoseLocked ? 'Keeps original pose & background.' : 'Generates new pose & scene.'}</span>
                        </span>
                        <button type="button" role="switch" aria-checked={isPoseLocked} aria-labelledby="pose-lock-label" onClick={() => setIsPoseLocked(!isPoseLocked)}
                            className={`${isPoseLocked ? 'bg-[var(--nb-primary)]' : 'bg-[var(--nb-accent)]'} relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-[var(--nb-border)] transition-colors duration-200 ease-in-out`}>
                            <span aria-hidden="true" className={`${isPoseLocked ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out border border-[var(--nb-border)]`} />
                        </button>
                    </div>
                    
                    <div className="pt-4 border-t-2 border-dashed border-[var(--nb-border)]">
                        <GenerationCountSelector label="Number of Images" value={numberOfImages} onChange={setNumberOfImages} />
                    </div>

                    {originalModelImage && (
                        <div className="space-y-2 pt-4 border-t-2 border-dashed border-[var(--nb-border)]">
                            <p className="text-sm opacity-80 text-center">For best results, prepare your model to remove existing clothing first.</p>
                            <button onClick={handlePrepareModel} disabled={isPreparingModel} className="w-full neo-button neo-button-accent">
                                <SparklesIcon /> {isPreparingModel ? 'Preparing...' : 'Prepare Model (Optional)'}
                            </button>
                        </div>
                    )}
                 </div>
            </AccordionSection>

             <button
                onClick={handleGenerate}
                disabled={isGenerateButtonDisabled}
                className="w-full neo-button neo-button-primary text-lg"
            >
                <SparklesIcon />
                {loadingMessage ? 'Generating...' : 'Generate Style'}
            </button>
        </div>
    );
};