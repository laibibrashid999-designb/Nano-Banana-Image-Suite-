import React, { useRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { AlertTriangleIcon, UndoIcon, RedoIcon, RefreshCcwIcon, DownloadIcon, ExpandIcon, ImageIcon } from './Icons';
import type { Bubble } from '../App';

interface RightPanelProps {
    generatedImages: string[] | null;
    activeImageIndex: number;
    setActiveImageIndex: (index: number) => void;
    generatedVideo: string | null;
    loadingMessage: string | null;
    error: string | null;
    canUndo: boolean;
    handleUndo: () => void;
    canRedo: boolean;
    handleRedo: () => void;
    handleUseAsModel: () => void;
    handlePrimaryDownload: () => void;
    isDownloading: boolean;
    imageDisplayRef: React.RefObject<HTMLDivElement>;
    imageAspectRatio: string;
    handleImageClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    isSelectingPoint: boolean;
    isSelectingPerson: boolean;
    brightness: number;
    contrast: number;
    grainIntensity: number;
    selectedPoint: { x: number; y: number } | null;
    targetPersonPoint: { x: number; y: number } | null;
    bubbles: Bubble[];
    handleBubbleMouseDown: (e: React.MouseEvent, bubbleId: number) => void;
    handleBubbleTouchStart: (e: React.TouchEvent, bubbleId: number) => void;
    dragState: { id: number } | null;
    setSelectedBubbleId: (id: number | null) => void;
    selectedBubbleId: number | null;
    isWatermarkEnabled: boolean;
    setIsExpanded: (expanded: boolean) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
    generatedImages,
    activeImageIndex,
    setActiveImageIndex,
    generatedVideo,
    loadingMessage,
    error,
    canUndo,
    handleUndo,
    canRedo,
    handleRedo,
    handleUseAsModel,
    handlePrimaryDownload,
    isDownloading,
    imageDisplayRef,
    imageAspectRatio,
    handleImageClick,
    isSelectingPoint,
    isSelectingPerson,
    brightness,
    contrast,
    grainIntensity,
    selectedPoint,
    targetPersonPoint,
    bubbles,
    handleBubbleMouseDown,
    handleBubbleTouchStart,
    dragState,
    setSelectedBubbleId,
    selectedBubbleId,
    isWatermarkEnabled,
    setIsExpanded,
}) => {
    const touchStartX = useRef(0);
    const currentGeneratedImage = generatedImages?.[activeImageIndex] ?? null;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (generatedImages && generatedImages.length > 1) {
            touchStartX.current = e.touches[0].clientX;
        }
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (generatedImages && generatedImages.length > 1) {
            const touchEndX = e.changedTouches[0].clientX;
            const deltaX = touchEndX - touchStartX.current;
            if (Math.abs(deltaX) > 50) { // Swipe threshold
                if (deltaX > 0) { // Swipe right
                    handlePrev();
                } else { // Swipe left
                    handleNext();
                }
            }
        }
    };

    const handlePrev = () => {
        if (generatedImages && generatedImages.length > 1) {
            setActiveImageIndex((activeImageIndex - 1 + generatedImages.length) % generatedImages.length);
        }
    };

    const handleNext = () => {
        if (generatedImages && generatedImages.length > 1) {
            setActiveImageIndex((activeImageIndex + 1) % generatedImages.length);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex-shrink-0">
                <div className="neo-card p-4">
                     <fieldset disabled={(!currentGeneratedImage && !generatedVideo) || !!loadingMessage} className="space-y-3">
                        <div className="flex justify-center gap-3">
                            <button onClick={handleUndo} disabled={!canUndo || !!loadingMessage} className="w-full neo-button neo-button-secondary"><UndoIcon /> Undo</button>
                            <button onClick={handleRedo} disabled={!canRedo || !!loadingMessage} className="w-full neo-button neo-button-secondary"><RedoIcon /> Redo</button>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <button onClick={handleUseAsModel} disabled={!!generatedVideo} className="w-full sm:w-auto flex-1 neo-button neo-button-secondary"><RefreshCcwIcon /> Use as New Model</button>
                            <button onClick={handlePrimaryDownload} disabled={isDownloading} className="w-full sm:w-auto flex-1 neo-button neo-button-primary">
                                <DownloadIcon /> {isDownloading ? 'Preparing...' : (generatedVideo ? 'Download Video' : 'Download Image')}
                            </button>
                        </div>
                     </fieldset>
                </div>
            </div>
            <div className="flex-grow flex items-center justify-center min-h-0">
                <div 
                    ref={imageDisplayRef}
                    className="w-full h-full flex justify-center items-center rounded-xl relative overflow-hidden bg-[var(--nb-surface-alt)] transition-all neo-card"
                    style={{ aspectRatio: imageAspectRatio }}
                    onClick={handleImageClick}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {loadingMessage && <LoadingSpinner message={loadingMessage} />}
                    {error && !loadingMessage && (
                    <div className="text-center text-[var(--nb-secondary)] p-4">
                        <AlertTriangleIcon className="mx-auto mb-2" />
                        <p className="font-semibold">An Error Occurred</p>
                        <p className="text-sm">{error}</p>
                    </div>
                    )}
                    {!loadingMessage && !error && (currentGeneratedImage || generatedVideo) && (
                        <>
                           {generatedVideo ? (
                                <video
                                    key={generatedVideo}
                                    src={generatedVideo}
                                    controls
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="object-contain w-full h-full"
                                />
                            ) : currentGeneratedImage && (
                                <>
                                    {generatedImages?.map((imgSrc, index) => (
                                         <img 
                                            key={index}
                                            src={imgSrc} 
                                            alt={`Generated Model ${index + 1}`} 
                                            className={`object-contain w-full h-full absolute inset-0 transition-opacity duration-300 ease-in-out ${isSelectingPoint || isSelectingPerson ? 'cursor-crosshair' : ''} ${index === activeImageIndex ? 'opacity-100' : 'opacity-0'}`} 
                                            style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }} 
                                        />
                                    ))}
                                    <div className="grain-overlay" style={{ opacity: grainIntensity / 250 }}></div>
                                    
                                    {selectedPoint && (
                                        <div className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20" style={{ left: `${selectedPoint.x}%`, top: `${selectedPoint.y}%` }}>
                                            <div className="w-full h-full rounded-full bg-red-500/50 ring-2 ring-white animate-ping"></div>
                                            <div className="absolute inset-0 w-full h-full rounded-full border-2 border-white bg-red-500 shadow-lg"></div>
                                        </div>
                                    )}
                                    
                                    {targetPersonPoint && (
                                        <div className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20" style={{ left: `${targetPersonPoint.x}%`, top: `${targetPersonPoint.y}%` }}>
                                            <div className="w-full h-full rounded-full bg-blue-500/50 ring-2 ring-white animate-ping"></div>
                                            <div className="absolute inset-0 w-full h-full rounded-full border-2 border-white bg-blue-500 shadow-lg"></div>
                                        </div>
                                    )}

                                    <div className="absolute inset-0">
                                        {bubbles.map(bubble => (
                                            <div key={bubble.id} onMouseDown={(e) => handleBubbleMouseDown(e, bubble.id)} onTouchStart={(e) => handleBubbleTouchStart(e, bubble.id)} onClick={(e) => { e.stopPropagation(); setSelectedBubbleId(bubble.id); }}
                                                className={`absolute aspect-square flex items-center justify-center transition-transform duration-100 ${dragState?.id === bubble.id ? 'cursor-grabbing scale-105 z-20' : 'cursor-grab z-10'}`}
                                                style={{ left: `${bubble.x}%`, top: `${bubble.y}%`, width: `${bubble.size}%`, transform: `translate(-50%, -50%) rotate(${bubble.rotation}deg)`, filter: dragState?.id === bubble.id ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'none', containerType: 'inline-size' }}>
                                                <div className="w-full h-full transition-all duration-200 pointer-events-none" style={{ transform: `scaleX(${bubble.scaleX})`, filter: selectedBubbleId === bubble.id ? 'drop-shadow(0 0 8px var(--nb-accent))' : 'none' }}>
                                                    <img src={'https://static.vecteezy.com/system/resources/thumbnails/045/925/602/small/black-and-white-color-speech-bubble-balloon-icon-sticker-memo-keyword-planner-text-box-banner-png.png'} alt="Speech bubble" className="w-full h-full"/>
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center text-center p-[15%] text-black font-bold whitespace-pre-wrap break-words pointer-events-none" style={{ fontSize: `${bubble.textSize}cqw` }}>
                                                  {bubble.text}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {isWatermarkEnabled && (
                                        <img src={'https://vectorseek.com/wp-content/uploads/2023/08/Blacked-Logo-Vector.svg-.png'} alt="Watermark" className="absolute bottom-2 right-2 md:bottom-4 md:right-4 h-6 md:h-8 w-auto z-20 pointer-events-none opacity-90"/>
                                    )}

                                    {generatedImages && generatedImages.length > 1 && (
                                        <>
                                            <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 z-30 neo-button neo-icon-button neo-button-secondary !text-white bg-black/50 hover:bg-black/75" aria-label="Previous image">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                            </button>
                                            <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 z-30 neo-button neo-icon-button neo-button-secondary !text-white bg-black/50 hover:bg-black/75" aria-label="Next image">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                            </button>
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2 p-2 bg-black/40 rounded-full">
                                                {generatedImages.map((_, index) => (
                                                    <button key={index} onClick={() => setActiveImageIndex(index)} className={`w-2 h-2 rounded-full transition-colors ${index === activeImageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`} aria-label={`Go to image ${index + 1}`}></button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </>
                    )}
                    {(currentGeneratedImage || generatedVideo) && !loadingMessage && !error && (
                        <button onClick={() => setIsExpanded(true)} disabled={!!generatedVideo} className="absolute top-3 right-3 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors z-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white neo-button neo-icon-button disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Expand image">
                            <ExpandIcon className="w-5 h-5" />
                        </button>
                    )}
                    {!loadingMessage && !error && !currentGeneratedImage && !generatedVideo && (
                    <div className="text-center text-[var(--nb-text)] opacity-60 px-4">
                        <ImageIcon className="mx-auto mb-4 w-16 h-16"/>
                        <p className="font-semibold text-base sm:text-lg">Your masterpiece will appear here</p>
                        <p className="text-sm mt-1">Follow the steps on the left to create your design</p>
                    </div>
                    )}
                </div>
            </div>
        </div>
    );
};
