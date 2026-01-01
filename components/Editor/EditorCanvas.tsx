
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../../store';
import { WebGLRenderer } from '../../engine/renderer';

const EditorCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // States para Zoom e Pan
  const [isComparing, setIsComparing] = useState(false);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  
  const { photos, activePhotoId } = useStore();
  const photo = photos.find(p => p.id === activePhotoId);

  // Refs para controle de gestos (não causam re-render)
  // Fix: Explicitly type the Map to avoid 'unknown' type errors in event properties
  const pointers = useRef<Map<number, React.PointerEvent<HTMLDivElement>>>(new Map());
  const lastPinchDist = useRef<number>(0);
  const lastTouchTime = useRef<number>(0);
  const isDragging = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

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

      canvasRef.current.width = img.width; 
      canvasRef.current.height = img.height;
      canvasRef.current.style.width = `${w}px`;
      canvasRef.current.style.height = `${h}px`;

      rendererRef.current.setImage(img);
      renderFrame();
      
      // Reset transform ao trocar de foto
      setTransform({ scale: 1, x: 0, y: 0 });
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

  // Gestão de Eventos de Ponteiro
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.set(e.pointerId, e);
    
    // Detecção de Double Tap
    const now = Date.now();
    const timeDiff = now - lastTouchTime.current;
    if (timeDiff < 300 && pointers.current.size === 1) {
      // Toggle Zoom 1x <-> 3x
      setTransform(prev => ({
        scale: prev.scale > 1.1 ? 1 : 3,
        x: 0,
        y: 0
      }));
      lastTouchTime.current = 0;
      return;
    }
    lastTouchTime.current = now;

    if (pointers.current.size === 1) {
      isDragging.current = true;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      // Se estiver em 1x, o segurar ativa a comparação
      if (transform.scale <= 1.1) {
        setIsComparing(true);
      }
    } else if (pointers.current.size === 2) {
      setIsComparing(false);
      isDragging.current = false;
      // Fix: Cast the array to ensure properties like clientX are available to fix line 106 errors
      const pts = Array.from(pointers.current.values()) as React.PointerEvent<HTMLDivElement>[];
      lastPinchDist.current = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.set(e.pointerId, e);

    if (pointers.current.size === 1 && isDragging.current) {
      // Comparação ou Pan
      if (transform.scale > 1.1) {
        const dx = e.clientX - lastPanPos.current.x;
        const dy = e.clientY - lastPanPos.current.y;
        
        setTransform(prev => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy
        }));
        
        lastPanPos.current = { x: e.clientX, y: e.clientY };
      }
    } else if (pointers.current.size === 2) {
      // Fix: Cast the array to ensure properties like clientX are available to fix line 130 errors
      const pts = Array.from(pointers.current.values()) as React.PointerEvent<HTMLDivElement>[];
      const dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
      
      if (lastPinchDist.current > 0) {
        const delta = dist / lastPinchDist.current;
        setTransform(prev => {
          const newScale = Math.max(1, Math.min(8, prev.scale * delta));
          return { ...prev, scale: newScale };
        });
      }
      lastPinchDist.current = dist;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) {
      lastPinchDist.current = 0;
    }
    if (pointers.current.size === 0) {
      isDragging.current = false;
      setIsComparing(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 relative flex items-center justify-center p-4 select-none overflow-hidden touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div 
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transition: pointers.current.size === 0 ? 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)' : 'none',
          willChange: 'transform'
        }}
        className="relative"
      >
        <canvas 
          ref={canvasRef} 
          className="shadow-2xl bg-zinc-900 pointer-events-none"
        />
      </div>

      {isComparing && (
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white border border-white/20 z-30">
          Original
        </div>
      )}

      {transform.scale > 1.1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 border border-blue-500/20 z-30">
          Zoom {transform.scale.toFixed(1)}x
        </div>
      )}
    </div>
  );
};

export default EditorCanvas;
