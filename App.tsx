// FIX: Corrected the React import statement which was syntactically incorrect and prevented hooks from being imported.
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateStyledImage, prepareModelImage, editImage, stageProduct, restoreOriginalFace, animateImage, inpaintImage, swapScene, autoSwapScene, generateMarketingImage, tryOnHairStyle, analyzeSwapScene, generateFromSceneDescription, paraphraseDescription, generateFromSceneDescriptionSimple, generateImageFromText } from './services/geminiService';
import type { UploadedImage } from './types';
import { Header } from './components/Header';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { ExpandedImageModal } from './components/ExpandedImageModal';
import { InpaintingModal } from './components/InpaintingModal';
import { LoadingSpinner } from './components/LoadingSpinner';
import { AlertTriangleIcon, DownloadIcon, ImageIcon, SparklesIcon, UserIcon, XIcon } from './components/Icons';

const WATERMARK_URL = 'https://vectorseek.com/wp-content/uploads/2023/08/Blacked-Logo-Vector.svg-.png';
const BUBBLE_IMAGE_URL = 'https://static.vecteezy.com/system/resources/thumbnails/045/925/602/small/black-and-white-color-speech-bubble-balloon-icon-sticker-memo-keyword-planner-text-box-banner-png.png';

const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
};

export const fetchImageAsUploadedImage = async (url: string): Promise<UploadedImage> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image. Status: ${response.statusText}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        const [, type, base64] = match;
        resolve({ base64, type });
      } else {
        reject(new Error('Failed to parse data URL.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export interface Bubble {
  id: number;
  text: string;
  x: number; // %
  y: number; // %
  size: number; // % of image width
  rotation: number; // degrees
  scaleX: number; // 1 or -1
  textSize: number; // percentage of bubble width
}


// --- Inpainting Helper Functions ---

type BoundingBox = { x: number; y: number; width: number; height: number; };

/**
 * Analyzes a mask image and returns the bounding box of the non-black areas.
 */
const getMaskBoundingBox = async (maskDataUrl: string): Promise<BoundingBox | null> => {
  const img = await loadImage(maskDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
  let hasMask = false;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      // Check if pixel is not black (R, G, or B is not 0)
      if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) {
        hasMask = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (!hasMask) return null;

  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
};


/**
 * Adds padding to a bounding box, clamped to the image dimensions.
 */
const addPaddingToBox = (box: BoundingBox, imageDims: { width: number; height: number; }, padding: number): BoundingBox => {
  const newX = Math.max(0, box.x - padding);
  const newY = Math.max(0, box.y - padding);
  const newMaxX = Math.min(imageDims.width, box.x + box.width + padding);
  const newMaxY = Math.min(imageDims.height, box.y + box.height + padding);

  return {
    x: newX,
    y: newY,
    width: newMaxX - newX,
    height: newMaxY - newY,
  };
};

/**
 * Crops an image from a data URL to the specified bounding box.
 */
const cropImage = async (imageDataUrl: string, box: BoundingBox): Promise<string> => {
  const img = await loadImage(imageDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = box.width;
  canvas.height = box.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context for cropping.');
  
  ctx.drawImage(img, box.x, box.y, box.width, box.height, 0, 0, box.width, box.height);
  return canvas.toDataURL('image/png');
};

/**
 * Pastes a cropped image onto a base image at the specified coordinates.
 */
const pasteImage = async (baseImageDataUrl: string, cropDataUrl: string, box: BoundingBox): Promise<string> => {
    const [baseImg, cropImg] = await Promise.all([
        loadImage(baseImageDataUrl),
        loadImage(cropDataUrl),
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = baseImg.naturalWidth;
    canvas.height = baseImg.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context for pasting.');
    
    // Draw the original image first
    ctx.drawImage(baseImg, 0, 0);

    // Then draw the edited crop on top at the correct location
    ctx.drawImage(cropImg, box.x, box.y, box.width, box.height);

    return canvas.toDataURL('image/png');
};

// --- Generator Modal Component ---
interface GeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    prompt: string;
    setPrompt: (p: string) => void;
    onGenerate: () => void;
    isLoading: boolean;
    error: string | null;
    images: string[] | null;
    onUseAsModel: (image: string) => void;
    onDownload: (image: string) => void;
}

const GeneratorModal: React.FC<GeneratorModalProps> = ({
    isOpen, onClose, prompt, setPrompt, onGenerate, isLoading, error, images,
    onUseAsModel, onDownload
}) => {
    if (!isOpen) return null;

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="generator-modal-title">
            <div className="image-modal-backdrop" onClick={onClose}></div>
            <div className="image-modal-content">
                <div className="neo-card p-6 w-full max-w-4xl h-[80vh] flex flex-col gap-4 m-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 id="generator-modal-title" className="text-2xl font-bold flex items-center gap-2"><SparklesIcon /> Image Generation Studio</h2>
                            <p className="text-sm opacity-70 mt-1">Create a new image from a text description.</p>
                        </div>
                        <button onClick={onClose} className="neo-button neo-icon-button neo-button-secondary"><XIcon /></button>
                    </div>
                    
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                        {/* Left: Prompt & controls */}
                        <div className="flex flex-col gap-4">
                            <label htmlFor="generator-prompt" className="font-semibold">Prompt</label>
                            <textarea
                                id="generator-prompt"
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                className="neo-textarea flex-grow"
                                placeholder="A photorealistic image of..."
                            />
                            <button onClick={onGenerate} disabled={isLoading || !prompt} className="neo-button neo-button-primary">
                                <SparklesIcon /> {isLoading ? 'Generating...' : 'Generate'}
                            </button>
                        </div>

                        {/* Right: Image display */}
                        <div className="relative neo-card !shadow-none bg-[var(--nb-surface-alt)] p-2 rounded-lg flex flex-col items-center justify-center">
                            {isLoading && <LoadingSpinner message="Generating..." />}
                            {error && !isLoading && (
                                <div className="text-center text-[var(--nb-secondary)] p-4">
                                    <AlertTriangleIcon className="mx-auto mb-2" />
                                    <p className="font-semibold">Generation Failed</p>
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}
                            {!isLoading && !error && images && images.length > 0 && (
                                <div className="w-full h-full flex flex-col gap-4 p-1">
                                    <div className="flex-grow relative rounded-md overflow-hidden min-h-0">
                                        <img src={images[0]} alt="Generated image" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-4">
                                        <button onClick={() => onDownload(images[0])} className="neo-button neo-button-secondary w-full">
                                            <DownloadIcon /> Download
                                        </button>
                                        <button onClick={() => onUseAsModel(images[0])} className="neo-button neo-button-primary w-full">
                                            <UserIcon /> Use as Model
                                        </button>
                                    </div>
                                </div>
                            )}
                            {!isLoading && !error && (!images || images.length === 0) && (
                                <div className="text-center text-[var(--nb-text)] opacity-60 px-4">
                                    <ImageIcon className="mx-auto mb-4 w-16 h-16"/>
                                    <p className="font-semibold text-lg">Generated image will appear here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [modelImage, setModelImage] = useState<UploadedImage | null>(null);
  const [originalModelImage, setOriginalModelImage] = useState<UploadedImage | null>(null);
  const [clothingImage, setClothingImage] = useState<UploadedImage | null>(null);
  const [clothingText, setClothingText] = useState<string>('a black sequin mini dress');
  const [clothingImageUrl, setClothingImageUrl] = useState<string>('https://1.ohailakhan.com/cdn/shop/files/Untitleddesign-2023-11-28T105532.287_720x.jpg?v=1701149417');
  const [generatedImages, setGeneratedImages] = useState<string[] | null>(null);
  const [baseGeneratedImages, setBaseGeneratedImages] = useState<string[] | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [isPreparingModel, setIsPreparingModel] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isUrlLoading, setIsUrlLoading] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('vdr-theme') as 'light' | 'dark') || 'dark');
  const [logs, setLogs] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [showPresets, setShowPresets] = useState<boolean>(false);

  const [editPrompt, setEditPrompt] = useState<string>('');
  const [accessoryPrompt, setAccessoryPrompt] = useState<string>('');
  const [accessoryImage, setAccessoryImage] = useState<UploadedImage | null>(null);
  const [productPrompt, setProductPrompt] = useState<string>('');
  const [productImage, setProductImage] = useState<UploadedImage | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<string>('4 / 5');
  const [isFaceRestoreEnabled, setIsFaceRestoreEnabled] = useState<boolean>(false);
  const [numberOfImages, setNumberOfImages] = useState<1 | 2>(1);

  // Creative mode state
  const [isPoseLocked, setIsPoseLocked] = useState<boolean>(true);
  const [environmentImage, setEnvironmentImage] = useState<UploadedImage | null>(null);
  const [isStrictFaceEnabled, setIsStrictFaceEnabled] = useState<boolean>(false);

  // Point selection state
  const [isSelectingPoint, setIsSelectingPoint] = useState<boolean>(false);
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number } | null>(null);
  const [isSelectingPerson, setIsSelectingPerson] = useState<boolean>(false);
  const [targetPersonPoint, setTargetPersonPoint] = useState<{ x: number; y: number } | null>(null);

  const imageDisplayRef = useRef<HTMLDivElement>(null);
  const inpaintImageContainerRef = useRef<HTMLDivElement>(null);


  // Image adjustment states
  const [grainIntensity, setGrainIntensity] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);

  // Finishing touches state
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [selectedBubbleId, setSelectedBubbleId] = useState<number | null>(null);
  const bubbleIdCounter = useRef(0);
  const [bubbleImage, setBubbleImage] = useState<HTMLImageElement | null>(null);
  const [isWatermarkEnabled, setIsWatermarkEnabled] = useState<boolean>(false);
  const [dragState, setDragState] = useState<{
    id: number;
    startX: number;
    startY: number;
    bubbleStartX: number;
    bubbleStartY: number;
  } | null>(null);


  // API Key Management State
  const [apiKey] = useState<string>(process.env.API_KEY || '');
  
  // App mode state
  const [appMode, setAppMode] = useState<'tryon' | 'sceneswap' | 'marketing' | 'hairstyle'>('tryon');
  
  // Marketing Mode state
  const [marketingPrompt, setMarketingPrompt] = useState<string>('A vibrant, professional product shot of @product on a clean, minimalist background with natural lighting');
  const [marketingProductImage, setMarketingProductImage] = useState<UploadedImage | null>(null);
  const [leaveSpaceForText, setLeaveSpaceForText] = useState<boolean>(false);

  // Hair Style state
  const [hairStyleImage, setHairStyleImage] = useState<UploadedImage | null>(null);

  // Scene Swap 2-Stage state
  const [isTwoStageSwap, setIsTwoStageSwap] = useState<boolean>(false);
  const [isParaphrasing, setIsParaphrasing] = useState<boolean>(false);
  const [sceneDescription, setSceneDescription] = useState<string>('');
  const [swapStage, setSwapStage] = useState<'initial' | 'analyzed'>('initial');

  // Generator Modal State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [generatorPrompt, setGeneratorPrompt] = useState<string>('');
  const [generatorImages, setGeneratorImages] = useState<string[] | null>(null);
  const [isGeneratingInModal, setIsGeneratingInModal] = useState<boolean>(false);
  const [generatorError, setGeneratorError] = useState<string | null>(null);


  useEffect(() => {
    if (appMode !== 'sceneswap') {
      setSwapStage('initial');
      setSceneDescription('');
    }
  }, [appMode]);


  // Undo/Redo state
  const [history, setHistory] = useState<string[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  
  // UI State for new layout
  const [activeAccordion, setActiveAccordion] = useState<'model' | 'clothing' | 'style' | null>('model');
  const [activeStudioTab, setActiveStudioTab] = useState<'edit' | 'adjust' | 'effects' | 'overlays' | 'animate'>('edit');
  const [editTab, setEditTab] = useState<'creative' | 'accessory' | 'product'>('creative');
  
  // Animation state
  const [animationPrompt, setAnimationPrompt] = useState<string>('');
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  // Inpainting state
  const [isInpainting, setIsInpainting] = useState<boolean>(false);
  const [inpaintPrompt, setInpaintPrompt] = useState<string>('');
  const [inpaintBrushSize, setInpaintBrushSize] = useState<number>(40);
  const [inpaintMask, setInpaintMask] = useState<string | null>(null);
  const [clearMaskTrigger, setClearMaskTrigger] = useState<number>(0);


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const currentGeneratedImage = generatedImages?.[activeImageIndex] ?? null;

  const clearGeneratedVideo = useCallback(() => {
    if (generatedVideo) {
        URL.revokeObjectURL(generatedVideo);
        setGeneratedVideo(null);
    }
  }, [generatedVideo]);

  useEffect(() => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setBubbleImage(img);
      img.src = BUBBLE_IMAGE_URL;
  }, []);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 100));
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
    localStorage.setItem('vdr-theme', theme);
  }, [theme]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if(isExpanded) setIsExpanded(false);
        if(isGeneratorOpen) setIsGeneratorOpen(false);
        if(isSelectingPoint) setIsSelectingPoint(false);
        if(isSelectingPerson) setIsSelectingPerson(false);
        if(isInpainting) setIsInpainting(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, isGeneratorOpen, isSelectingPoint, isSelectingPerson, isInpainting]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const updateHistory = (newImages: string[]) => {
    clearGeneratedVideo();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImages);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setBaseGeneratedImages(newImages);
    setActiveImageIndex(0);
  };
  
  const resetHistory = (initialImages: string[]) => {
    clearGeneratedVideo();
    setHistory([initialImages]);
    setHistoryIndex(0);
    setBaseGeneratedImages(initialImages);
    setActiveImageIndex(0);
  };

  const handleModelImageUpload = useCallback((image: UploadedImage | null) => {
    clearGeneratedVideo();
    if (image) {
      addLog('New model image uploaded.');
      const dataUrl = `data:${image.type};base64,${image.base64}`;
      setOriginalModelImage(image);
      setModelImage(null); // Clear the prepared model image to enforce preparation step
      setActiveAccordion('clothing');
      
      const img = new Image();
      img.onload = () => {
        setImageAspectRatio(`${img.width} / ${img.height}`);
      };
      img.src = dataUrl;
      
      setBaseGeneratedImages([dataUrl]);
      setActiveImageIndex(0);
      setHistory([]);
      setHistoryIndex(-1);
      
      setEditPrompt('');
      setAccessoryPrompt('');
      setAccessoryImage(null);
      setProductPrompt('');
      setProductImage(null);
      setGrainIntensity(0);
      setBrightness(100);
      setContrast(100);
      setBubbles([]);
      setSelectedBubbleId(null);
      setIsWatermarkEnabled(false);
      setIsSelectingPoint(false);
      setSelectedPoint(null);
      setIsSelectingPerson(false);
      setTargetPersonPoint(null);

    } else {
      addLog('Model image cleared.');
      setOriginalModelImage(null);
      setModelImage(null);
      setBaseGeneratedImages(null);
      setHistory([]);
      setHistoryIndex(-1);
      setImageAspectRatio('4 / 5');
    }
  }, [addLog, clearGeneratedVideo]);

  useEffect(() => {
    if (!baseGeneratedImages || baseGeneratedImages.length === 0) {
        setGeneratedImages(null);
        return;
    }

    if (!isFaceRestoreEnabled || !originalModelImage) {
        setGeneratedImages(baseGeneratedImages);
        setLoadingMessage(null);
        return;
    }
    
    let isStale = false;
    const applyFaceRestore = async () => {
        setLoadingMessage('Finalizing details...');
        addLog('Applying face restoration...');
        setError(null);
        try {
            const finalImages = await Promise.all(
                baseGeneratedImages.map(baseImage => restoreOriginalFace(originalModelImage, baseImage))
            );
            if (!isStale) {
                setGeneratedImages(finalImages);
                addLog('Face restored successfully.');
            }
        } catch (err) {
            const errorMsg = `Failed to restore face: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
            if (!isStale) {
                setError(errorMsg);
                addLog(errorMsg);
                setGeneratedImages(baseGeneratedImages);
            }
        } finally {
            if (!isStale) {
                setLoadingMessage(null);
            }
        }
    };

    applyFaceRestore();
    
    return () => {
        isStale = true;
    };
  }, [isFaceRestoreEnabled, baseGeneratedImages, originalModelImage, addLog]);


  const handlePrepareModel = useCallback(async () => {
    if (!originalModelImage) return;
    setIsPreparingModel(true);
    const logMsg = `Preparing ${numberOfImages} model variation(s)...`;
    setLoadingMessage(logMsg);
    addLog(logMsg);
    setError(null);
    setBaseGeneratedImages(null);
    clearGeneratedVideo();
    
    try {
      const preparedImageUrls = await prepareModelImage(apiKey, originalModelImage, numberOfImages);
      setBaseGeneratedImages(preparedImageUrls); 

      // Assuming the first image determines the model image for subsequent steps
      const match = preparedImageUrls[0].match(/^data:(.+);base64,(.+)$/);
      if (match) {
        const [, type, base64] = match;
        setModelImage({ base64, type });
        addLog('Model prepared successfully.');
      } else {
        throw new Error('Failed to process the prepared image.');
      }
    } catch (err) {
      const errorMsg = `Failed to prepare model: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
      setError(errorMsg);
      addLog(errorMsg);
      setBaseGeneratedImages(null);
      setLoadingMessage(null);
    } finally {
      setIsPreparingModel(false);
      if (!isFaceRestoreEnabled || !originalModelImage) {
        setLoadingMessage(null);
      }
    }
  }, [apiKey, originalModelImage, isFaceRestoreEnabled, addLog, clearGeneratedVideo, numberOfImages]);

  const setErrorAndLog = useCallback((message: string) => {
    setError(message);
    addLog(`Error: ${message}`);
  }, [addLog]);

  const handleGenerate = useCallback(async (activeTab, clothingText, clothingImage) => {
    if (!originalModelImage) return setErrorAndLog('Please upload a model image first.');
    if (activeTab === 'text' && !clothingText) return setErrorAndLog('Please describe the clothing.');
    if (activeTab === 'image' && !clothingImage) return setErrorAndLog('Please upload or load a clothing image.');

    addLog(`Starting style generation for ${numberOfImages} image(s)...`);
    setLoadingMessage('Preparing your design...');
    setError(null);
    setBaseGeneratedImages(null);
    clearGeneratedVideo();
    try {
      const imageToGenerateFrom = modelImage || originalModelImage;

      let absolutePoint: { x: number; y: number } | null = null;
      if (targetPersonPoint) {
          const img = await loadImage(`data:${imageToGenerateFrom.type};base64,${imageToGenerateFrom.base64}`);
          absolutePoint = {
              x: Math.round((targetPersonPoint.x / 100) * img.naturalWidth),
              y: Math.round((targetPersonPoint.y / 100) * img.naturalHeight),
          };
          addLog(`Targeting person at coordinates: ${JSON.stringify(absolutePoint)}`);
      }

      const results = await generateStyledImage(
        apiKey,
        imageToGenerateFrom,
        isPoseLocked,
        activeTab === 'text' ? clothingText : undefined,
        activeTab === 'image' ? clothingImage : undefined,
        (message: string) => {
          setLoadingMessage(message);
          addLog(message);
        },
        absolutePoint,
        numberOfImages
      );
      
      resetHistory(results);
      addLog('Style generation successful.');
      setActiveAccordion(null); // Close all accordions to focus on the result
    } catch (err) {
      const errorMsg = `Generation failed: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
      setError(errorMsg);
      addLog(errorMsg);
      setLoadingMessage(null);
    }
  }, [apiKey, modelImage, originalModelImage, isPoseLocked, addLog, setErrorAndLog, targetPersonPoint, clearGeneratedVideo, numberOfImages]);
  
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageDisplayRef.current) return;

    const rect = imageDisplayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    if (isSelectingPoint) {
      setSelectedPoint({ x: xPercent, y: yPercent });
      setIsSelectingPoint(false);
    } else if (isSelectingPerson) {
      setTargetPersonPoint({ x: xPercent, y: yPercent });
      setIsSelectingPerson(false);
    }
  };

  const handleEditImage = useCallback(async () => {
    if (!baseGeneratedImages || baseGeneratedImages.length === 0 || !editPrompt) return;
    const currentImage = baseGeneratedImages[activeImageIndex];
    const logMsg = `Applying edit: "${editPrompt}"`;
    setLoadingMessage("Applying your edit...");
    addLog(logMsg);
    setError(null);
    try {
        let absolutePoint: { x: number; y: number } | null = null;
        if (selectedPoint) {
            const img = await loadImage(currentImage);
            absolutePoint = {
                x: Math.round((selectedPoint.x / 100) * img.naturalWidth),
                y: Math.round((selectedPoint.y / 100) * img.naturalHeight),
            };
        }
      const newImageUrls = await editImage(apiKey, currentImage, editPrompt, absolutePoint);
      updateHistory(newImageUrls);
      addLog('Edit applied successfully.');
    } catch (err) {
      const errorMsg = `Failed to edit image: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
      setError(errorMsg);
      addLog(errorMsg);
      setLoadingMessage(null);
    } finally {
        setIsSelectingPoint(false);
        setSelectedPoint(null);
    }
  }, [apiKey, baseGeneratedImages, activeImageIndex, editPrompt, selectedPoint, addLog, updateHistory]);
  
  const handleStageProduct = useCallback(async () => {
    if (!baseGeneratedImages || baseGeneratedImages.length === 0 || !productPrompt || (productPrompt.includes('@object') && !productImage)) return;
    const currentImage = baseGeneratedImages[activeImageIndex];
    const logMsg = "Adding product to scene...";
    setLoadingMessage(logMsg);
    addLog(logMsg);
    setError(null);
    try {
        const prompt = `Carefully edit the person in the first image to be using or holding the object from the second image, as described here: "${productPrompt.replace('@object', 'the object')}". IMPORTANT: Do not change the person's face, body shape, pose, or existing clothes. The background must also remain exactly the same. Only add the object.`;
        let newImageUrls = await stageProduct(apiKey, currentImage, productImage!, prompt);
        updateHistory(newImageUrls);
        addLog('Product staged successfully.');
        setProductPrompt('');
        setProductImage(null);
    } catch (err) {
        const errorMsg = `Failed to add product: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
        setError(errorMsg);
        addLog(errorMsg);
        setLoadingMessage(null);
    }
  }, [apiKey, baseGeneratedImages, activeImageIndex, productPrompt, productImage, addLog, updateHistory]);

  const handleBackgroundChange = useCallback(async (newBgPrompt: string) => {
    if (!baseGeneratedImages || baseGeneratedImages.length === 0) return;
    const currentImage = baseGeneratedImages[activeImageIndex];
    const logMsg = `Changing background to: "${newBgPrompt}"`;
    setLoadingMessage("Changing background...");
    addLog(logMsg);
    setError(null);
    try {
      const prompt = `Change the background to ${newBgPrompt}. IMPORTANT: Do not change the person, their face, pose, body shape, or the existing clothes. Only change the background. Maintain the original lighting on the person.`;
      let newImageUrls = await editImage(apiKey, currentImage, prompt);
      updateHistory(newImageUrls);
      addLog('Background changed successfully.');
    } catch (err) {
      const errorMsg = `Failed to change background: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
      setError(errorMsg);
      addLog(errorMsg);
      setLoadingMessage(null);
    }
  }, [apiKey, baseGeneratedImages, activeImageIndex, addLog, updateHistory]);

  const handleMakePortrait = useCallback(async () => {
    if (!baseGeneratedImages || baseGeneratedImages.length === 0) return;
    const currentImage = baseGeneratedImages[activeImageIndex];
    const logMsg = 'Adjusting composition to full-body portrait...';
    setLoadingMessage("Adjusting composition...");
    addLog(logMsg);
    setError(null);
    try {
        const prompt = `Recompose this image into a full-body portrait shot. Extend the background vertically and adjust the framing. IMPORTANT: Do not change the person, their face, pose, body shape, or the existing clothes. Only change the composition.`;
        let newImageUrls = await editImage(apiKey, currentImage, prompt);
        updateHistory(newImageUrls);
        addLog('Composition adjusted successfully.');
    } catch (err) {
      const errorMsg = `Failed to change composition: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
      setError(errorMsg);
      addLog(errorMsg);
      setLoadingMessage(null);
    }
  }, [apiKey, baseGeneratedImages, activeImageIndex, addLog, updateHistory]);

  const handleAccessorize = useCallback(async () => {
    if (!baseGeneratedImages || baseGeneratedImages.length === 0 || !accessoryPrompt) return;
    const currentImage = baseGeneratedImages[activeImageIndex];
    const useImage = accessoryPrompt.includes('@accessory') && !!accessoryImage;

    const logMsg = `Adding accessory: "${accessoryPrompt}"`;
    setLoadingMessage("Adding accessory...");
    addLog(logMsg);
    setError(null);

    try {
        let newImageUrls;
        if (useImage) {
            const prompt = `Add the accessory from the second image to the person in the first image, as described here: "${accessoryPrompt.replace('@accessory', 'the accessory')}". IMPORTANT: Do not change their face, pose, body shape, or the existing clothes. Only add the accessory described. Maintain the original background and lighting.`;
            newImageUrls = await stageProduct(apiKey, currentImage, accessoryImage!, prompt);
        } else {
            const prompt = `Add ${accessoryPrompt} to the person in the image. IMPORTANT: Do not change their face, pose, body shape, or the existing clothes. Only add the accessory described. Maintain the original background and lighting.`;
            newImageUrls = await editImage(apiKey, currentImage, prompt);
        }
        
        updateHistory(newImageUrls);
        addLog('Accessory added successfully.');
        setAccessoryPrompt('');
        setAccessoryImage(null);
    } catch (err) {
      const errorMsg = `Failed to add accessory: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
      setError(errorMsg);
      addLog(errorMsg);
      setLoadingMessage(null);
    }
  }, [apiKey, baseGeneratedImages, activeImageIndex, accessoryPrompt, accessoryImage, addLog, updateHistory]);
  
  const handleAnimateImage = useCallback(async () => {
    if (!currentGeneratedImage || !animationPrompt) return;
    
    clearGeneratedVideo();
    setError(null);
    setActiveStudioTab('animate');

    const match = currentGeneratedImage.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
        setErrorAndLog('Invalid image format for animation.');
        return;
    }
    const [, type, base64] = match;
    const imageToAnimate: UploadedImage = { base64, type };

    try {
        const videoUrl = await animateImage(apiKey, imageToAnimate, animationPrompt, (msg) => setLoadingMessage(msg));
        setGeneratedVideo(videoUrl);
        addLog('Animation generated successfully.');
        setLoadingMessage(null);
    } catch (err) {
        const errorMsg = `Failed to animate image: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
        setErrorAndLog(errorMsg);
        setLoadingMessage(null);
    }
  }, [apiKey, currentGeneratedImage, animationPrompt, addLog, setErrorAndLog, clearGeneratedVideo]);

    const handleApplyInpaint = useCallback(async () => {
        if (!currentGeneratedImage || !inpaintMask || !inpaintPrompt) {
          setErrorAndLog('Missing image, mask, or prompt for inpainting.');
          return;
        }
    
        setIsInpainting(false);
        setError(null);
    
        try {
            setLoadingMessage('Analyzing mask...');
            addLog('Finding bounding box of the mask...');
            const fullImage = await loadImage(currentGeneratedImage);
            const boundingBox = await getMaskBoundingBox(inpaintMask);

            if (!boundingBox) {
                throw new Error('Could not find a mask to inpaint. Please draw on the image.');
            }
            
            // Add padding for better context
            const paddedBox = addPaddingToBox(boundingBox, { width: fullImage.naturalWidth, height: fullImage.naturalHeight }, 50);

            setLoadingMessage('Cropping image area...');
            addLog('Cropping image and mask for API call...');

            const croppedImagePromise = cropImage(currentGeneratedImage, paddedBox);
            const croppedMaskPromise = cropImage(inpaintMask, paddedBox);
            const [croppedImage, croppedMask] = await Promise.all([croppedImagePromise, croppedMaskPromise]);
            
            setLoadingMessage('Applying your inpaint...');
            addLog(`Inpainting with prompt: "${inpaintPrompt}"`);
            
            const inpaintedCrops = await inpaintImage(apiKey, croppedImage, croppedMask, inpaintPrompt);

            setLoadingMessage('Pasting result...');
            addLog('Compositing the inpainted area back onto the original image...');
            const finalImage = await pasteImage(currentGeneratedImage, inpaintedCrops[0], paddedBox);
            
            updateHistory([finalImage]);
            addLog('Inpainting applied successfully.');

        } catch (err) {
          const errorMsg = `Inpainting failed: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
          setErrorAndLog(errorMsg);
        } finally {
          setLoadingMessage(null);
          setInpaintMask(null);
          setInpaintPrompt('');
          setClearMaskTrigger(c => c + 1);
        }
    }, [currentGeneratedImage, inpaintMask, inpaintPrompt, apiKey, addLog, setErrorAndLog, updateHistory]);


  const handleUseAsModel = useCallback(() => {
    if (!currentGeneratedImage) return;
    const match = currentGeneratedImage.match(/^data:(.+);base64,(.+)$/);
    if (match) {
      addLog('Setting generated image as new model.');
      const [, type, base64] = match;
      const newModelImage = { base64, type };
      handleModelImageUpload(newModelImage);
      setAppMode('tryon');
      setActiveAccordion('model');
    } else {
      const errorMsg = 'Could not use this image as the model. Invalid image format.';
      setError(errorMsg);
      addLog(errorMsg);
    }
  }, [currentGeneratedImage, handleModelImageUpload, addLog]);

  const handleDownload = useCallback(async () => {
    if (!currentGeneratedImage) return;
    setIsDownloading(true);
    addLog('Preparing image for download...');
    try {
        const image = await loadImage(currentGeneratedImage);

        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        
        ctx.drawImage(image, 0, 0);
        
        if (bubbleImage) {
          for (const bubble of bubbles) {
              ctx.save();
              const canvasX = (bubble.x / 100) * canvas.width;
              const canvasY = (bubble.y / 100) * canvas.height;
              ctx.translate(canvasX, canvasY);
              ctx.rotate((bubble.rotation * Math.PI) / 180);
              
              ctx.save();
              ctx.scale(bubble.scaleX, 1);
              const bubbleWidth = (bubble.size / 100) * canvas.width; 
              const bubbleHeight = bubbleWidth;
              ctx.drawImage(bubbleImage, -bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight);
              ctx.restore();
  
              ctx.fillStyle = 'black';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              const fontSize = bubbleWidth * (bubble.textSize / 100);
              ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
              
              const lines = bubble.text.split('\n');
              const lineHeight = fontSize * 1.2;
              const totalTextHeight = lines.length * lineHeight;
              const startY = -totalTextHeight / 2 + lineHeight / 2;
  
              lines.forEach((line, index) => {
                  ctx.fillText(line, 0, startY + index * lineHeight);
              });
  
              ctx.restore();
          }
        }
        
        if (isWatermarkEnabled) {
          try {
              const logoImage = await loadImage(WATERMARK_URL);
              const logoHeight = 40; 
              const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
              const padding = Math.min(canvas.width, canvas.height) * 0.025;
              const x = canvas.width - logoWidth - padding;
              const y = canvas.height - logoHeight - padding;
              ctx.drawImage(logoImage, x, y, logoWidth, logoHeight);
          } catch (logoError) {
              console.error("Failed to add watermark to download:", logoError);
              addLog("Warning: Could not add watermark to download.");
          }
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        const brightnessMultiplier = brightness / 100;
        const contrastValue = contrast - 100;
        const contrastFactor = (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));
        const grainAmount = grainIntensity * 0.8;

        for (let i = 0; i < pixels.length; i += 4) {
            let r = pixels[i];
            let g = pixels[i + 1];
            let b = pixels[i + 2];

            r *= brightnessMultiplier;
            g *= brightnessMultiplier;
            b *= brightnessMultiplier;

            r = contrastFactor * (r - 128) + 128;
            g = contrastFactor * (g - 128) + 128;
            b = contrastFactor * (b - 128) + 128;
            
            if (grainIntensity > 0) {
                const noise = (Math.random() - 0.5) * grainAmount;
                r += noise;
                g += noise;
                b += noise;
            }

            pixels[i] = Math.max(0, Math.min(255, r));
            pixels[i + 1] = Math.max(0, Math.min(255, g));
            pixels[i + 2] = Math.max(0, Math.min(255, b));
        }
        ctx.putImageData(imageData, 0, 0);

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'styled-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addLog('Download started.');
    } catch (err) {
        const errorMsg = `Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setErrorAndLog(errorMsg);
    } finally {
        setIsDownloading(false);
    }
  }, [addLog, brightness, bubbleImage, bubbles, contrast, currentGeneratedImage, grainIntensity, isWatermarkEnabled, setErrorAndLog]);
  
  const handleVideoDownload = useCallback(async () => {
    if (!generatedVideo) return;
    setIsDownloading(true);
    addLog('Preparing video for download...');
    try {
        const link = document.createElement('a');
        link.href = generatedVideo;
        link.download = 'animation.mp4';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addLog('Video download started.');
    } catch (err) {
        const errorMsg = `Download failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setErrorAndLog(errorMsg);
    } finally {
        setIsDownloading(false);
    }
  }, [generatedVideo, addLog, setErrorAndLog]);

  const handlePrimaryDownload = useCallback(() => {
    if (generatedVideo) {
        handleVideoDownload();
    } else if (currentGeneratedImage) {
        handleDownload();
    }
  }, [generatedVideo, currentGeneratedImage, handleVideoDownload, handleDownload]);

  const handleSceneSwapGenerate = useCallback(async () => {
    if (!originalModelImage || !environmentImage) {
        return setErrorAndLog('Please upload both a model and a target scene image.');
    }
    clearGeneratedVideo();
    addLog(`Starting scene swap for ${numberOfImages} image(s)...`);
    setLoadingMessage('Initializing scene swap...');
    setError(null);
    setBaseGeneratedImages(null);
    setSwapStage('initial');

    if (isTwoStageSwap) {
        // Stage 1: Analyze the scene
        try {
            const description = await analyzeSwapScene(
                apiKey,
                environmentImage,
                (message: string) => {
                    setLoadingMessage(message);
                    addLog(message);
                }
            );

            setSceneDescription(description);
            setSwapStage('analyzed');
            addLog('Scene analysis successful.');
        } catch (err) {
            const errorMsg = `Scene analysis failed: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
            setErrorAndLog(errorMsg);
        } finally {
            setLoadingMessage(null);
        }
    } else {
        // One-shot generation
        try {
            const results = await swapScene(
                apiKey,
                originalModelImage,
                environmentImage,
                isStrictFaceEnabled,
                numberOfImages,
                (message: string) => {
                    setLoadingMessage(message);
                    addLog(message);
                }
            );
            resetHistory(results);
            addLog('Scene swap successful.');
        } catch (err) {
            const errorMsg = `Scene swap failed: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
            setErrorAndLog(errorMsg);
            setLoadingMessage(null);
        }
    }
}, [apiKey, originalModelImage, environmentImage, isStrictFaceEnabled, isTwoStageSwap, addLog, setErrorAndLog, clearGeneratedVideo, numberOfImages]);

