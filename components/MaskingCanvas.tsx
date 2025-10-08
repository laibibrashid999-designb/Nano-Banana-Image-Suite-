import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';

interface MaskingCanvasProps {
  container: HTMLElement;
  imageUrl: string;
  brushSize: number;
  onMaskUpdate: (maskDataUrl: string | null) => void;
  clearTrigger: number;
}

export const MaskingCanvas: React.FC<MaskingCanvasProps> = ({
  container,
  imageUrl,
  brushSize,
  onMaskUpdate,
  clearTrigger,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update canvas dimensions to match the container/image
  useLayoutEffect(() => {
    if (!container) return;

    const updateDimensions = () => {
      // Find the image element inside the container to get its rendered size
      const imageElement = container.querySelector('img');
      if (imageElement) {
        const { clientWidth, clientHeight } = imageElement;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    // Also listen for image load, as dimensions might change
    const imgElement = container.querySelector('img');
    if (imgElement) {
      imgElement.addEventListener('load', updateDimensions);
    }

    return () => {
      resizeObserver.disconnect();
      if (imgElement) {
        imgElement.removeEventListener('load', updateDimensions);
      }
    };
  }, [container, imageUrl]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onMaskUpdate(null);
      }
    }
  };

  // Effect to clear canvas when trigger changes
  useEffect(() => {
    if (clearTrigger > 0) {
      clearCanvas();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTrigger]);

  const getPointerPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const touch = 'touches' in e ? e.touches[0] : null;

    return {
      x: (touch ? touch.clientX : (e as React.MouseEvent).clientX) - rect.left,
      y: (touch ? touch.clientY : (e as React.MouseEvent).clientY) - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    lastPoint.current = getPointerPosition(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const currentPoint = getPointerPosition(e);

    if (ctx && currentPoint && lastPoint.current) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.strokeStyle = 'rgba(246, 61, 104, 0.7)'; // Semi-transparent pink for visual feedback
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    lastPoint.current = currentPoint;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    lastPoint.current = null;
    exportMask();
  };

  const exportMask = () => {
    const visualCanvas = canvasRef.current;
    if (!visualCanvas) return;
  
    // Create an in-memory canvas to generate the black-and-white mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = visualCanvas.width;
    maskCanvas.height = visualCanvas.height;
    const maskCtx = maskCanvas.getContext('2d');
  
    if (maskCtx) {
      // Get pixel data from the visual canvas (which has a red drawing on a transparent background)
      const visualCtx = visualCanvas.getContext('2d');
      if (!visualCtx) return;
      const visualImageData = visualCtx.getImageData(0, 0, visualCanvas.width, visualCanvas.height);
      const visualData = visualImageData.data;
  
      // Create a new image data for our black-and-white mask
      const maskImageData = maskCtx.createImageData(maskCanvas.width, maskCanvas.height);
      const maskData = maskImageData.data;
  
      let hasDrawing = false;
      for (let i = 0; i < visualData.length; i += 4) {
        const alpha = visualData[i + 3]; // Check the alpha channel of the visual canvas
  
        if (alpha > 0) { // If this pixel was drawn on (it's not transparent)
          maskData[i] = 255;     // R -> White
          maskData[i + 1] = 255; // G
          maskData[i + 2] = 255; // B
          maskData[i + 3] = 255; // A -> Opaque
          hasDrawing = true;
        } else { // If this pixel was not drawn on (it's transparent)
          maskData[i] = 0;       // R -> Black
          maskData[i + 1] = 0;   // G
          maskData[i + 2] = 0;   // B
          maskData[i + 3] = 255; // A -> Opaque
        }
      }
  
      if (hasDrawing) {
        // Put the new black-and-white pixel data onto our mask canvas
        maskCtx.putImageData(maskImageData, 0, 0);
        onMaskUpdate(maskCanvas.toDataURL('image/png'));
      } else {
        onMaskUpdate(null);
      }
    }
  };


  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      className="absolute top-0 left-0 z-10 cursor-crosshair"
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        touchAction: 'none',
      }}
    />
  );
};