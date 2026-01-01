
import React, { useState, useRef } from 'react';
import { useStore } from '../../store';
import { EditTool, Adjustments } from '../../types';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  resetValue?: number;
  isBipolar?: boolean;
}

const ProSlider: React.FC<SliderProps> = ({ label, value, min, max, onChange, resetValue = 0, isBipolar = true }) => {
  const isChanged = Math.abs(value - resetValue) > 0.01;

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center mb-1">
        <button 
          onDoubleClick={() => onChange(resetValue)}
          className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isChanged ? 'text-blue-500' : 'text-zinc-500'}`}
        >
          {label}
        </button>
        <span className={`text-[10px] font-mono font-medium ${isChanged ? 'text-white' : 'text-zinc-600'}`}>
          {value > 0 && isBipolar ? `+${Math.round(value)}` : Math.round(value)}
        </span>
      </div>
      <div className="slider-container flex items-center h-8">
        {isBipolar && <div className="slider-center-tick" />}
        <input 
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="pro-slider"
        />
      </div>
    </div>
  );
};

const ToneCurve: React.FC<{ points: { x: number, y: number }[], onChange: (points: { x: number, y: number }[]) => void }> = ({ points, onChange }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const size = 120;
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
    if (draggingIdx === 0) newPoints[draggingIdx] = { x: 0, y };
    else if (draggingIdx === points.length - 1) newPoints[draggingIdx] = { x: 1, y };
    else {
      const prev = points[draggingIdx - 1].x;
      const next = points[draggingIdx + 1].x;
      newPoints[draggingIdx] = { x: Math.max(prev + 0.05, Math.min(next - 0.05, x)), y };
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
        className="w-28 h-28 bg-zinc-900/80 rounded-xl border border-zinc-800 touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDraggingIdx(null)}
        onPointerLeave={() => setDraggingIdx(null)}
      >
        <line x1={padding} y1={padding + size/2} x2={padding + size} y2={padding + size/2} stroke="#27272a" strokeWidth="1" />
        <line x1={padding + size/2} y1={padding} x2={padding + size/2} y2={padding + size} stroke="#27272a" strokeWidth="1" />
        <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => {
          const pos = getPos(p);
          return (
            <circle 
              key={i}
              cx={pos.x} cy={pos.y} r="5"
              fill={draggingIdx === i ? "#fff" : "#3b82f6"}
              className="cursor-pointer"
              onPointerDown={(e) => { e.stopPropagation(); setDraggingIdx(i); }}
            />
          );
        })}
      </svg>
      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Master Curve</span>
    </div>
  );
};

const Controls: React.FC<{ tool: EditTool }> = ({ tool }) => {
  const { activePhotoId, photos, updateAdjustments, applyAutoAdjustments } = useStore();
  const [colorTab, setColorTab] = useState<'GLOBAL' | 'MIXER'>('GLOBAL');
  const [mixerMode, setMixerMode] = useState<'h' | 's' | 'l'>('s');
  const [selectedColor, setSelectedColor] = useState<string>('red');

  const photo = photos.find(p => p.id === activePhotoId);
  if (!photo) return null;
  const adj = photo.adjustments;

  const handleHslChange = (color: string, field: 'h' | 's' | 'l', val: number) => {
    const newHsl = { ...adj.hsl };
    newHsl[color] = { ...newHsl[color], [field]: val };
    updateAdjustments({ hsl: newHsl });
  };

  const hslColors = [
    { id: 'red', color: '#ff0000', label: 'Vermelho' },
    { id: 'orange', color: '#ff8800', label: 'Laranja' },
    { id: 'yellow', color: '#ffee00', label: 'Amarelo' },
    { id: 'green', color: '#00ff00', label: 'Verde' },
    { id: 'aqua', color: '#00ffff', label: 'Aqua' },
    { id: 'blue', color: '#0066ff', label: 'Azul' },
    { id: 'purple', color: '#8800ff', label: 'Roxo' },
    { id: 'magenta', color: '#ff00ff', label: 'Magenta' },
  ];

  const renderLight = () => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-3 px-1">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ajustes de Luz</span>
        <button 
          onClick={applyAutoAdjustments}
          className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
        >
          Auto
        </button>
      </div>
      <div className="flex items-center gap-8 overflow-x-auto no-scrollbar pb-2">
        <div className="shrink-0 pl-1">
          <ToneCurve points={adj.curvePoints} onChange={(p) => updateAdjustments({ curvePoints: p })} />
        </div>
        <div className="flex gap-10">
          <div className="min-w-[140px] flex flex-col gap-2">
            <ProSlider label="Exposição" value={adj.exposure} min={-100} max={100} onChange={(v) => updateAdjustments({ exposure: v })} />
            <ProSlider label="Contraste" value={adj.contrast} min={-100} max={100} onChange={(v) => updateAdjustments({ contrast: v })} />
          </div>
          <div className="min-w-[140px] flex flex-col gap-2">
            <ProSlider label="Realces" value={adj.highlights} min={-100} max={100} onChange={(v) => updateAdjustments({ highlights: v })} />
            <ProSlider label="Sombras" value={adj.shadows} min={-100} max={100} onChange={(v) => updateAdjustments({ shadows: v })} />
          </div>
          <div className="min-w-[140px] flex flex-col gap-2">
            <ProSlider label="Brancos" value={adj.whites} min={-100} max={100} onChange={(v) => updateAdjustments({ whites: v })} />
            <ProSlider label="Pretos" value={adj.blacks} min={-100} max={100} onChange={(v) => updateAdjustments({ blacks: v })} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderColor = () => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-3 px-1">
        <div className="flex gap-4">
          <button 
            onClick={() => setColorTab('GLOBAL')} 
            className={`text-[10px] font-black uppercase tracking-widest transition-colors ${colorTab === 'GLOBAL' ? 'text-blue-500' : 'text-zinc-600'}`}
          >
            Global
          </button>
          <button 
            onClick={() => setColorTab('MIXER')} 
            className={`text-[10px] font-black uppercase tracking-widest transition-colors ${colorTab === 'MIXER' ? 'text-blue-500' : 'text-zinc-600'}`}
          >
            Misturador
          </button>
        </div>
        <button 
          onClick={applyAutoAdjustments}
          className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
        >
          Auto
        </button>
      </div>

      {colorTab === 'GLOBAL' ? (
        <div className="flex overflow-x-auto no-scrollbar gap-10 items-center py-2 h-full">
          <div className="min-w-[160px]">
            <ProSlider label="Temperatura" value={adj.temp} min={-100} max={100} onChange={(v) => updateAdjustments({ temp: v })} />
          </div>
          <div className="min-w-[160px]">
            <ProSlider label="Matiz" value={adj.tint} min={-100} max={100} onChange={(v) => updateAdjustments({ tint: v })} />
          </div>
          <div className="min-w-[160px]">
            <ProSlider label="Vibração" value={adj.vibrance} min={-100} max={100} onChange={(v) => updateAdjustments({ vibrance: v })} />
          </div>
          <div className="min-w-[160px]">
            <ProSlider label="Saturação" value={adj.saturation} min={-100} max={100} onChange={(v) => updateAdjustments({ saturation: v })} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full gap-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {hslColors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColor(c.id)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${selectedColor === c.id ? 'scale-125 border-white' : 'border-transparent scale-100'}`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
            </div>
            <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
              {(['h', 's', 'l'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMixerMode(m)}
                  className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-colors ${mixerMode === m ? 'bg-zinc-800 text-white shadow-inner' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  {m === 'h' ? 'Matiz' : m === 's' ? 'Sat' : 'Lum'}
                </button>
              ))}
            </div>
          </div>
          <div className="px-1">
            <ProSlider 
              label={`${hslColors.find(c => c.id === selectedColor)?.label} - ${mixerMode.toUpperCase()}`}
              value={adj.hsl[selectedColor][mixerMode]}
              min={-100}
              max={100}
              onChange={(v) => handleHslChange(selectedColor, mixerMode, v)}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderEffects = () => (
    <div className="flex flex-col h-full">
      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 px-1">Presença e Efeitos</span>
      <div className="flex overflow-x-auto no-scrollbar gap-10 items-center py-1">
        <div className="min-w-[140px] flex flex-col gap-2">
          <ProSlider label="Textura" value={adj.texture} min={-100} max={100} onChange={(v) => updateAdjustments({ texture: v })} />
          <ProSlider label="Claridade" value={adj.clarity} min={-100} max={100} onChange={(v) => updateAdjustments({ clarity: v })} />
        </div>
        <div className="min-w-[140px] flex flex-col gap-2">
          <ProSlider label="Desembaçar" value={adj.dehaze} min={-100} max={100} onChange={(v) => updateAdjustments({ dehaze: v })} />
          <ProSlider label="Vinheta" value={adj.vignette} min={-100} max={100} onChange={(v) => updateAdjustments({ vignette: v })} />
        </div>
        <div className="min-w-[140px]">
          <ProSlider label="Granulado" value={adj.grain} min={0} max={100} isBipolar={false} onChange={(v) => updateAdjustments({ grain: v })} />
        </div>
      </div>
    </div>
  );

  const renderPresets = () => (
    <div className="flex flex-col h-full">
      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 px-1">Looks Sugeridos</span>
      <div className="flex overflow-x-auto no-scrollbar gap-3 items-center py-1">
        {[
          { name: 'P&B Dramático', adj: { saturation: -100, contrast: 60, blacks: -30, whites: 20, grain: 20 } },
          { name: 'Sunset Warm', adj: { temp: 35, tint: 10, vibrance: 30, saturation: 10 } },
          { name: 'Cinematic Blue', adj: { temp: -20, tint: -10, shadows: 15, highlights: -10, vibrance: 25 } },
          { name: 'Urban Fade', adj: { contrast: -15, blacks: 40, texture: 30, saturation: -20 } },
          { name: 'Vintage 90s', adj: { grain: 60, texture: 40, temp: 15, tint: 5, saturation: -15, vignette: -20 } },
        ].map((preset) => (
          <button
            key={preset.name}
            onClick={() => updateAdjustments(preset.adj as any)}
            className="bg-zinc-900 hover:bg-zinc-800 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border border-zinc-800 hover:border-zinc-700 active:scale-95 active:bg-blue-600/10 active:border-blue-500/30"
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full">
      {tool === EditTool.LIGHT && renderLight()}
      {tool === EditTool.COLOR && renderColor()}
      {tool === EditTool.EFFECTS && renderEffects()}
      {tool === EditTool.PRESETS && renderPresets()}
      {![EditTool.LIGHT, EditTool.COLOR, EditTool.EFFECTS, EditTool.PRESETS].includes(tool) && (
        <div className="flex items-center justify-center text-zinc-700 text-[10px] font-black uppercase tracking-[0.2em] italic h-full">
          Em breve na CapyRoom
        </div>
      )}
    </div>
  );
};

export default Controls;
