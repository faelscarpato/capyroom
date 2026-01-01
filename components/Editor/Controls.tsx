
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { EditTool, Adjustments } from '../../types';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  resetValue?: number;
  accentClass?: string;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, onChange, resetValue = 0, accentClass = "accent-blue-500" }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-tight">
        <button onClick={() => onChange(resetValue)}>{label}</button>
        <span className={value !== resetValue ? 'text-blue-500' : ''}>{Math.round(value)}</span>
      </div>
      <input 
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer ${accentClass}`}
      />
    </div>
  );
};

const ToneCurve: React.FC<{ points: { x: number, y: number }[], onChange: (points: { x: number, y: number }[]) => void }> = ({ points, onChange }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const size = 100;
  const padding = 10;
  const viewSize = size + padding * 2;

  const getPos = (p: { x: number, y: number }) => ({
    x: padding + p.x * size,
    y: padding + (1 - p.y) * size
  });

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIdx === null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left - padding) / size));
    const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top - padding) / size));

    const newPoints = [...points];
    // Keep endpoints restricted horizontally
    if (draggingIdx === 0) newPoints[draggingIdx] = { x: 0, y };
    else if (draggingIdx === points.length - 1) newPoints[draggingIdx] = { x: 1, y };
    else {
      // Keep order
      const prev = points[draggingIdx - 1].x;
      const next = points[draggingIdx + 1].x;
      newPoints[draggingIdx] = { x: Math.max(prev + 0.01, Math.min(next - 0.01, x)), y };
    }
    onChange(newPoints);
  };

  const pathData = points.reduce((acc, p, i) => {
    const pos = getPos(p);
    return acc + (i === 0 ? `M ${pos.x} ${pos.y}` : ` L ${pos.x} ${pos.y}`);
  }, "");

  return (
    <div className="flex flex-col items-center gap-2">
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${viewSize} ${viewSize}`}
        className="w-24 h-24 bg-zinc-900/50 rounded-lg border border-zinc-800 touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDraggingIdx(null)}
        onPointerLeave={() => setDraggingIdx(null)}
      >
        {/* Grid lines */}
        <line x1={padding} y1={padding + size/2} x2={padding + size} y2={padding + size/2} stroke="#333" strokeWidth="0.5" />
        <line x1={padding + size/2} y1={padding} x2={padding + size/2} y2={padding + size} stroke="#333" strokeWidth="0.5" />
        
        <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
        
        {points.map((p, i) => {
          const pos = getPos(p);
          return (
            <circle 
              key={i}
              cx={pos.x} cy={pos.y} r="3"
              fill={draggingIdx === i ? "#fff" : "#3b82f6"}
              className="cursor-pointer"
              onPointerDown={(e) => {
                e.stopPropagation();
                setDraggingIdx(i);
              }}
            />
          );
        })}
      </svg>
      <span className="text-[8px] font-bold text-zinc-500 uppercase">Curva de Tons</span>
    </div>
  );
};