const handleAutoSceneSwapGenerate = useCallback(async () => {
    if (!originalModelImage || !environmentImage) {
        return setErrorAndLog('Please upload both a model and a target scene image.');
    }
    clearGeneratedVideo();
    addLog(`Starting creative auto-swap for ${numberOfImages} image(s)...`);
    setLoadingMessage('Initializing creative swap...');
    setError(null);
    setBaseGeneratedImages(null);
    setSwapStage('initial');

    try {
        const results = await autoSwapScene(
            apiKey,
            originalModelImage,
            environmentImage,
            isStrictFaceEnabled,
            numberOfImages,
            (message: string) => {
                setLoadingMessage(message);
                addLog(message);
            }
        );
        resetHistory(results);
        addLog('Creative auto-swap successful.');
    } catch (err) {
        const errorMsg = `Creative auto-swap failed: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
        setErrorAndLog(errorMsg);
        setLoadingMessage(null);
    }
}, [apiKey, originalModelImage, environmentImage, isStrictFaceEnabled, addLog, setErrorAndLog, clearGeneratedVideo, numberOfImages]);

const handleParaphraseSceneDescription = useCallback(async () => {
    if (!sceneDescription) return;
    setIsParaphrasing(true);
    setError(null);
    addLog('Rephrasing scene analysis...');
    try {
        const paraphrased = await paraphraseDescription(apiKey, sceneDescription);
        setSceneDescription(paraphrased);
        addLog('Rephrasing successful.');
    } catch (err) {
        const errorMsg = `Paraphrasing failed: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
        setErrorAndLog(errorMsg);
    } finally {
        setIsParaphrasing(false);
    }
}, [apiKey, sceneDescription, addLog, setErrorAndLog]);

