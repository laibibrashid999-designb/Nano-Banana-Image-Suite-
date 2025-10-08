import React from 'react';
import { TabButton } from './TabButton';
import { ImageUploader } from './ImageUploader';
import {
    WandIcon, SlidersIcon, CameraIcon, MessageSquareIcon, FilmIcon, JewelryIcon, BoxIcon, CrosshairIcon, XIcon,
    BrushIcon, BrightnessIcon, ContrastIcon, CopyrightIcon, SaveIcon, TrashIcon
} from './Icons';
import type { UploadedImage } from '../types';
import type { Bubble } from '../App';

interface StudioPanelProps {
    activeStudioTab: 'edit' | 'adjust' | 'effects' | 'overlays' | 'animate';
    setActiveStudioTab: React.Dispatch<React.SetStateAction<'edit' | 'adjust' | 'effects' | 'overlays' | 'animate'>>;
    editTab: 'creative' | 'accessory' | 'product';
    setEditTab: React.Dispatch<React.SetStateAction<'creative' | 'accessory' | 'product'>>;
    isSelectingPoint: boolean;
    setIsSelectingPoint: (isSelecting: boolean) => void;
    selectedPoint: { x: number; y: number } | null;
    setSelectedPoint: (point: { x: number; y: number } | null) => void;
    editPrompt: string;
    setEditPrompt: (prompt: string) => void;
    handleEditImage: () => void;
    setIsInpainting: (isInpainting: boolean) => void;
    accessoryPrompt: string;
    setAccessoryPrompt: (prompt: string) => void;
    accessoryImage: UploadedImage | null;
    setAccessoryImage: (image: UploadedImage | null) => void;
    handleAccessorize: () => void;
    productPrompt: string;
    setProductPrompt: (prompt: string) => void;
    productImage: UploadedImage | null;
    setProductImage: (image: UploadedImage | null) => void;
    handleStageProduct: () => void;
    brightness: number;
    setBrightness: (value: number) => void;
    contrast: number;
    setContrast: (value: number) => void;
    grainIntensity: number;
    setGrainIntensity: (value: number) => void;
    handleMakePortrait: () => void;
    handleBackgroundChange: (prompt: string) => void;
    isWatermarkEnabled: boolean;
    setIsWatermarkEnabled: (enabled: boolean) => void;
    bubbles: Bubble[];
    handleAddBubble: () => void;
    handleApplyBubbles: () => void;
    selectedBubbleId: number | null;
    setSelectedBubbleId: (id: number | null) => void;
    handleDeleteBubble: (id: number) => void;
    selectedBubble: Bubble | undefined;
    handleUpdateBubble: (id: number, updates: Partial<Bubble>) => void;
    animationPrompt: string;
    setAnimationPrompt: (prompt: string) => void;
    handleAnimateImage: () => void;
    loadingMessage: string | null;
}

