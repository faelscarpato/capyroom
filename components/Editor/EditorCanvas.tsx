
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../../store';
import { WebGLRenderer } from '../../engine/renderer';
import { EditTool } from '../../types';

const EditorCanvas: React.FC<{ activeTool?: EditTool }> = ({ activeTool }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isComparing, setIsComparing] = useState(false);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  
  const { photos, activePhotoId, updateAdjustments } = useStore();
  const photo = photos.find(p => p.id === activePhotoId);

  const pointers = useRef<Map<number, {x: number, y: number}>>(new Map());
  const lastPanPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef.current || !photo) return;
    if (!rendererRef.current) rendererRef.current = new WebGLRenderer(canvasRef.current);

    const img = new Image();
    img.src = photo.previewUrl;
    img.onload = () => {
      if (!rendererRef.current || !canvasRef.current || !containerRef.current) return;
      
      const container = containerRef.current;
      const maxWidth = container.clientWidth - 40;
      const maxHeight = container.clientHeight - 40;
      
      const imgAspect = img.width / img.height;
      let w = maxWidth, h = maxWidth / imgAspect;
      if (h > maxHeight) { h = maxHeight; w = maxHeight * imgAspect; }
      
      canvasRef.current.width = img.width; 
      canvasRef.current.height = img.height;
      canvasRef.current.style.width = `${w}px`;
      canvasRef.current.style.height = `${h}px`;
      
      rendererRef.current.setImage(img);
      renderFrame();
    };
  }, [activePhotoId]);

  const renderFrame = useCallback(() => {
    if (!rendererRef.current || !photo || !canvasRef.current) return;
    // No modo CROP mostramos o preview completo para facilitar o ajuste do overlay
    const currentAdjustments = { ...photo.adjustments };
    
    // Se estiver comparando, reseta tudo exceto geometria/crop para ver o original puro
    const adj = isComparing 
      ? { ...currentAdjustments, exposure: 0, contrast: 0, highlights: 0, shadows: 0, saturation: 0, temp: 0, tint: 0, texture: 0, vibrance: 0, blacks: 0, whites: 0, clarity: 0, dehaze: 0, vignette: 0, grain: 0, lensCorrection: 0, chromaticAberration: false } 
      : currentAdjustments;

    rendererRef.current.render(adj, canvasRef.current.width, canvasRef.current.height);
  }, [photo, isComparing]);

  useEffect(() => { renderFrame(); }, [photo?.adjustments, isComparing, renderFrame]);

  const getAspectRatioValue = (ratio: string): number | null => {
    if (ratio === '1:1') return 1;
    if (ratio === '4:5') return 0.8;
    if (ratio === '2:3') return 2/3;
    if (ratio === '3:4') return 0.75;
    if (ratio === '9:16') return 9/16;
    if (ratio === 'Original' && photo) return photo.width / photo.height;
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const handle = (e.target as HTMLElement).dataset.handle;
    if (activeTool === EditTool.CROP && handle) {
      setActiveHandle(handle);
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      e.stopPropagation();
      return;
    }

    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      if (transform.scale <= 1) setIsComparing(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeHandle && photo && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = (e.clientX - lastPanPos.current.x) / rect.width;
      const dy = (e.clientY - lastPanPos.current.y) / rect.height;
      
      let { x, y, w, h } = photo.adjustments.crop;
      const minS = 0.15;
      const imgAspect = rect.width / rect.height;
      const targetRatio = getAspectRatioValue(photo.adjustments.aspectRatio);

      // Lógica de Redimensionamento do Crop
      if (activeHandle.includes('n')) {
        const nextY = Math.max(0, Math.min(y + h - minS, y + dy));
        const delta = y - nextY;
        y = nextY; h += delta;
      }
      if (activeHandle.includes('s')) {
        h = Math.max(minS, Math.min(1 - y, h + dy));
      }
      if (activeHandle.includes('w')) {
        const nextX = Math.max(0, Math.min(x + w - minS, x + dx));
        const delta = x - nextX;
        x = nextX; w += delta;
      }
      if (activeHandle.includes('e')) {
        w = Math.max(minS, Math.min(1 - x, w + dx));
      }

      // Aplicação de Aspect Ratio Fixo (se necessário)
      if (targetRatio) {
        // targetRatio = (w_px / h_px)
        // targetRatio = (w * rect.width) / (h * rect.height)
        // targetRatio = (w / h) * imgAspect
        // h = (w * imgAspect) / targetRatio
        if (activeHandle === 'e' || activeHandle === 'w') {
           h = Math.min(1 - y, (w * imgAspect) / targetRatio);
        } else if (activeHandle === 'n' || activeHandle === 's') {
           w = Math.min(1 - x, (h * targetRatio) / imgAspect);
        } else {
           // Cantos: prioriza o eixo com maior movimento ou simplifica
           h = Math.min(1 - y, (w * imgAspect) / targetRatio);
           w = (h * targetRatio) / imgAspect;
        }
      }

      updateAdjustments({ crop: { x, y, w, h } });
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (pointers.current.size === 1 && !activeHandle) {
      if (transform.scale > 1) {
        setTransform(prev => ({
          ...prev,
          x: prev.x + (e.clientX - lastPanPos.current.x),
          y: prev.y + (e.clientY - lastPanPos.current.y)
        }));
        lastPanPos.current = { x: e.clientX, y: e.clientY };
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setActiveHandle(null);
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) setIsComparing(false);
  };

  return (
    <div 
      ref={containerRef} 
      className="flex-1 relative flex items-center justify-center p-6 bg-black select-none overflow-hidden touch-none"
      onPointerDown={handlePointerDown} 
      onPointerMove={handlePointerMove} 
      onPointerUp={handlePointerUp} 
      onPointerLeave={handlePointerUp}
      onContextMenu={e => e.preventDefault()}
    >
      <div 
        style={{ 
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transition: !activeHandle && pointers.current.size === 0 ? 'transform 0.3s cubic-bezier(0.2, 1, 0.3, 1)' : 'none'
        }}
        className="relative"
      >
        <canvas ref={canvasRef} className="shadow-[0_0_120px_rgba(0,0,0,0.9)] pointer-events-none rounded-sm" />
        
        {activeTool === EditTool.CROP && photo && (
          <div 
            className="absolute z-40 touch-none group"
            style={{ 
              left: `${photo.adjustments.crop.x * 100}%`, 
              top: `${photo.adjustments.crop.y * 100}%`, 
              width: `${photo.adjustments.crop.w * 100}%`, 
              height: `${photo.adjustments.crop.h * 100}%`,
              boxShadow: '0 0 0 5000px rgba(0,0,0,0.75)'
            }}
          >
            {/* Grade de Regra dos Terços */}
            <div className="absolute inset-0 border-2 border-white/60 pointer-events-none transition-opacity">
              <div className="absolute top-1/3 w-full h-[1px] bg-white/30" />
              <div className="absolute top-2/3 w-full h-[1px] bg-white/30" />
              <div className="absolute left-1/3 h-full w-[1px] bg-white/30" />
              <div className="absolute left-2/3 h-full w-[1px] bg-white/30" />
            </div>

            {/* Alças de Toque nos Cantos (Invisíveis mas Grandes) */}
            <div data-handle="nw" className="absolute -top-4 -left-4 w-12 h-12 flex items-start justify-start p-1.5 cursor-nw-resize"><div className="w-6 h-6 border-t-4 border-l-4 border-white shadow-xl pointer-events-none rounded-tl-sm" /></div>
            <div data-handle="ne" className="absolute -top-4 -right-4 w-12 h-12 flex items-start justify-end p-1.5 cursor-ne-resize"><div className="w-6 h-6 border-t-4 border-r-4 border-white shadow-xl pointer-events-none rounded-tr-sm" /></div>
            <div data-handle="sw" className="absolute -bottom-4 -left-4 w-12 h-12 flex items-end justify-start p-1.5 cursor-sw-resize"><div className="w-6 h-6 border-b-4 border-l-4 border-white shadow-xl pointer-events-none rounded-bl-sm" /></div>
            <div data-handle="se" className="absolute -bottom-4 -right-4 w-12 h-12 flex items-end justify-end p-1.5 cursor-se-resize"><div className="w-6 h-6 border-b-4 border-r-4 border-white shadow-xl pointer-events-none rounded-br-sm" /></div>
            
            {/* Alças de Toque nas Bordas */}
            <div data-handle="n" className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-12 flex items-start justify-center p-1.5 cursor-n-resize"><div className="w-8 h-1.5 bg-white/80 rounded-full shadow-lg pointer-events-none" /></div>
            <div data-handle="s" className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-12 flex items-end justify-center p-1.5 cursor-s-resize"><div className="w-8 h-1.5 bg-white/80 rounded-full shadow-lg pointer-events-none" /></div>
            <div data-handle="w" className="absolute top-1/2 -translate-y-1/2 -left-4 w-12 h-16 flex items-center justify-start p-1.5 cursor-w-resize"><div className="h-8 w-1.5 bg-white/80 rounded-full shadow-lg pointer-events-none" /></div>
            <div data-handle="e" className="absolute top-1/2 -translate-y-1/2 -right-4 w-12 h-16 flex items-center justify-end p-1.5 cursor-e-resize"><div className="h-8 w-1.5 bg-white/80 rounded-full shadow-lg pointer-events-none" /></div>
          </div>
        )}
      </div>

      {isComparing && (
        <div className="absolute top-8 right-8 px-5 py-2.5 bg-black/70 backdrop-blur-xl rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-white/10 z-50 text-blue-500 shadow-2xl">
          Original
        </div>
      )}
    </div>
  );
};

export default EditorCanvas;
