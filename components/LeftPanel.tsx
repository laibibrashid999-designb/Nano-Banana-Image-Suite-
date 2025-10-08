import React from 'react';
import { TabButton } from './TabButton';
import { WandIcon, FrameIcon, MegaphoneIcon, BrushIcon, ScissorsIcon } from './Icons';
import { TryOnMode } from './TryOnMode';
import { SceneSwapMode } from './SceneSwapMode';
import { MarketingMode } from './MarketingMode';
import { StudioPanel } from './StudioPanel';
import { ActivityLog } from './ActivityLog';
import { UploadedImage, InputType } from '../types';
import { Bubble } from '../App';
import { fetchImageAsUploadedImage } from '../App';
import { presetImages } from '../constants/presets';
import { HairStyleMode } from './HairStyleMode';

interface LeftPanelProps {
    appMode: 'tryon' | 'sceneswap' | 'marketing' | 'hairstyle';
    setAppMode: (mode: 'tryon' | 'sceneswap' | 'marketing' | 'hairstyle') => void;
    generatedImage: string | null;
    loadingMessage: string | null;
    activeAccordion: 'model' | 'clothing' | 'style' | null;
    setActiveAccordion: React.Dispatch<React.SetStateAction<'model' | 'clothing' | 'style' | null>>;
    originalModelImage: UploadedImage | null;
    handleModelImageUpload: (image: UploadedImage | null) => void;
    isFaceRestoreEnabled: boolean;
    setIsFaceRestoreEnabled: (enabled: boolean) => void;
    isSelectingPerson: boolean;
    setIsSelectingPerson: (isSelecting: boolean) => void;
    targetPersonPoint: { x: number; y: number } | null;
    setTargetPersonPoint: (point: { x: number; y: number } | null) => void;
    modelImage: UploadedImage | null;
    clothingImage: UploadedImage | null;
    setClothingImage: (image: UploadedImage | null) => void;
    clothingText: string;
    setClothingText: (text: string) => void;
    clothingImageUrl: string;
    setClothingImageUrl: (url: string) => void;
    isUrlLoading: boolean;
    setIsUrlLoading: (loading: boolean) => void;
    addLog: (message: string) => void;
    setError: (error: string | null) => void;
    showPresets: boolean;
    setShowPresets: React.Dispatch<React.SetStateAction<boolean>>;
    isPoseLocked: boolean;
    setIsPoseLocked: (locked: boolean) => void;
    handleGenerate: (activeTab: InputType, clothingText: string, clothingImage: UploadedImage | null) => void;
    isPreparingModel: boolean;
    handlePrepareModel: () => void;
    environmentImage: UploadedImage | null;
    setEnvironmentImage: (image: UploadedImage | null) => void;
    isStrictFaceEnabled: boolean;
    setIsStrictFaceEnabled: (enabled: boolean) => void;
    handleSceneSwapGenerate: () => void;
    handleAutoSceneSwapGenerate: () => void;
    hairStyleImage: UploadedImage | null;
    setHairStyleImage: (image: UploadedImage | null) => void;
    handleHairStyleGenerate: () => void;
    marketingPrompt: string;
    setMarketingPrompt: (prompt: string) => void;
    marketingProductImage: UploadedImage | null;
    setMarketingProductImage: (image: UploadedImage | null) => void;
    leaveSpaceForText: boolean;
    setLeaveSpaceForText: (enabled: boolean) => void;
    handleMarketingGenerate: () => void;
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
    activeStudioTab: 'edit' | 'adjust' | 'effects' | 'overlays' | 'animate';
    setActiveStudioTab: React.Dispatch<React.SetStateAction<'edit' | 'adjust' | 'effects' | 'overlays' | 'animate'>>;
    editTab: 'creative' | 'accessory' | 'product';
    setEditTab: React.Dispatch<React.SetStateAction<'creative' | 'accessory' | 'product'>>;
    editPrompt: string;
    setEditPrompt: (prompt: string) => void;
    isSelectingPoint: boolean;
    setIsSelectingPoint: (isSelecting: boolean) => void;
    selectedPoint: { x: number; y: number } | null;
    setSelectedPoint: (point: { x: number; y: number } | null) => void;
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
    handleUpdateBubble: (id: number, updates: Partial<Bubble>) => void;
    animationPrompt: string;
    setAnimationPrompt: (prompt: string) => void;
    handleAnimateImage: () => void;
    logs: string[];
    setLogs: (logs: string[]) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = (props) => {
    
    const [activeTab, setActiveTab] = React.useState<InputType>(InputType.IMAGE);
    const [selectedPresetUrl, setSelectedPresetUrl] = React.useState<string | null>(props.clothingImageUrl);

    const loadClothingUrl = React.useCallback(async (url: string) => {
        if (!url) return;
        props.setIsUrlLoading(true);
        props.setError(null);
        props.addLog(`Loading image from URL: ${url}`);
        try {
            const image = await fetchImageAsUploadedImage(url);
            props.setClothingImage(image);
            props.addLog('Image loaded successfully from URL.');
            props.setActiveAccordion('style');
        } catch (err) {
            const errorMsg = `Failed to load from URL. This may be a CORS issue. Try another URL or upload a file. Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
            props.setError(errorMsg);
            props.addLog(errorMsg);
        } finally {
            props.setIsUrlLoading(false);
        }
      }, [props]);

    const handleLoadFromUrlInput = () => {
        setSelectedPresetUrl(null);
        loadClothingUrl(props.clothingImageUrl);
    };

    const handlePresetImageSelect = (url: string) => {
        props.setClothingImageUrl(url);
        setSelectedPresetUrl(url);
        loadClothingUrl(url);
    };
    
    const handleClothingImageUpload = (image: UploadedImage | null) => {
        props.setClothingImage(image);
        if (image) {
            setSelectedPresetUrl(null);
            props.setActiveAccordion('style');
        }
    }

    React.useEffect(() => {
        if (props.clothingImageUrl && presetImages.some(p => p.url === props.clothingImageUrl)) {
            loadClothingUrl(props.clothingImageUrl);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectedBubble = props.bubbles.find(b => b.id === props.selectedBubbleId);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                <div className="neo-card p-2">
                    <div className="neo-tab-container !p-2">
                        <TabButton label="Virtual Try-On" Icon={WandIcon} isActive={props.appMode === 'tryon'} onClick={() => props.setAppMode('tryon')} />
                        <TabButton label="Scene Swap" Icon={FrameIcon} isActive={props.appMode === 'sceneswap'} onClick={() => props.setAppMode('sceneswap')} />
                        <TabButton label="Hair Style" Icon={ScissorsIcon} isActive={props.appMode === 'hairstyle'} onClick={() => props.setAppMode('hairstyle')} />
                        <TabButton label="Marketing" Icon={MegaphoneIcon} isActive={props.appMode === 'marketing'} onClick={() => props.setAppMode('marketing')} />
                    </div>
                </div>

                {props.appMode === 'tryon' && (
                    <TryOnMode
                        activeAccordion={props.activeAccordion}
                        setActiveAccordion={props.setActiveAccordion}
                        originalModelImage={props.originalModelImage}
                        handleModelImageUpload={props.handleModelImageUpload}
                        modelImage={props.modelImage}
                        isFaceRestoreEnabled={props.isFaceRestoreEnabled}
                        setIsFaceRestoreEnabled={props.setIsFaceRestoreEnabled}
                        isSelectingPerson={props.isSelectingPerson}
                        setIsSelectingPerson={props.setIsSelectingPerson}
                        targetPersonPoint={props.targetPersonPoint}
                        setTargetPersonPoint={props.setTargetPersonPoint}
                        clothingImage={props.clothingImage}
                        clothingText={props.clothingText}
                        setClothingText={props.setClothingText}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        clothingImageUrl={props.clothingImageUrl}
                        setClothingImageUrl={props.setClothingImageUrl}
                        isUrlLoading={props.isUrlLoading}
                        handleLoadFromUrlInput={handleLoadFromUrlInput}
                        handlePresetImageSelect={handlePresetImageSelect}
                        handleClothingImageUpload={handleClothingImageUpload}
                        showPresets={props.showPresets}
                        setShowPresets={props.setShowPresets}
                        selectedPresetUrl={selectedPresetUrl}
                        isPoseLocked={props.isPoseLocked}
                        setIsPoseLocked={props.setIsPoseLocked}
                        handleGenerate={() => props.handleGenerate(activeTab, props.clothingText, props.clothingImage)}
                        loadingMessage={props.loadingMessage}
                        isPreparingModel={props.isPreparingModel}
                        handlePrepareModel={props.handlePrepareModel}
                        numberOfImages={props.numberOfImages}
                        setNumberOfImages={props.setNumberOfImages}
                    />
                )}
                
                {props.appMode === 'sceneswap' && (
                    <SceneSwapMode
                        originalModelImage={props.originalModelImage}
                        handleModelImageUpload={props.handleModelImageUpload}
                        environmentImage={props.environmentImage}
                        setEnvironmentImage={props.setEnvironmentImage}
                        isStrictFaceEnabled={props.isStrictFaceEnabled}
                        setIsStrictFaceEnabled={props.setIsStrictFaceEnabled}
                        handleSceneSwapGenerate={props.handleSceneSwapGenerate}
                        handleAutoSceneSwapGenerate={props.handleAutoSceneSwapGenerate}
                        loadingMessage={props.loadingMessage}
                        numberOfImages={props.numberOfImages}
                        setNumberOfImages={props.setNumberOfImages}
                        isTwoStageSwap={props.isTwoStageSwap}
                        setIsTwoStageSwap={props.setIsTwoStageSwap}
                        isParaphrasing={props.isParaphrasing}
                        handleParaphraseSceneDescription={props.handleParaphraseSceneDescription}
                        sceneDescription={props.sceneDescription}
                        setSceneDescription={props.setSceneDescription}
                        swapStage={props.swapStage}
                        setSwapStage={props.setSwapStage}
                        handleCompleteSceneSwap={props.handleCompleteSceneSwap}
                    />
                )}

                {props.appMode === 'hairstyle' && (
                    <HairStyleMode
                        modelImage={props.originalModelImage}
                        handleModelImageUpload={props.handleModelImageUpload}
                        hairStyleImage={props.hairStyleImage}
                        setHairStyleImage={props.setHairStyleImage}
                        handleHairStyleGenerate={props.handleHairStyleGenerate}
                        loadingMessage={props.loadingMessage}
                        numberOfImages={props.numberOfImages}
                        setNumberOfImages={props.setNumberOfImages}
                    />
                )}
                
                {props.appMode === 'marketing' && (
                    <MarketingMode
                        marketingPrompt={props.marketingPrompt}
                        setMarketingPrompt={props.setMarketingPrompt}
                        marketingProductImage={props.marketingProductImage}
                        setMarketingProductImage={props.setMarketingProductImage}
                        leaveSpaceForText={props.leaveSpaceForText}
                        setLeaveSpaceForText={props.setLeaveSpaceForText}
                        handleMarketingGenerate={props.handleMarketingGenerate}
                        loadingMessage={props.loadingMessage}
                        numberOfImages={props.numberOfImages}
                        setNumberOfImages={props.setNumberOfImages}
                    />
                )}
                
                {props.generatedImage && !props.loadingMessage && (
                    <StudioPanel
                        activeStudioTab={props.activeStudioTab}
                        setActiveStudioTab={props.setActiveStudioTab}
                        editTab={props.editTab}
                        setEditTab={props.setEditTab}
                        isSelectingPoint={props.isSelectingPoint}
                        setIsSelectingPoint={props.setIsSelectingPoint}
                        selectedPoint={props.selectedPoint}
                        setSelectedPoint={props.setSelectedPoint}
                        editPrompt={props.editPrompt}
                        setEditPrompt={props.setEditPrompt}
                        handleEditImage={props.handleEditImage}
                        setIsInpainting={props.setIsInpainting}
                        accessoryPrompt={props.accessoryPrompt}
                        setAccessoryPrompt={props.setAccessoryPrompt}
                        accessoryImage={props.accessoryImage}
                        setAccessoryImage={props.setAccessoryImage}
                        handleAccessorize={props.handleAccessorize}
                        productPrompt={props.productPrompt}
                        setProductPrompt={props.setProductPrompt}
                        productImage={props.productImage}
                        setProductImage={props.setProductImage}
                        handleStageProduct={props.handleStageProduct}
                        brightness={props.brightness}
                        setBrightness={props.setBrightness}
                        contrast={props.contrast}
                        setContrast={props.setContrast}
                        grainIntensity={props.grainIntensity}
                        setGrainIntensity={props.setGrainIntensity}
                        handleMakePortrait={props.handleMakePortrait}
                        handleBackgroundChange={props.handleBackgroundChange}
                        isWatermarkEnabled={props.isWatermarkEnabled}
                        setIsWatermarkEnabled={props.setIsWatermarkEnabled}
                        bubbles={props.bubbles}
                        handleAddBubble={props.handleAddBubble}
                        handleApplyBubbles={props.handleApplyBubbles}
                        selectedBubbleId={props.selectedBubbleId}
                        setSelectedBubbleId={props.setSelectedBubbleId}
                        handleDeleteBubble={props.handleDeleteBubble}
                        selectedBubble={selectedBubble}
                        handleUpdateBubble={props.handleUpdateBubble}
                        animationPrompt={props.animationPrompt}
                        setAnimationPrompt={props.setAnimationPrompt}
                        handleAnimateImage={props.handleAnimateImage}
                        loadingMessage={props.loadingMessage}
                    />
                )}
            </div>
            
            <div className="flex-shrink-0 pt-4">
                <ActivityLog logs={props.logs} onClearLogs={() => props.setLogs([])} />
            </div>
        </div>
    );
};