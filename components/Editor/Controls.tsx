
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
  isBipolar?: boolean;
}

const ProSlider: React.FC<SliderProps> = ({ label, value, min, max, onChange, resetValue = 0, isBipolar = true }) => {
  const isChanged = Math.abs(value - resetValue) > 0.01;
  const handleTouchStart = (e: React.TouchEvent) => e.stopPropagation();

  return (
    <div className="flex flex-col w-full touch-none">
      <div className="flex justify-between items-center mb-1">
        <button onDoubleClick={() => onChange(resetValue)} className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isChanged ? 'text-blue-500' : 'text-zinc-500'}`}>{label}</button>
        <span className={`text-[10px] font-mono font-medium ${isChanged ? 'text-white' : 'text-zinc-600'}`}>{value > 0 && isBipolar ? `+${Math.round(value)}` : Math.round(value)}</span>
      </div>
      <div className="slider-container flex items-center h-8" onTouchStart={handleTouchStart}>
        {isBipolar && <div className="slider-center-tick" />}
        <input type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="pro-slider" onPointerDown={(e) => e.stopPropagation()} />
      </div>
    </div>
  );
};

const Controls: React.FC<{ tool: EditTool, onToolChange?: (t: EditTool) => void }> = ({ tool, onToolChange }) => {
  const { activePhotoId, photos, updateAdjustments, applyPreset } = useStore();
  const [hslMode, setHslMode] = useState<'h' | 's' | 'l'>('s');
  const [selectedHslColor, setSelectedHslColor] = useState('red');

  const photo = photos.find(p => p.id === activePhotoId);
  if (!photo) return null;
  const adj = photo.adjustments;

  const hslColors = [
    { id: 'red', hex: '#ef4444' }, { id: 'orange', hex: '#f97316' }, { id: 'yellow', hex: '#eab308' },
    { id: 'green', hex: '#22c55e' }, { id: 'aqua', hex: '#06b6d4' }, { id: 'blue', hex: '#3b82f6' },
    { id: 'purple', hex: '#a855f7' }, { id: 'magenta', hex: '#ec4899' }
  ];

  const renderColor = () => (
    <div className="flex flex-col h-full justify-center gap-4">
      <div className="flex justify-center gap-2">
        {hslColors.map(c => (
          <button 
            key={c.id} 
            onClick={() => setSelectedHslColor(c.id)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${selectedHslColor === c.id ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
      <div className="flex justify-center gap-8 mb-2">
        {['h', 's', 'l'].map(m => (
          <button 
            key={m} 
            onClick={() => setHslMode(m as any)}
            className={`text-[10px] font-black uppercase tracking-widest ${hslMode === m ? 'text-blue-500' : 'text-zinc-500'}`}
          >
            {m === 'h' ? 'Matiz' : m === 's' ? 'Satur' : 'Lumin'}
          </button>
        ))}
      </div>
      <div className="max-w-[300px] mx-auto w-full">
        <ProSlider 
          label={`${selectedHslColor.toUpperCase()} ${hslMode.toUpperCase()}`}
          value={adj.hsl[selectedHslColor][hslMode]}
          min={-100} max={100}
          onChange={(v) => {
            const newHsl = { ...adj.hsl };
            newHsl[selectedHslColor] = { ...newHsl[selectedHslColor], [hslMode]: v };
            updateAdjustments({ hsl: newHsl });
          }}
        />
      </div>
    </div>
  );

  const renderEffects = () => (
    <div className="flex gap-10 overflow-x-auto no-scrollbar pb-2">
      <div className="min-w-[160px] flex flex-col gap-2">
        <ProSlider label="Textura" value={adj.texture} min={-100} max={100} onChange={(v) => updateAdjustments({ texture: v })} />
        <ProSlider label="Claridade" value={adj.clarity} min={-100} max={100} onChange={(v) => updateAdjustments({ clarity: v })} />
      </div>
      <div className="min-w-[160px] flex flex-col gap-2">
        <ProSlider label="Desembaçar" value={adj.dehaze} min={-100} max={100} onChange={(v) => updateAdjustments({ dehaze: v })} />
        <ProSlider label="Vinheta" value={adj.vignette} min={-100} max={100} onChange={(v) => updateAdjustments({ vignette: v })} />
      </div>
      <div className="min-w-[160px] flex flex-col gap-2">
        <ProSlider label="Granulado" value={adj.grain} min={0} max={100} isBipolar={false} onChange={(v) => updateAdjustments({ grain: v })} />
      </div>
    </div>
  );

  const renderPresets = () => (
    <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
      {['VIVID', 'CINEMA', 'B&W', 'VINTAGE'].map(p => (
        <button 
          key={p} 
          onClick={() => applyPreset(p)}
          className="flex-shrink-0 w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 transition-colors group"
        >
          <div className="w-12 h-12 rounded-lg bg-zinc-800 group-hover:bg-blue-600/20 transition-colors" />
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-blue-500">{p}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-full h-full">
      {tool === EditTool.LIGHT && (
        <div className="flex gap-10 overflow-x-auto no-scrollbar pb-2">
          <div className="min-w-[140px] flex flex-col gap-2">
            <ProSlider label="Exposição" value={adj.exposure} min={-100} max={100} onChange={(v) => updateAdjustments({ exposure: v })} />
            <ProSlider label="Contraste" value={adj.contrast} min={-100} max={100} onChange={(v) => updateAdjustments({ contrast: v })} />
          </div>
          <div className="min-w-[140px] flex flex-col gap-2">
            <ProSlider label="Realces" value={adj.highlights} min={-100} max={100} onChange={(v) => updateAdjustments({ highlights: v })} />
            <ProSlider label="Sombras" value={adj.shadows} min={-100} max={100} onChange={(v) => updateAdjustments({ shadows: v })} />
          </div>
        </div>
      )}
      {tool === EditTool.COLOR && renderColor()}
      {tool === EditTool.EFFECTS && renderEffects()}
      {tool === EditTool.OPTICS && (
        <div className="flex gap-10 items-center">
          <div className="min-w-[160px]">
            <button onClick={() => updateAdjustments({ chromaticAberration: !adj.chromaticAberration })} className="flex items-center justify-between w-full group py-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${adj.chromaticAberration ? 'text-blue-500' : 'text-zinc-500'}`}>Remover Aberração</span>
            </button>
          </div>
          <div className="min-w-[200px]">
            <ProSlider label="Lente" value={adj.lensCorrection} min={-100} max={100} onChange={(v) => updateAdjustments({ lensCorrection: v })} />
          </div>
        </div>
      )}
      {tool === EditTool.GEOMETRY && (
        <div className="flex gap-10 items-center h-full">
          <div className="min-w-[200px]"><ProSlider label="Endireitar" value={adj.straighten} min={-45} max={45} onChange={(v) => updateAdjustments({ straighten: v })} /></div>
          <button onClick={() => updateAdjustments({ flipH: !adj.flipH })} className={`p-3 rounded-xl ${adj.flipH ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/></svg></button>
          <button onClick={() => updateAdjustments({ rotation: (adj.rotation + 90) % 360 })} className="p-3 rounded-xl bg-zinc-900 text-zinc-500"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15.55 5.55L11 1v4.07C7.06 5.56 4 8.93 4 13s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45z"/></svg></button>
        </div>
      )}
      {tool === EditTool.CROP && (
        <div className="flex flex-col gap-4 w-full h-full justify-center">
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {['Original', 'Livre', '1:1', '4:5', '2:3', '3:4', '9:16'].map(r => (
              <button key={r} onClick={() => updateAdjustments({ aspectRatio: r })} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase whitespace-nowrap transition-all border ${adj.aspectRatio === r ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{r}</button>
            ))}
          </div>
          <div className="flex justify-between items-center px-2">
            <button onClick={() => onToolChange?.(EditTool.LIGHT)} className="text-zinc-500 font-black uppercase text-[10px]">Cancelar</button>
            <button onClick={() => onToolChange?.(EditTool.LIGHT)} className="text-blue-500 font-black uppercase text-[10px]">Concluir</button>
          </div>
        </div>
      )}
      {tool === EditTool.PRESETS && renderPresets()}
    </div>
  );
};

export default Controls;
