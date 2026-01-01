
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../../store';
import { WebGLRenderer } from '../../engine/renderer';

const EditorCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isComparing, setIsComparing] = useState(false);
  
  const { photos, activePhotoId, activePhotoId: _ } = useStore();
  const photo = photos.find(p => p.id === activePhotoId);

  // Load and Setup WebGL
  useEffect(() => {
    if (!canvasRef.current || !photo) return;
    
    if (!rendererRef.current) {
      rendererRef.current = new WebGLRenderer(canvasRef.current);
    }

    const img = new Image();
    img.src = photo.previewUrl;
    img.onload = () => {
      if (!rendererRef.current || !canvasRef.current) return;
      
      const aspect = img.width / img.height;
      const container = containerRef.current;
      if (!container) return;

      const maxWidth = container.clientWidth;
      const maxHeight = container.clientHeight;
      
      let w = maxWidth;
      let h = maxWidth / aspect;

      if (h > maxHeight) {
        h = maxHeight;
        w = maxHeight * aspect;
      }

      canvasRef.current.width = img.width; // We use internal resolution
      canvasRef.current.height = img.height;
      canvasRef.current.style.width = `${w}px`;
      canvasRef.current.style.height = `${h}px`;

      rendererRef.current.setImage(img);
      renderFrame();
    };

    return () => {
      // Don't dispose immediately if we're just updating adjustments
    };
  }, [activePhotoId]);

  const renderFrame = useCallback(() => {
    if (!rendererRef.current || !photo || !canvasRef.current) return;
    
    const adj = isComparing ? { ...photo.adjustments, exposure: 0, contrast: 0, highlights: 0, shadows: 0, temp: 0, tint: 0, vibrance: 0, saturation: 0, texture: 0, clarity: 0, dehaze: 0, vignette: 0, grain: 0 } : photo.adjustments;
    
    rendererRef.current.render(adj, canvasRef.current.width, canvasRef.current.height);
  }, [photo, isComparing]);

  useEffect(() => {
    renderFrame();
  }, [photo?.adjustments, isComparing, renderFrame]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 relative flex items-center justify-center p-4 select-none overflow-hidden touch-none"
      onPointerDown={() => setIsComparing(true)}
      onPointerUp={() => setIsComparing(false)}
      onPointerCancel={() => setIsComparing(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas 
        ref={canvasRef} 
        className="shadow-2xl bg-zinc-900 pointer-events-none"
      />
      {isComparing && (
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs font-bold uppercase tracking-widest text-white border border-white/20">
          Original
        </div>
      )}
    </div>
  );
};

export default EditorCanvas;