const handleCompleteSceneSwap = useCallback(async () => {
    if (!originalModelImage || !sceneDescription || !environmentImage) {
        return setErrorAndLog('Missing model image, environment image, or scene description for final generation.');
    }
    clearGeneratedVideo();
    addLog(`Completing scene swap generation for ${numberOfImages} image(s)...`);
    setLoadingMessage('Placing model into scene...');
    setError(null);
    setBaseGeneratedImages(null);

    try {
        const results = await generateFromSceneDescriptionSimple(
            apiKey,
            originalModelImage,
            sceneDescription, // Use the (potentially edited) description from state
            isStrictFaceEnabled,
            numberOfImages,
            (message: string) => {
                setLoadingMessage(message);
                addLog(message);
            },
            environmentImage
        );
        resetHistory(results);
        addLog('Scene swap successful.');
    } catch (err) {
        const errorMsg = `Scene swap failed: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
        setErrorAndLog(errorMsg);
    } finally {
        setLoadingMessage(null);
        setSwapStage('initial');
        setSceneDescription('');
    }
}, [apiKey, originalModelImage, sceneDescription, isStrictFaceEnabled, numberOfImages, addLog, setErrorAndLog, clearGeneratedVideo, environmentImage]);
  
  const handleMarketingGenerate = useCallback(async () => {
    if (!marketingPrompt || (marketingPrompt.includes('@product') && !marketingProductImage)) {
        return setErrorAndLog('Please provide a prompt and a product image if required.');
    }
    clearGeneratedVideo();
    addLog(`Starting marketing image generation for ${numberOfImages} image(s)...`);
    setLoadingMessage('Generating your campaign...');
    setError(null);
    setBaseGeneratedImages(null);

    try {
        const results = await generateMarketingImage(
            apiKey,
            marketingPrompt,
            marketingProductImage,
            leaveSpaceForText,
            numberOfImages,
        );
        resetHistory(results);
        addLog('Marketing image generated successfully.');
    } catch (err) {
        const errorMsg = `Marketing image generation failed: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
        setErrorAndLog(errorMsg);
        setLoadingMessage(null);
    }
  }, [apiKey, marketingPrompt, marketingProductImage, leaveSpaceForText, addLog, setErrorAndLog, clearGeneratedVideo, numberOfImages]);

  const handleHairStyleGenerate = useCallback(async () => {
    if (!originalModelImage || !hairStyleImage) {
        return setErrorAndLog('Please upload both a model and a hairstyle image.');
    }
    clearGeneratedVideo();
    addLog(`Starting hair style generation for ${numberOfImages} image(s)...`);
    setLoadingMessage('Analyzing hairstyle...');
    setError(null);
    setBaseGeneratedImages(null);

    try {
        const results = await tryOnHairStyle(
            apiKey,
            originalModelImage,
            hairStyleImage,
            numberOfImages,
            (message: string) => {
                setLoadingMessage(message);
                addLog(message);
            }
        );
        resetHistory(results);
        addLog('Hair style generation successful.');
    } catch (err) {
        const errorMsg = `Hair style generation failed: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
        setErrorAndLog(errorMsg);
        setLoadingMessage(null);
    }
  }, [apiKey, originalModelImage, hairStyleImage, addLog, setErrorAndLog, clearGeneratedVideo, numberOfImages]);


  const handleAddBubble = () => {
    const newId = bubbleIdCounter.current++;
    const newBubble: Bubble = {
        id: newId,
        text: 'Your text here',
        x: 50,
        y: 30,
        size: 40,
        rotation: 0,
        scaleX: 1,
        textSize: 15,
    };
    setBubbles(prev => [...prev, newBubble]);
    setSelectedBubbleId(newId);
  };

  const handleUpdateBubble = useCallback((id: number, updates: Partial<Bubble>) => {
      setBubbles(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const handleDeleteBubble = (id: number) => {
      setBubbles(prev => prev.filter(b => b.id !== id));
      if (selectedBubbleId === id) {
          setSelectedBubbleId(null);
      }
  };
  
    const handleApplyBubbles = useCallback(async () => {
        if (!currentGeneratedImage || bubbles.length === 0 || !bubbleImage) return;

        setLoadingMessage('Applying bubbles...');
        
        try {
            const image = await loadImage(currentGeneratedImage);
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');
            
            ctx.drawImage(image, 0, 0);
            
            for (const bubble of bubbles) {
                ctx.save();
                const canvasX = (bubble.x / 100) * canvas.width;
                const canvasY = (bubble.y / 100) * canvas.height;
                ctx.translate(canvasX, canvasY);
                ctx.rotate((bubble.rotation * Math.PI) / 180);
                
                ctx.save();
                ctx.scale(bubble.scaleX, 1);
                const bubbleWidth = (bubble.size / 100) * canvas.width; 
                const bubbleHeight = bubbleWidth;
                ctx.drawImage(bubbleImage, -bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight);
                ctx.restore();

                ctx.fillStyle = 'black';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                const fontSize = bubbleWidth * (bubble.textSize / 100);
                ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
                
                const lines = bubble.text.split('\n');
                const lineHeight = fontSize * 1.2;
                const totalTextHeight = lines.length * lineHeight;
                const startY = -totalTextHeight / 2 + lineHeight / 2;

                lines.forEach((line, index) => {
                    ctx.fillText(line, 0, startY + index * lineHeight);
                });

                ctx.restore();
            }

            const newDataUrl = canvas.toDataURL('image/png');
            updateHistory([newDataUrl]);
            setBubbles([]);
            setSelectedBubbleId(null);
            addLog('Bubbles applied to image.');

        } catch (err) {
            const errorMsg = `Failed to apply bubbles: ${err instanceof Error ? err.message : 'An unknown error'}`;
            setErrorAndLog(errorMsg);
        } finally {
            setLoadingMessage(null);
        }
    }, [currentGeneratedImage, bubbles, bubbleImage, addLog, setErrorAndLog, updateHistory]);

  const handleBubbleMouseDown = (e: React.MouseEvent, bubbleId: number) => {
    e.preventDefault();
    e.stopPropagation();

    const bubble = bubbles.find(b => b.id === bubbleId);
    if (!bubble) return;

    setSelectedBubbleId(bubbleId);

    setDragState({
        id: bubbleId,
        startX: e.clientX,
        startY: e.clientY,
        bubbleStartX: bubble.x,
        bubbleStartY: bubble.y,
    });
  };
  
  const handleBubbleTouchStart = (e: React.TouchEvent, bubbleId: number) => {
    e.stopPropagation();

    if (e.touches.length === 0) return;
    
    const bubble = bubbles.find(b => b.id === bubbleId);
    if (!bubble) return;

    setSelectedBubbleId(bubbleId);

    setDragState({
        id: bubbleId,
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        bubbleStartX: bubble.x,
        bubbleStartY: bubble.y,
    });
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!dragState || !imageDisplayRef.current) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const dx = clientX - dragState.startX;
        const dy = clientY - dragState.startY;

        const { width, height } = imageDisplayRef.current.getBoundingClientRect();
        
        if (width === 0 || height === 0) return;

        const dxPercent = (dx / width) * 100;
        const dyPercent = (dy / height) * 100;

        const newX = dragState.bubbleStartX + dxPercent;
        const newY = dragState.bubbleStartY + dyPercent;

        handleUpdateBubble(dragState.id, { 
            x: Math.max(0, Math.min(100, newX)),
            y: Math.max(0, Math.min(100, newY)),
        });
    };

    const handleEnd = () => {
        setDragState(null);
    };

    if (dragState) {
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', handleEnd);
    }

    return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
    };
  }, [dragState, handleUpdateBubble]);

  const handleUndo = () => {
    if (canUndo) {
        clearGeneratedVideo();
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setBaseGeneratedImages(history[newIndex]);
        setActiveImageIndex(0);
        addLog('Action undone.');
    }
  };

  const handleRedo = () => {
    if (canRedo) {
        clearGeneratedVideo();
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setBaseGeneratedImages(history[newIndex]);
        setActiveImageIndex(0);
        addLog('Action redone.');
    }
  };

  const dataUrlToUploadedImage = (dataUrl: string): UploadedImage | null => {
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (match) {
        const [, type, base64] = match;
        return { base64, type };
    }
    return null;
  }

  const handleGenerateInModal = useCallback(async () => {
      if (!generatorPrompt) return;

      addLog(`Generating image from prompt: "${generatorPrompt}"`);
      setIsGeneratingInModal(true);
      setGeneratorError(null);
      setGeneratorImages(null);
      
      try {
          const results = await generateImageFromText(apiKey, generatorPrompt, 1);
          setGeneratorImages(results);
          addLog('Modal image generation successful.');
      } catch (err) {
          const errorMsg = `Generation failed: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`;
          setGeneratorError(errorMsg);
          addLog(errorMsg);
      } finally {
          setIsGeneratingInModal(false);
      }
  }, [apiKey, generatorPrompt, addLog]);

  const handleDownloadGeneratedImage = useCallback((imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'generated-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog('Downloaded generated image from modal.');
  }, [addLog]);


  const handleUseGeneratedAsModel = useCallback((image: string) => {
      const uploadedImage = dataUrlToUploadedImage(image);
      if (uploadedImage) {
          handleModelImageUpload(uploadedImage);
          setIsGeneratorOpen(false);
          addLog('Used generated image as new model.');
      } else {
          setErrorAndLog('Failed to process generated image.');
      }
  }, [handleModelImageUpload, addLog, setErrorAndLog]);

  const handleOpenGenerator = () => {
      setGeneratorImages(null);
      setGeneratorError(null);
      setIsGeneratorOpen(true);
  }

  return (
    <div className="min-h-screen font-sans flex flex-col items-center p-4 sm:p-6">
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onOpenGenerator={handleOpenGenerator}
      />
      
      <main className="w-full grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-6 lg:h-[calc(100vh-140px)]">
        <LeftPanel
            appMode={appMode}
            setAppMode={setAppMode}
            generatedImage={currentGeneratedImage}
            loadingMessage={loadingMessage}
            activeAccordion={activeAccordion}
            setActiveAccordion={setActiveAccordion}
            originalModelImage={originalModelImage}
            handleModelImageUpload={handleModelImageUpload}
            isFaceRestoreEnabled={isFaceRestoreEnabled}
            setIsFaceRestoreEnabled={setIsFaceRestoreEnabled}
            isSelectingPerson={isSelectingPerson}
            setIsSelectingPerson={setIsSelectingPerson}
            targetPersonPoint={targetPersonPoint}
            setTargetPersonPoint={setTargetPersonPoint}
            modelImage={modelImage}
            clothingImage={clothingImage}
            setClothingImage={setClothingImage}
            clothingText={clothingText}
            setClothingText={setClothingText}
            clothingImageUrl={clothingImageUrl}
            setClothingImageUrl={setClothingImageUrl}
            isUrlLoading={isUrlLoading}
            setIsUrlLoading={setIsUrlLoading}
            addLog={addLog}
            setError={setError}
            showPresets={showPresets}
            setShowPresets={setShowPresets}
            isPoseLocked={isPoseLocked}
            setIsPoseLocked={setIsPoseLocked}
            handleGenerate={handleGenerate}
            isPreparingModel={isPreparingModel}
            handlePrepareModel={handlePrepareModel}
            environmentImage={environmentImage}
            setEnvironmentImage={setEnvironmentImage}
            isStrictFaceEnabled={isStrictFaceEnabled}
            setIsStrictFaceEnabled={setIsStrictFaceEnabled}
            handleSceneSwapGenerate={handleSceneSwapGenerate}
            handleAutoSceneSwapGenerate={handleAutoSceneSwapGenerate}
            hairStyleImage={hairStyleImage}
            setHairStyleImage={setHairStyleImage}
            handleHairStyleGenerate={handleHairStyleGenerate}
            marketingPrompt={marketingPrompt}
            setMarketingPrompt={setMarketingPrompt}
            marketingProductImage={marketingProductImage}
            setMarketingProductImage={setMarketingProductImage}
            leaveSpaceForText={leaveSpaceForText}
            setLeaveSpaceForText={setLeaveSpaceForText}
            handleMarketingGenerate={handleMarketingGenerate}
            numberOfImages={numberOfImages}
            setNumberOfImages={setNumberOfImages}
            isTwoStageSwap={isTwoStageSwap}
            setIsTwoStageSwap={setIsTwoStageSwap}
            isParaphrasing={isParaphrasing}
            handleParaphraseSceneDescription={handleParaphraseSceneDescription}
            sceneDescription={sceneDescription}
            setSceneDescription={setSceneDescription}
            swapStage={swapStage}
            setSwapStage={setSwapStage}
            handleCompleteSceneSwap={handleCompleteSceneSwap}
            activeStudioTab={activeStudioTab}
            setActiveStudioTab={setActiveStudioTab}
            editTab={editTab}
            setEditTab={setEditTab}
            editPrompt={editPrompt}
            setEditPrompt={setEditPrompt}
            isSelectingPoint={isSelectingPoint}
            setIsSelectingPoint={setIsSelectingPoint}
            selectedPoint={selectedPoint}
            setSelectedPoint={setSelectedPoint}
            handleEditImage={handleEditImage}
            setIsInpainting={setIsInpainting}
            accessoryPrompt={accessoryPrompt}
            setAccessoryPrompt={setAccessoryPrompt}
            accessoryImage={accessoryImage}
            setAccessoryImage={setAccessoryImage}
            handleAccessorize={handleAccessorize}
            productPrompt={productPrompt}
            setProductPrompt={setProductPrompt}
            productImage={productImage}
            setProductImage={setProductImage}
            handleStageProduct={handleStageProduct}
            brightness={brightness}
            setBrightness={setBrightness}
            contrast={contrast}
            setContrast={setContrast}
            grainIntensity={grainIntensity}
            setGrainIntensity={setGrainIntensity}
            handleMakePortrait={handleMakePortrait}
            handleBackgroundChange={handleBackgroundChange}
            isWatermarkEnabled={isWatermarkEnabled}
            setIsWatermarkEnabled={setIsWatermarkEnabled}
            bubbles={bubbles}
            handleAddBubble={handleAddBubble}
            handleApplyBubbles={handleApplyBubbles}
            selectedBubbleId={selectedBubbleId}
            setSelectedBubbleId={setSelectedBubbleId}
            handleDeleteBubble={handleDeleteBubble}
            handleUpdateBubble={handleUpdateBubble}
            animationPrompt={animationPrompt}
            setAnimationPrompt={setAnimationPrompt}
            handleAnimateImage={handleAnimateImage}
            logs={logs}
            setLogs={setLogs}
        />

        <RightPanel
            generatedImages={generatedImages}
            activeImageIndex={activeImageIndex}
            setActiveImageIndex={setActiveImageIndex}
            generatedVideo={generatedVideo}
            loadingMessage={loadingMessage}
            error={error}
            canUndo={canUndo}
            handleUndo={handleUndo}
            canRedo={canRedo}
            handleRedo={handleRedo}
            handleUseAsModel={handleUseAsModel}
            handlePrimaryDownload={handlePrimaryDownload}
            isDownloading={isDownloading}
            imageDisplayRef={imageDisplayRef}
            imageAspectRatio={imageAspectRatio}
            handleImageClick={handleImageClick}
            isSelectingPoint={isSelectingPoint}
            isSelectingPerson={isSelectingPerson}
            brightness={brightness}
            contrast={contrast}
            grainIntensity={grainIntensity}
            selectedPoint={selectedPoint}
            targetPersonPoint={targetPersonPoint}
            bubbles={bubbles}
            handleBubbleMouseDown={handleBubbleMouseDown}
            handleBubbleTouchStart={handleBubbleTouchStart}
            dragState={dragState}
            setSelectedBubbleId={setSelectedBubbleId}
            selectedBubbleId={selectedBubbleId}
            isWatermarkEnabled={isWatermarkEnabled}
            setIsExpanded={setIsExpanded}
        />
      </main>

      <ExpandedImageModal
        isOpen={isExpanded && !!currentGeneratedImage && !generatedVideo}
        onClose={() => setIsExpanded(false)}
        generatedImage={currentGeneratedImage}
        brightness={brightness}
        contrast={contrast}
        grainIntensity={grainIntensity}
        bubbles={bubbles}
        isWatermarkEnabled={isWatermarkEnabled}
        bubbleImageUrl={BUBBLE_IMAGE_URL}
        watermarkUrl={WATERMARK_URL}
      />

      <InpaintingModal
        isOpen={isInpainting && !!currentGeneratedImage}
        onClose={() => setIsInpainting(false)}
        generatedImage={currentGeneratedImage}
        inpaintImageContainerRef={inpaintImageContainerRef}
        inpaintBrushSize={inpaintBrushSize}
        setInpaintBrushSize={setInpaintBrushSize}
        inpaintMask={inpaintMask}
        setInpaintMask={setInpaintMask}
        clearMaskTrigger={clearMaskTrigger}
        inpaintPrompt={inpaintPrompt}
        setInpaintPrompt={setInpaintPrompt}
        handleApplyInpaint={handleApplyInpaint}
        loadingMessage={loadingMessage}
        setClearMaskTrigger={setClearMaskTrigger}
      />

      <GeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        prompt={generatorPrompt}
        setPrompt={setGeneratorPrompt}
        onGenerate={handleGenerateInModal}
        isLoading={isGeneratingInModal}
        error={generatorError}
        images={generatorImages}
        onUseAsModel={handleUseGeneratedAsModel}
        onDownload={handleDownloadGeneratedImage}
      />
    </div>
  );
};

export default App;