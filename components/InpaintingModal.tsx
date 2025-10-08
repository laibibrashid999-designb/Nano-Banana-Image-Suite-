import React from 'react';
import { MaskingCanvas } from './MaskingCanvas';
import { BrushIcon, XIcon, SparklesIcon } from './Icons';

interface InpaintingModalProps {
    isOpen: boolean;
    onClose: () => void;
    generatedImage: string | null;
    inpaintImageContainerRef: React.RefObject<HTMLDivElement>;
    inpaintBrushSize: number;
    setInpaintBrushSize: (size: number) => void;
    // FIX: Add missing 'inpaintMask' prop to be used in the component.
    inpaintMask: string | null;
    setInpaintMask: (mask: string | null) => void;
    clearMaskTrigger: number;
    inpaintPrompt: string;
    setInpaintPrompt: (prompt: string) => void;
    handleApplyInpaint: () => void;
    loadingMessage: string | null;
    setClearMaskTrigger: (updater: (c: number) => number) => void;
}

export const InpaintingModal: React.FC<InpaintingModalProps> = ({
    isOpen,
    onClose,
    generatedImage,
    inpaintImageContainerRef,
    inpaintBrushSize,
    setInpaintBrushSize,
    inpaintMask,
    setInpaintMask,
    clearMaskTrigger,
    inpaintPrompt,
    setInpaintPrompt,
    handleApplyInpaint,
    loadingMessage,
    setClearMaskTrigger
}) => {
    if (!isOpen || !generatedImage) return null;

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="inpaint-modal-title">
            <div className="image-modal-backdrop !bg-[var(--nb-bg)]/80" onClick={onClose}></div>
            <div className="image-modal-content">
                <div className="w-full h-full max-w-6xl max-h-[90vh] grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6 p-4">
                    <div className="flex items-center justify-center bg-[var(--nb-surface-alt)] border-2 border-[var(--nb-border)] rounded-lg p-2">
                         <div ref={inpaintImageContainerRef} className="relative w-full h-full flex items-center justify-center">
                            <img src={generatedImage} alt="Inpainting subject" className="max-w-full max-h-full object-contain" />
                            {inpaintImageContainerRef.current && (
                                <MaskingCanvas 
                                    container={inpaintImageContainerRef.current}
                                    imageUrl={generatedImage}
                                    brushSize={inpaintBrushSize}
                                    onMaskUpdate={setInpaintMask}
                                    clearTrigger={clearMaskTrigger}
                                />
                            )}
                        </div>
                    </div>
                    <div className="neo-card p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                             <div>
                                <h2 id="inpaint-modal-title" className="text-2xl font-bold flex items-center gap-2"><BrushIcon /> Inpaint Studio</h2>
                                <p className="text-sm opacity-70 mt-1">Draw a mask and describe your edit.</p>
                             </div>
                            <button onClick={onClose} className="neo-button neo-icon-button neo-button-secondary"><XIcon /></button>
                        </div>
                        <div className="flex-grow flex flex-col gap-4">
                            <div className="space-y-2">
                                <label htmlFor="brush-size-slider" className="text-sm font-semibold opacity-80">Brush Size</label>
                                <div className="flex items-center gap-3">
                                    <input id="brush-size-slider" type="range" min="10" max="150" value={inpaintBrushSize} onChange={(e) => setInpaintBrushSize(Number(e.target.value))} className="w-full" />
                                    <span className="text-sm font-medium opacity-70 w-12 text-right">{inpaintBrushSize}px</span>
                                </div>
                            </div>
                            <div className="flex-grow flex flex-col">
                                <label htmlFor="inpaint-prompt" className="text-sm font-semibold opacity-80 mb-2">Prompt</label>
                                <textarea id="inpaint-prompt" value={inpaintPrompt} onChange={e => setInpaintPrompt(e.target.value)} className="neo-textarea flex-grow" rows={5} placeholder="e.g., add a floral pattern" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <button onClick={() => setClearMaskTrigger(c => c + 1)} className="w-full neo-button neo-button-secondary">Clear Mask</button>
                            <button onClick={handleApplyInpaint} disabled={!inpaintMask || !inpaintPrompt || !!loadingMessage} className="w-full neo-button neo-button-primary">
                                <SparklesIcon /> Apply Inpaint
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};