
import React, { useState } from 'react';
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

const Controls: React.FC<{ tool: EditTool }> = ({ tool }) => {
  const { activePhotoId, photos, updateAdjustments } = useStore();
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
    <div className="flex overflow-x-auto no-scrollbar gap-8 items-center py-2 h-full">
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

  const renderColor = () => {
    if (colorMode === 'GLOBAL') {
      return (
        <div className="flex flex-col h-full justify-center">
            <div className="flex gap-4 mb-3 border-b border-zinc-900 pb-2">
                <button onClick={() => setColorMode('GLOBAL')} className="text-[10px] font-black text-blue-500 uppercase">Global</button>
                <button onClick={() => setColorMode('MIXER')} className="text-[10px] font-black text-zinc-600 uppercase">Misturador</button>
            </div>
            <div className="flex overflow-x-auto no-scrollbar gap-8 items-center">
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
