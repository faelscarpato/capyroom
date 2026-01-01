
import React from 'react';
import { useStore } from '../../store';
import { EditTool, Adjustments } from '../../types';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  resetValue?: number;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, onChange, resetValue = 0 }) => {
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
        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
};

const Controls: React.FC<{ tool: EditTool }> = ({ tool }) => {
  const { activePhotoId, photos, updateAdjustments } = useStore();
  const photo = photos.find(p => p.id === activePhotoId);

  if (!photo) return null;
  const adj = photo.adjustments;

  const renderLight = () => (
    <div className="flex overflow-x-auto no-scrollbar gap-8 items-center py-2">
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
  );

  const renderColor = () => (
    <div className="flex overflow-x-auto no-scrollbar gap-8 items-center py-2">
      <div className="min-w-[160px]">
        <Slider label="Temp" value={adj.temp} min={-100} max={100} onChange={(v) => updateAdjustments({ temp: v })} />
      </div>
      <div className="min-w-[160px]">
        <Slider label="Matiz" value={adj.tint} min={-100} max={100} onChange={(v) => updateAdjustments({ tint: v })} />
      </div>
      <div className="min-w-[160px]">
        <Slider label="Vibração" value={adj.vibrance} min={-100} max={100} onChange={(v) => updateAdjustments({ vibrance: v })} />
      </div>
      <div className="min-w-[160px]">
        <Slider label="Saturação" value={adj.saturation} min={-100} max={100} onChange={(v) => updateAdjustments({ saturation: v })} />
      </div>
    </div>
  );

  const renderEffects = () => (
    <div className="flex overflow-x-auto no-scrollbar gap-8 items-center py-2">
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
    <div className="flex overflow-x-auto no-scrollbar gap-2 items-center py-2">
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
        <div className="flex items-center justify-center text-zinc-500 text-xs font-bold uppercase tracking-widest italic">
          Ferramenta {tool} em desenvolvimento
        </div>
      );
  }
};

export default Controls;