export const StudioPanel: React.FC<StudioPanelProps> = ({
    activeStudioTab, setActiveStudioTab, editTab, setEditTab, isSelectingPoint, setIsSelectingPoint, selectedPoint,
    setSelectedPoint, editPrompt, setEditPrompt, handleEditImage, setIsInpainting, accessoryPrompt, setAccessoryPrompt,
    accessoryImage, setAccessoryImage, handleAccessorize, productPrompt, setProductPrompt, productImage, setProductImage,
    handleStageProduct, brightness, setBrightness, contrast, setContrast, grainIntensity, setGrainIntensity, handleMakePortrait,
    handleBackgroundChange, isWatermarkEnabled, setIsWatermarkEnabled, bubbles, handleAddBubble, handleApplyBubbles,
    selectedBubbleId, setSelectedBubbleId, handleDeleteBubble, selectedBubble, handleUpdateBubble, animationPrompt,
    setAnimationPrompt, handleAnimateImage, loadingMessage
}) => {
    const showProductUploader = productPrompt.includes('@object');
    const showAccessoryUploader = accessoryPrompt.includes('@accessory');

    return (
        <div className="space-y-4 animate-fade-in">
             <div className="text-center py-2">
                <span className="font-bold text-sm opacity-60">STUDIO</span>
            </div>
            <div className="neo-card p-4 space-y-4">
                <div className="neo-tab-container !p-1.5">
                    <TabButton Icon={WandIcon} label="Edit" isActive={activeStudioTab === 'edit'} onClick={() => setActiveStudioTab('edit')} />
                    <TabButton Icon={SlidersIcon} label="Adjust" isActive={activeStudioTab === 'adjust'} onClick={() => setActiveStudioTab('adjust')} />
                    <TabButton Icon={CameraIcon} label="Effects" isActive={activeStudioTab === 'effects'} onClick={() => setActiveStudioTab('effects')} />
                    <TabButton Icon={MessageSquareIcon} label="Overlays" isActive={activeStudioTab === 'overlays'} onClick={() => setActiveStudioTab('overlays')} />
                    <TabButton Icon={FilmIcon} label="Animate" isActive={activeStudioTab === 'animate'} onClick={() => setActiveStudioTab('animate')} />
                </div>

                {/* EDIT TAB */}
                {activeStudioTab === 'edit' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="neo-tab-container">
                        <TabButton label="Creative" Icon={WandIcon} isActive={editTab === 'creative'} onClick={() => setEditTab('creative')} />
                        <TabButton label="Accessory" Icon={JewelryIcon} isActive={editTab === 'accessory'} onClick={() => setEditTab('accessory')} />
                        <TabButton label="Product" Icon={BoxIcon} isActive={editTab === 'product'} onClick={() => setEditTab('product')} />
                    </div>
                    
                    {editTab === 'creative' && (
                        <div className="space-y-3 pt-2 animate-fade-in">
                            <p className="font-bold text-sm opacity-80">QUICK EDIT</p>
                            <div className="flex gap-2">
                            <button onClick={() => setIsSelectingPoint(!isSelectingPoint)} className={`w-full neo-button text-sm ${isSelectingPoint ? 'neo-button-danger' : 'neo-button-secondary'}`}>
                                <CrosshairIcon /> {isSelectingPoint ? 'Cancel Selection' : 'Select Point'}
                            </button>
                            {selectedPoint && (
                                <button onClick={() => setSelectedPoint(null)} className="neo-button neo-icon-button neo-button-secondary" aria-label="Clear selected point"><XIcon /></button>
                            )}
                            </div>
                            <div className="flex gap-2">
                                <input type="text" value={editPrompt} onChange={e => setEditPrompt(e.target.value)} className="neo-input w-full" placeholder="e.g., make the shirt red" />
                                <button onClick={handleEditImage} disabled={!editPrompt} className="neo-button neo-button-primary"><WandIcon /></button>
                            </div>
                            {selectedPoint && <p className="text-xs text-center font-semibold text-[var(--nb-primary)] animate-fade-in">✓ Point selected. Edit will be applied here.</p>}

                            <p className="font-bold text-sm opacity-80 pt-2">ADVANCED EDIT</p>
                            <button onClick={() => setIsInpainting(true)} className="w-full neo-button neo-button-secondary"><BrushIcon /> Inpaint Studio</button>
                        </div>
                    )}

                    {editTab === 'accessory' && (
                        <div className="space-y-3 pt-2 animate-fade-in">
                            <textarea value={accessoryPrompt} onChange={e => setAccessoryPrompt(e.target.value)} className="neo-textarea" placeholder="e.g., a diamond necklace. Use @accessory to upload an image." />
                            <p className="text-xs opacity-70 -mt-2 px-1">Use <code className="bg-[var(--nb-surface-alt)] font-semibold px-1 py-0.5 rounded">@accessory</code> to show uploader.</p>
                            {showAccessoryUploader && <ImageUploader image={accessoryImage} onImageUpload={setAccessoryImage} />}
                            <button onClick={handleAccessorize} disabled={!accessoryPrompt || (showAccessoryUploader && !accessoryImage)} className="w-full neo-button neo-button-danger"><JewelryIcon /> Add Accessory</button>
                        </div>
                    )}
                    
                    {editTab === 'product' && (
                        <div className="space-y-3 pt-2 animate-fade-in">
                            <textarea value={productPrompt} onChange={e => setProductPrompt(e.target.value)} className="neo-textarea" placeholder="e.g., holding @object in left hand" />
                            <p className="text-xs opacity-70 -mt-2 px-1">Use <code className="bg-[var(--nb-surface-alt)] font-semibold px-1 py-0.5 rounded">@object</code> to show uploader.</p>
                            {showProductUploader && <ImageUploader image={productImage} onImageUpload={setProductImage} />}
                            <button onClick={handleStageProduct} disabled={!productPrompt || (showProductUploader && !productImage)} className="w-full neo-button neo-button-accent"><BoxIcon /> Stage Product</button>
                        </div>
                    )}
                </div>
                )}

                {/* ADJUST TAB */}
                {activeStudioTab === 'adjust' && (
                    <div className="space-y-3 p-2 animate-fade-in">
                        <div className="flex items-center gap-3" title="Brightness">
                            <BrightnessIcon />
                            <input aria-label="Brightness" id="brightness-slider" type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full" />
                            <span className="text-sm font-medium opacity-70 w-12 text-right">{brightness}%</span>
                        </div>
                        <div className="flex items-center gap-3" title="Contrast">
                            <ContrastIcon />
                            <input aria-label="Contrast" id="contrast-slider" type="range" min="50" max="150" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full" />
                            <span className="text-sm font-medium opacity-70 w-12 text-right">{contrast}%</span>
                        </div>
                        <div className="flex items-center gap-3" title="Film Grain">
                            <FilmIcon />
                            <input aria-label="Film Grain" id="grain-slider" type="range" min="0" max="100" value={grainIntensity} onChange={(e) => setGrainIntensity(Number(e.target.value))} className="w-full" />
                            <span className="text-sm font-medium opacity-70 w-12 text-right">{grainIntensity}%</span>
                        </div>
                    </div>
                )}

                {/* EFFECTS TAB */}
                {activeStudioTab === 'effects' && (
                    <div className="space-y-4 p-2 animate-fade-in">
                        <div>
                            <h4 className="font-bold mb-2 flex items-center gap-2"><CameraIcon /> Composition</h4>
                            <button onClick={handleMakePortrait} className="w-full neo-button neo-button-secondary text-sm">Make Full Body Portrait</button>
                        </div>
                         <div>
                            <h4 className="font-bold mb-2 flex items-center gap-2"><BrushIcon /> Quick Backgrounds</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleBackgroundChange('a professional photography studio')} className="neo-button neo-button-secondary text-xs w-full">Studio</button>
                                <button onClick={() => handleBackgroundChange('an outdoor park with green trees')} className="neo-button neo-button-secondary text-xs w-full">Outdoor</button>
                                <button onClick={() => handleBackgroundChange('a solid, light grey wall')} className="neo-button neo-button-secondary text-xs w-full">Minimal</button>
                                <button onClick={() => handleBackgroundChange('a vibrant, colorful cityscape at night')} className="neo-button neo-button-secondary text-xs w-full">Cityscape</button>
                            </div>
                        </div>
                    </div>
                )}

                 {/* OVERLAYS TAB */}
                {activeStudioTab === 'overlays' && (
                    <div className="space-y-4 p-2 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <span id="watermark-label" className="flex flex-col pr-4">
                                <span className="font-semibold flex items-center gap-2"><CopyrightIcon /> Watermark</span>
                                <span className="text-sm opacity-70">Applies a logo to the corner.</span>
                            </span>
                            <button type="button" role="switch" aria-checked={isWatermarkEnabled} aria-labelledby="watermark-label" onClick={() => setIsWatermarkEnabled(!isWatermarkEnabled)}
                                className={`${isWatermarkEnabled ? 'bg-[var(--nb-primary)]' : 'bg-[var(--nb-surface-alt)]'} relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-[var(--nb-border)] transition-colors duration-200 ease-in-out`}>
                                <span aria-hidden="true" className={`${isWatermarkEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out border border-[var(--nb-border)]`}/>
                            </button>
                        </div>
                        <div className="pt-4 border-t-2 border-dashed border-[var(--nb-border)]">
                            <h4 className="font-bold mb-2 flex items-center gap-2"><MessageSquareIcon /> Speech Bubbles</h4>
                            <button onClick={handleAddBubble} className="w-full neo-button neo-button-secondary">Add Bubble</button>
                            {bubbles.length > 0 && ( <button onClick={handleApplyBubbles} className="w-full neo-button neo-button-accent mt-2"> <SaveIcon /> Apply Bubbles to Image </button> )}
                            <div className="space-y-2 mt-3 max-h-32 overflow-y-auto">
                                {bubbles.map((bubble, index) => (
                                    <div key={bubble.id} onClick={() => setSelectedBubbleId(bubble.id)} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border-2 transition-colors ${selectedBubbleId === bubble.id ? 'border-[var(--nb-primary)] bg-[var(--nb-surface-alt)]' : 'border-transparent hover:bg-[var(--nb-surface-alt)]'}`}>
                                        <span className="font-semibold text-sm">Bubble {index + 1}</span>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteBubble(bubble.id); }} className="neo-button neo-icon-button !p-1"><TrashIcon /></button>
                                    </div>
                                ))}
                            </div>
                            {selectedBubble && (
                                <div className="space-y-3 pt-4 mt-3 border-t-2 border-dashed border-[var(--nb-border)]">
                                    <h5 className="font-bold">Editing Bubble {bubbles.findIndex(b => b.id === selectedBubbleId) + 1}</h5>
                                    <textarea value={selectedBubble.text} onChange={e => handleUpdateBubble(selectedBubble.id, {text: e.target.value})} className="neo-textarea" rows={3}/>
                                    <button onClick={() => handleUpdateBubble(selectedBubble.id, {scaleX: selectedBubble.scaleX * -1})} className="w-full neo-button neo-button-secondary text-sm">Flip Horizontal</button>
                                    
                                    <div className="space-y-1 pt-2">
                                        <label htmlFor="bubble-size-slider" className="text-sm font-semibold opacity-80">Bubble Size</label>
                                        <div className="flex items-center gap-3">
                                            <input id="bubble-size-slider" type="range" min="10" max="100" value={selectedBubble.size} onChange={(e) => handleUpdateBubble(selectedBubble.id, { size: Number(e.target.value) })} className="w-full" />
                                            <span className="text-sm font-medium opacity-70 w-12 text-right">{selectedBubble.size}%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label htmlFor="text-size-slider" className="text-sm font-semibold opacity-80">Text Size</label>
                                        <div className="flex items-center gap-3">
                                            <input id="text-size-slider" type="range" min="5" max="50" value={selectedBubble.textSize} onChange={(e) => handleUpdateBubble(selectedBubble.id, { textSize: Number(e.target.value) })} className="w-full" />
                                            <span className="text-sm font-medium opacity-70 w-12 text-right">{selectedBubble.textSize}%</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                 {/* ANIMATE TAB */}
                 {activeStudioTab === 'animate' && (
                    <div className="space-y-4 p-2 animate-fade-in">
                        <h4 className="font-bold mb-2 flex items-center gap-2"><FilmIcon /> Animate with VEO</h4>
                        <p className="text-sm opacity-70 -mt-2">Describe how you want the image to move. This can take several minutes.</p>
                        <textarea
                            value={animationPrompt}
                            onChange={e => setAnimationPrompt(e.target.value)}
                            className="neo-textarea"
                            placeholder="e.g., subtle steam rising from the coffee cup"
                            rows={3}
                        />
                        <button
                            onClick={handleAnimateImage}
                            disabled={!animationPrompt || !!loadingMessage}
                            className="w-full neo-button neo-button-primary"
                        >
                            <FilmIcon />
                            {loadingMessage && activeStudioTab === 'animate' ? 'Animating...' : 'Generate Animation'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
