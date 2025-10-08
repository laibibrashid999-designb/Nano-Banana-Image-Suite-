import React from 'react';
import type { Bubble } from '../App';
import { CollapseIcon } from './Icons';

interface ExpandedImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    generatedImage: string | null;
    brightness: number;
    contrast: number;
    grainIntensity: number;
    bubbles: Bubble[];
    isWatermarkEnabled: boolean;
    bubbleImageUrl: string;
    watermarkUrl: string;
}

export const ExpandedImageModal: React.FC<ExpandedImageModalProps> = ({
    isOpen,
    onClose,
    generatedImage,
    brightness,
    contrast,
    grainIntensity,
    bubbles,
    isWatermarkEnabled,
    bubbleImageUrl,
    watermarkUrl,
}) => {
    if (!isOpen || !generatedImage) return null;

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="image-modal-title">
            <div className="image-modal-backdrop" onClick={onClose}></div>
            <div className="image-modal-content">
                <h2 id="image-modal-title" className="sr-only">Expanded Image View</h2>
                <div className="relative inline-block max-w-full max-h-full">
                    <img src={generatedImage} alt="Generated Model Expanded" className="block max-w-full max-h-full object-contain" style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }} />
                    {grainIntensity > 0 && <div className="grain-overlay" style={{ opacity: grainIntensity / 250 }}></div>}
                     <div className="absolute inset-0 pointer-events-none">
                        {bubbles.map(bubble => (
                            <div key={bubble.id} className="absolute aspect-square flex items-center justify-center"
                                style={{ left: `${bubble.x}%`, top: `${bubble.y}%`, width: `${bubble.size}%`, transform: `translate(-50%, -50%) rotate(${bubble.rotation}deg)`, containerType: 'inline-size' }}>
                                <div className="w-full h-full" style={{ transform: `scaleX(${bubble.scaleX})` }}>
                                    <img src={bubbleImageUrl} alt="Speech bubble" className="w-full h-full" />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center text-center p-[15%] text-black font-bold whitespace-pre-wrap break-words" style={{ fontSize: `${bubble.textSize}cqw` }}>
                                  {bubble.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    {isWatermarkEnabled && (
                        <img src={watermarkUrl} alt="Watermark" className="absolute bottom-4 right-4 h-10 w-auto z-20 pointer-events-none opacity-90"/>
                    )}
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 neo-button neo-icon-button neo-button-secondary !text-white bg-black/50 hover:bg-black/75 z-[51]" aria-label="Collapse image">
                    <CollapseIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};
