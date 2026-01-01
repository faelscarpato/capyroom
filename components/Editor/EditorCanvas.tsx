
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

  const pointers = useRef<Map<number, React.PointerEvent<HTMLDivElement>>>(new Map());
  const lastPinchDist = useRef<number>(0);
  const isDragging = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef.current || !photo) return;
    if (!rendererRef.current) rendererRef.current = new WebGLRenderer(canvasRef.current);

    const img = new Image();
    img.src = photo.previewUrl;
    img.onload = () => {
      if (!rendererRef.current || !canvasRef.current || !containerRef.current) return;
      const aspect = img.width / img.height;
      const container = containerRef.current;
      const maxWidth = container.clientWidth - 40;
      const maxHeight = container.clientHeight - 40;
      let w = maxWidth, h = maxWidth / aspect;
      if (h > maxHeight) { h = maxHeight; w = maxHeight * aspect; }
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
    const adj = isComparing ? { ...photo.adjustments, exposure: 0, contrast: 0, highlights: 0, shadows: 0, temp: 0, tint: 0, vibrance: 0, saturation: 0, texture: 0, clarity: 0, dehaze: 0, vignette: 0, grain: 0 } : photo.adjustments;
    rendererRef.current.render(adj, canvasRef.current.width, canvasRef.current.height);
  }, [photo, isComparing]);

  useEffect(() => { renderFrame(); }, [photo?.adjustments, isComparing, renderFrame]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool === EditTool.CROP) {
      const handle = (e.target as HTMLElement).dataset.handle;
      if (handle) {
        setActiveHandle(handle);
        lastPanPos.current = { x: e.clientX, y: e.clientY };
        e.stopPropagation();
        return;
      }
    }

    pointers.current.set(e.pointerId, e);
    if (pointers.current.size === 1) {
      isDragging.current = true;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      if (transform.scale <= 1.1) setIsComparing(true);
    } else if (pointers.current.size === 2) {
      setIsComparing(false); isDragging.current = false;
      const pts = Array.from(pointers.current.values()) as React.PointerEvent<HTMLDivElement>[];
      lastPinchDist.current = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeHandle && photo && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = (e.clientX - lastPanPos.current.x) / rect.width;
      const dy = (e.clientY - lastPanPos.current.y) / rect.height;
      
      const c = { ...photo.adjustments.crop };
      if (activeHandle === 'nw') { c.x = Math.max(0, Math.min(c.x + c.w - 0.1, c.x + dx)); c.w = Math.max(0.1, c.w - dx); c.y = Math.max(0, Math.min(c.y + c.h - 0.1, c.y + dy)); c.h = Math.max(0.1, c.h - dy); }
      if (activeHandle === 'ne') { c.w = Math.max(0.1, Math.min(1 - c.x, c.w + dx)); c.y = Math.max(0, Math.min(c.y + c.h - 0.1, c.y + dy)); c.h = Math.max(0.1, c.h - dy); }
      if (activeHandle === 'sw') { c.x = Math.max(0, Math.min(c.x + c.w - 0.1, c.x + dx)); c.w = Math.max(0.1, c.w - dx); c.h = Math.max(0.1, Math.min(1 - c.y, c.h + dy)); }
      if (activeHandle === 'se') { c.w = Math.max(0.1, Math.min(1 - c.x, c.w + dx)); c.h = Math.max(0.1, Math.min(1 - c.y, c.h + dy)); }

      updateAdjustments({ crop: c });
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    pointers.current.set(e.pointerId, e);
    if (pointers.current.size === 1 && isDragging.current) {
      if (transform.scale > 1.1) {
        setTransform(prev => ({ ...prev, x: prev.x + (e.clientX - lastPanPos.current.x), y: prev.y + (e.clientY - lastPanPos.current.y) }));
        lastPanPos.current = { x: e.clientX, y: e.clientY };
      }
    } else if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values()) as React.PointerEvent<HTMLDivElement>[];
      const dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
      if (lastPinchDist.current > 0) {
        setTransform(prev => ({ ...prev, scale: Math.max(1, Math.min(8, prev.scale * (dist / lastPinchDist.current))) }));
      }
      lastPinchDist.current = dist;
    }
  };

  const handlePointerUp = () => {
    setActiveHandle(null);
    pointers.current.clear();
    isDragging.current = false;
    setIsComparing(false);
  };

  return (
    <div ref={containerRef} className="flex-1 relative flex items-center justify-center p-4 select-none overflow-hidden touch-none" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onContextMenu={e => e.preventDefault()}>
      <div 
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transition: !activeHandle && pointers.current.size === 0 ? 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)' : 'none', willChange: 'transform' }} 
        className="relative"
      >
        <canvas ref={canvasRef} className="shadow-2xl bg-zinc-900 pointer-events-none" />
        
        {activeTool === EditTool.CROP && photo && (
          <div 
            className="absolute z-40"
            style={{ 
              left: `${photo.adjustments.crop.x * 100}%`, 
              top: `${photo.adjustments.crop.y * 100}%`, 
              width: `${photo.adjustments.crop.w * 100}%`, 
              height: `${photo.adjustments.crop.h * 100}%`,
              boxShadow: '0 0 0 4000px rgba(0,0,0,0.6)'
            }}
          >
            <div className="absolute inset-0 border-2 border-white/80 pointer-events-none" />
            <div className="absolute top-1/3 w-full h-px bg-white/40 pointer-events-none" />
            <div className="absolute top-2/3 w-full h-px bg-white/40 pointer-events-none" />
            <div className="absolute left-1/3 h-full w-px bg-white/40 pointer-events-none" />
            <div className="absolute left-2/3 h-full w-px bg-white/40 pointer-events-none" />

            <div data-handle="nw" className="absolute -top-2 -left-2 w-10 h-10 flex items-start justify-start p-1 cursor-nw-resize"><div className="w-5 h-5 border-t-4 border-l-4 border-white pointer-events-none" /></div>
            <div data-handle="ne" className="absolute -top-2 -right-2 w-10 h-10 flex items-start justify-end p-1 cursor-ne-resize"><div className="w-5 h-5 border-t-4 border-r-4 border-white pointer-events-none" /></div>
            <div data-handle="sw" className="absolute -bottom-2 -left-2 w-10 h-10 flex items-end justify-start p-1 cursor-sw-resize"><div className="w-5 h-5 border-b-4 border-l-4 border-white pointer-events-none" /></div>
            <div data-handle="se" className="absolute -bottom-2 -right-2 w-10 h-10 flex items-end justify-end p-1 cursor-se-resize"><div className="w-5 h-5 border-b-4 border-r-4 border-white pointer-events-none" /></div>
          </div>
        )}
      </div>

      {isComparing && <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/20 z-30">Original</div>}
      {transform.scale > 1.1 && !isComparing && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 border border-blue-500/20 z-30">{transform.scale.toFixed(1)}x</div>}
    </div>
  );
};

export default EditorCanvas;