const Controls: React.FC<{ tool: EditTool }> = ({ tool }) => {
  const { activePhotoId, photos, updateAdjustments, applyAutoAdjustments } = useStore();
  const [colorMode, setColorMode] = useState<'GLOBAL' | 'MIXER'>('GLOBAL');
  const [mixerMode, setMixerMode] = useState<'H' | 'S' | 'L'>('S');
  const photo = photos.find(p => p.id === activePhotoId);

  if (!photo) return null;
  const adj = photo.adjustments;

  const handleHslChange = (color: string, field: 'h' | 's' | 'l', val: number) => {
    const newHsl = { ...adj.hsl };
    newHsl[color] = { ...newHsl[color], [field]: val };
    updateAdjustments({ hsl: newHsl });
  };

  const renderLight = () => (
    <div className="flex flex-col h-full justify-center">
      <div className="flex justify-between items-center mb-2 border-b border-zinc-900 pb-1">
        <span className="text-[10px] font-black text-zinc-500 uppercase">Luz</span>
        <button 
          onClick={applyAutoAdjustments}
          className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-sm uppercase tracking-wider hover:bg-blue-500/20 transition-colors"
        >
          Auto
        </button>
      </div>
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1">
        <div className="shrink-0">
          <ToneCurve points={adj.curvePoints} onChange={(p) => updateAdjustments({ curvePoints: p })} />
        </div>
        <div className="flex gap-8">
          <div className="min-w-[160px]">
            <Slider label="Exposição" value={adj.exposure} min={-100} max={100} onChange={(v) => updateAdjustments({ exposure: v })} />
          </div>
          <div className="min-w-[160px]">
            <Slider label="Contraste" value={adj.contrast} min={-100} max={100} onChange={(v) => updateAdjustments({ contrast: v })} />
          </div>
          <div className="min-w-[160px]">
            <Slider label="Realces" value={adj.highlights} min={-100} max={100} onChange={(v) => updateAdjustments({ highlights: v })} />
          </div>
          <div className="min-w-[160px]">
            <Slider label="Sombras" value={adj.shadows} min={-100} max={100} onChange={(v) => updateAdjustments({ shadows: v })} />
          </div>
          <div className="min-w-[160px]">
            <Slider label="Brancos" value={adj.whites} min={-100} max={100} onChange={(v) => updateAdjustments({ whites: v })} />
          </div>
          <div className="min-w-[160px]">
            <Slider label="Pretos" value={adj.blacks} min={-100} max={100} onChange={(v) => updateAdjustments({ blacks: v })} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderColor = () => {
    if (colorMode === 'GLOBAL') {
      return (
        <div className="flex flex-col h-full justify-center">
            <div className="flex justify-between items-center mb-2 border-b border-zinc-900 pb-1">
                <div className="flex gap-4">
                  <button onClick={() => setColorMode('GLOBAL')} className="text-[10px] font-black text-blue-500 uppercase">Global</button>
                  <button onClick={() => setColorMode('MIXER')} className="text-[10px] font-black text-zinc-600 uppercase">Misturador</button>
                </div>
                <button 
                  onClick={applyAutoAdjustments}
                  className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-sm uppercase tracking-wider hover:bg-blue-500/20 transition-colors"
                >
                  Auto
                </button>
            </div>
            <div className="flex overflow-x-auto no-scrollbar gap-8 items-center py-1">
                <div className="min-w-[160px]">
                    <Slider label="Temp" value={adj.temp} min={-100} max={100} onChange={(v) => updateAdjustments({ temp: v })} accentClass="accent-amber-500" />
                </div>
                <div className="min-w-[160px]">
                    <Slider label="Matiz" value={adj.tint} min={-100} max={100} onChange={(v) => updateAdjustments({ tint: v })} accentClass="accent-green-500" />
                </div>
                <div className="min-w-[160px]">
                    <Slider label="Vibração" value={adj.vibrance} min={-100} max={100} onChange={(v) => updateAdjustments({ vibrance: v })} />
                </div>
                <div className="min-w-[160px]">
                    <Slider label="Saturação" value={adj.saturation} min={-100} max={100} onChange={(v) => updateAdjustments({ saturation: v })} />
                </div>
            </div>
        </div>
      );
    }

    const colors = [
        { id: 'red', label: 'Vermelho', accent: 'accent-red-500' },
        { id: 'orange', label: 'Laranja', accent: 'accent-orange-500' },
        { id: 'yellow', label: 'Amarelo', accent: 'accent-yellow-500' },
        { id: 'green', label: 'Verde', accent: 'accent-green-500' },
        { id: 'aqua', label: 'Aqua', accent: 'accent-cyan-400' },
        { id: 'blue', label: 'Azul', accent: 'accent-blue-600' },
        { id: 'purple', label: 'Roxo', accent: 'accent-purple-600' },
        { id: 'magenta', label: 'Magenta', accent: 'accent-pink-500' },
    ];

    return (
        <div className="flex flex-col h-full justify-center">
            <div className="flex justify-between items-center mb-2 border-b border-zinc-900 pb-1">
                <div className="flex gap-4">
                    <button onClick={() => setColorMode('GLOBAL')} className="text-[10px] font-black text-zinc-600 uppercase">Global</button>
                    <button onClick={() => setColorMode('MIXER')} className="text-[10px] font-black text-blue-500 uppercase">Misturador</button>
                </div>
                <div className="flex gap-3 bg-zinc-900 px-2 py-0.5 rounded-full">
                    <button onClick={() => setMixerMode('H')} className={`text-[9px] font-bold ${mixerMode === 'H' ? 'text-white' : 'text-zinc-600'}`}>MATIZ</button>
                    <button onClick={() => setMixerMode('S')} className={`text-[9px] font-bold ${mixerMode === 'S' ? 'text-white' : 'text-zinc-600'}`}>SAT</button>
                    <button onClick={() => setMixerMode('L')} className={`text-[9px] font-bold ${mixerMode === 'L' ? 'text-white' : 'text-zinc-600'}`}>LUM</button>
                </div>
            </div>
            <div className="flex overflow-x-auto no-scrollbar gap-6 items-center py-1">
                {colors.map((c) => (
                    <div key={c.id} className="min-w-[130px]">
                        <Slider 
                            label={c.label} 
                            value={adj.hsl[c.id][mixerMode.toLowerCase() as 'h'|'s'|'l']} 
                            min={-100} 
                            max={100} 
                            onChange={(v) => handleHslChange(c.id, mixerMode.toLowerCase() as 'h'|'s'|'l', v)} 
                            accentClass={c.accent}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const renderEffects = () => (
    <div className="flex overflow-x-auto no-scrollbar gap-8 items-center py-2 h-full">
      <div className="min-w-[160px]">
        <Slider label="Textura" value={adj.texture} min={-100} max={100} onChange={(v) => updateAdjustments({ texture: v })} />
      </div>
      <div className="min-w-[160px]">
        <Slider label="Claridade" value={adj.clarity} min={-100} max={100} onChange={(v) => updateAdjustments({ clarity: v })} />
      </div>
      <div className="min-w-[160px]">
        <Slider label="Desembaçar" value={adj.dehaze} min={-100} max={100} onChange={(v) => updateAdjustments({ dehaze: v })} />
      </div>
      <div className="min-w-[160px]">
        <Slider label="Vinheta" value={adj.vignette} min={-100} max={100} onChange={(v) => updateAdjustments({ vignette: v })} />
      </div>
      <div className="min-w-[160px]">
        <Slider label="Granulado" value={adj.grain} min={0} max={100} onChange={(v) => updateAdjustments({ grain: v })} />
      </div>
    </div>
  );

  const renderPresets = () => (
    <div className="flex overflow-x-auto no-scrollbar gap-2 items-center py-2 h-full">
      {[
        { name: 'P&B Forte', adj: { saturation: -100, contrast: 40, blacks: -20, whites: 20 } },
        { name: 'Vibrant', adj: { vibrance: 50, saturation: 10, contrast: 10 } },
        { name: 'Fade', adj: { contrast: -20, blacks: 30, exposure: 10 } },
        { name: 'Cinematic', adj: { temp: 15, tint: -5, vibrance: 20, saturation: -10, vignette: -30 } },
        { name: 'Vintage', adj: { grain: 40, texture: 20, temp: 10, tint: 5, saturation: -20 } },
      ].map((preset) => (
        <button
          key={preset.name}
          onClick={() => updateAdjustments(preset.adj as any)}
          className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded text-xs font-bold uppercase whitespace-nowrap transition-colors border border-white/5"
        >
          {preset.name}
        </button>
      ))}
    </div>
  );

  switch (tool) {
    case EditTool.LIGHT: return renderLight();
    case EditTool.COLOR: return renderColor();
    case EditTool.EFFECTS: return renderEffects();
    case EditTool.PRESETS: return renderPresets();
    default:
      return (
        <div className="flex items-center justify-center text-zinc-500 text-xs font-bold uppercase tracking-widest italic h-full">
          Ferramenta {tool} em desenvolvimento
        </div>
      );
  }
};

export default Controls;
