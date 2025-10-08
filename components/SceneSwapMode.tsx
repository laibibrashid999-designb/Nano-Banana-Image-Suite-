import React from 'react';
import type { UploadedImage } from '../types';
import { ImageUploader } from './ImageUploader';
import { SparklesIcon, WandIcon } from './Icons';
import { GenerationCountSelector } from './GenerationCountSelector';

interface SceneSwapModeProps {
    originalModelImage: UploadedImage | null;
    handleModelImageUpload: (image: UploadedImage | null) => void;
    environmentImage: UploadedImage | null;
    setEnvironmentImage: (image: UploadedImage | null) => void;
    isStrictFaceEnabled: boolean;
    setIsStrictFaceEnabled: (enabled: boolean) => void;
    handleSceneSwapGenerate: () => void;
    handleAutoSceneSwapGenerate: () => void;
    loadingMessage: string | null;
    numberOfImages: 1 | 2;
    setNumberOfImages: (value: 1 | 2) => void;
    isTwoStageSwap: boolean;
    setIsTwoStageSwap: (enabled: boolean) => void;
    isParaphrasing: boolean;
    handleParaphraseSceneDescription: () => void;
    sceneDescription: string;
    setSceneDescription: (description: string) => void;
    swapStage: 'initial' | 'analyzed';
    setSwapStage: React.Dispatch<React.SetStateAction<'initial' | 'analyzed'>>;
    handleCompleteSceneSwap: () => void;
}

export const SceneSwapMode: React.FC<SceneSwapModeProps> = ({
    originalModelImage,
    handleModelImageUpload,
    environmentImage,
    setEnvironmentImage,
    isStrictFaceEnabled,
    setIsStrictFaceEnabled,
    handleSceneSwapGenerate,
    handleAutoSceneSwapGenerate,
    loadingMessage,
    numberOfImages,
    setNumberOfImages,
    isTwoStageSwap,
    setIsTwoStageSwap,
    isParaphrasing,
    handleParaphraseSceneDescription,
    sceneDescription,
    setSceneDescription,
    swapStage,
    setSwapStage,
    handleCompleteSceneSwap,
}) => {
    const isSceneSwapGenerateDisabled = !!loadingMessage || !originalModelImage || !environmentImage;

    if (swapStage === 'analyzed') {
        return (
            <div className="space-y-4 animate-fade-in">
                <div className="neo-card p-6 space-y-4">
                    <div className="flex items-center gap-4 justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--nb-primary)] text-[var(--nb-border)] dark:text-[var(--nb-bg)] font-bold text-lg border-2 border-[var(--nb-border)]">3</div>
                            <h2 className="text-2xl font-bold">Review & Edit</h2>
                        </div>
                        <button onClick={handleParaphraseSceneDescription} disabled={isParaphrasing || !!loadingMessage} className="neo-button neo-button-secondary text-sm">
                            <WandIcon /> {isParaphrasing ? 'Rephrasing...' : 'Rephrase'}
                        </button>
                    </div>
                    <p className="text-sm opacity-80 -mt-2">Edit the AI's analysis or rephrase it for an artistic touch before generating the final image.</p>
                    <textarea value={sceneDescription} onChange={(e) => setSceneDescription(e.target.value)} className="neo-textarea h-48" />
                </div>
                <div className="space-y-2">
                    <button onClick={handleCompleteSceneSwap} disabled={!!loadingMessage || !sceneDescription} className="w-full neo-button neo-button-primary text-lg">
                        <SparklesIcon />
                        {loadingMessage ? 'Generating...' : 'Complete Generation'}
                    </button>
                    <button onClick={() => setSwapStage('initial')} disabled={!!loadingMessage} className="w-full neo-button neo-button-secondary text-sm">
                        Back to Setup
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="neo-card p-6 space-y-4">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--nb-primary)] text-[var(--nb-border)] dark:text-[var(--nb-bg)] font-bold text-lg border-2 border-[var(--nb-border)]">1</div>
                    <h2 className="text-2xl font-bold">Your Model</h2>
                </div>
                <p className="text-sm opacity-80 -mt-2">Upload an image of the person whose face/identity you want to use.</p>
                <ImageUploader image={originalModelImage} onImageUpload={handleModelImageUpload} />
            </div>
            <div className="neo-card p-6 space-y-4">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--nb-primary)] text-[var(--nb-border)] dark:text-[var(--nb-bg)] font-bold text-lg border-2 border-[var(--nb-border)]">2</div>
                    <h2 className="text-2xl font-bold">Target Scene & Options</h2>
                </div>
                 <p className="text-sm opacity-80 -mt-2">Upload an image with the target pose, clothes, and background.</p>
                <ImageUploader image={environmentImage} onImageUpload={setEnvironmentImage} />
                 <div className="space-y-4 pt-4 border-t-2 border-dashed border-[var(--nb-border)]">
                    <div className="flex items-center justify-between">
                        <span id="strict-face-label" className="flex flex-col pr-4">
                            <span className="font-semibold">Strict Face Match</span>
                            <span className="text-sm opacity-70">Preserves the model's exact head and pose. Disable for a more creative composition.</span>
                        </span>
                        <button type="button" role="switch" aria-checked={isStrictFaceEnabled} aria-labelledby="strict-face-label" onClick={() => setIsStrictFaceEnabled(!isStrictFaceEnabled)}
                            className={`${isStrictFaceEnabled ? 'bg-[var(--nb-primary)]' : 'bg-[var(--nb-surface-alt)]'} relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-[var(--nb-border)] transition-colors duration-200 ease-in-out`}>
                            <span aria-hidden="true" className={`${isStrictFaceEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out border border-[var(--nb-border)]`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <span id="two-stage-label" className="flex flex-col pr-4">
                            <span className="font-semibold">2-Stage Generation</span>
                            <span className="text-sm opacity-70">Analyze scene first, then let you edit the description before final generation.</span>
                        </span>
                        <button type="button" role="switch" aria-checked={isTwoStageSwap} aria-labelledby="two-stage-label" onClick={() => setIsTwoStageSwap(!isTwoStageSwap)}
                            className={`${isTwoStageSwap ? 'bg-[var(--nb-primary)]' : 'bg-[var(--nb-surface-alt)]'} relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-[var(--nb-border)] transition-colors duration-200 ease-in-out`}>
                            <span aria-hidden="true" className={`${isTwoStageSwap ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out border border-[var(--nb-border)]`} />
                        </button>
                    </div>
                    <GenerationCountSelector label="Number of Images" value={numberOfImages} onChange={setNumberOfImages} />
                </div>
            </div>
            <div className="space-y-2">
                <button onClick={handleSceneSwapGenerate} disabled={isSceneSwapGenerateDisabled} className="w-full neo-button neo-button-primary text-lg">
                    {isTwoStageSwap ? <><WandIcon/> Analyze Scene</> : <><SparklesIcon/> Generate Scene Swap</>}
                </button>
                {!isTwoStageSwap && (
                    <button onClick={handleAutoSceneSwapGenerate} disabled={isSceneSwapGenerateDisabled} className="w-full neo-button neo-button-accent text-lg">
                        <WandIcon /> Creative Auto-Swap
                    </button>
                )}
            </div>
        </div>
    );
};