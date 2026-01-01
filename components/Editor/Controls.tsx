
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

const SliderRow: React.FC<SliderProps> = ({ label, value, min, max, onChange, resetValue = 0, isBipolar = true }) => {
  const isChanged = Math.abs(value - resetValue) > 0.01;

  // Garantir que o toque capture o ponteiro e impeça o scroll lateral do container pai
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="flex flex-col w-full px-5 py-3 border-b border-zinc-900/40 select-none">
      <div className="flex justify-between items-center mb-1">
        <button 
          onDoubleClick={() => onChange(resetValue)}
          className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isChanged ? 'text-blue-500' : 'text-zinc-500'}`}
        >
          {label}
        </button>
        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-mono tabular-nums font-bold ${isChanged ? 'text-white' : 'text-zinc-700'}`}>
            {value > 0 && isBipolar ? `+${Math.round(value)}` : Math.round(value)}
          </span>
          <button 
            onClick={() => onChange(resetValue)}
            className={`p-1.5 rounded-full transition-all active:scale-90 ${isChanged ? 'opacity-100 bg-zinc-900 text-zinc-400' : 'opacity-0 pointer-events-none'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      <div className="relative flex items-center h-12 touch-none">
        {isBipolar && (
          <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-3 bg-zinc-800 rounded-full pointer-events-none" />
        )}
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={1} 
          value={value} 
          onChange={(e) => onChange(parseFloat(e.target.value))} 
          onPointerDown={handlePointerDown}
          className="pro-slider-enhanced w-full"
        />
      </div>
    </div>
  );
};

const Controls: React.FC<{ tool: EditTool, onToolChange?: (t: EditTool) => void }> = ({ tool, onToolChange }) => {
  const { activePhotoId, photos, updateAdjustments, applyPreset } = useStore();
  const [hslMode, setHslMode] = useState<'h' | 's' | 'l'>('s');
  const [selectedColor, setSelectedColor] = useState('red');

  const photo = photos.find(p => p.id === activePhotoId);
  if (!photo) return null;
  const adj = photo.adjustments;

  const hslColors = [
    { id: 'red', hex: '#ef4444' }, { id: 'orange', hex: '#f97316' }, { id: 'yellow', hex: '#eab308' },
    { id: 'green', hex: '#22c55e' }, { id: 'aqua', hex: '#06b6d4' }, { id: 'blue', hex: '#3b82f6' },
    { id: 'purple', hex: '#a855f7' }, { id: 'magenta', hex: '#ec4899' }
  ];

  return (
    <div className="flex flex-col h-full bg-black overflow-y-auto no-scrollbar overscroll-contain pb-10">
      {tool === EditTool.LIGHT && (
        <>
          <SliderRow label="Exposição" value={adj.exposure} min={-100} max={100} onChange={(v) => updateAdjustments({ exposure: v })} />
          <SliderRow label="Contraste" value={adj.contrast} min={-100} max={100} onChange={(v) => updateAdjustments({ contrast: v })} />
          <SliderRow label="Realces" value={adj.highlights} min={-100} max={100} onChange={(v) => updateAdjustments({ highlights: v })} />
          <SliderRow label="Sombras" value={adj.shadows} min={-100} max={100} onChange={(v) => updateAdjustments({ shadows: v })} />
          <SliderRow label="Brancos" value={adj.whites} min={-100} max={100} onChange={(v) => updateAdjustments({ whites: v })} />
          <SliderRow label="Pretos" value={adj.blacks} min={-100} max={100} onChange={(v) => updateAdjustments({ blacks: v })} />
        </>
      )}

      {tool === EditTool.COLOR && (
        <div className="flex flex-col">
          <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md p-4 border-b border-zinc-900">
            <div className="flex justify-between items-center mb-6">
               <div className="flex gap-1.5">
                 {['h', 's', 'l'].map(m => (
                   <button key={m} onClick={() => setHslMode(m as any)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors ${hslMode === m ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
                     {m === 'h' ? 'Matiz' : m === 's' ? 'Satur' : 'Lumin'}
                   </button>
                 ))}
               </div>
            </div>
            <div className="flex justify-between items-center px-2">
              {hslColors.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => setSelectedColor(c.id)}
                  className={`w-7 h-7 rounded-full border-2 transition-all active:scale-125 ${selectedColor === c.id ? 'border-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'border-transparent opacity-40'}`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
          <SliderRow 
            label={`${selectedColor} ${hslMode === 'h' ? 'Matiz' : hslMode === 's' ? 'Saturação' : 'Luminância'}`}
            value={adj.hsl[selectedColor][hslMode]}
            min={-100} max={100}
            onChange={(v) => {
              const newHsl = { ...adj.hsl };
              newHsl[selectedColor] = { ...newHsl[selectedColor], [hslMode]: v };
              updateAdjustments({ hsl: newHsl });
            }}
          />
          <SliderRow label="Temperatura" value={adj.temp} min={-100} max={100} onChange={(v) => updateAdjustments({ temp: v })} />
          <SliderRow label="Matiz" value={adj.tint} min={-100} max={100} onChange={(v) => updateAdjustments({ tint: v })} />
          <SliderRow label="Vibração" value={adj.vibrance} min={-100} max={100} onChange={(v) => updateAdjustments({ vibrance: v })} />
          <SliderRow label="Saturação" value={adj.saturation} min={-100} max={100} onChange={(v) => updateAdjustments({ saturation: v })} />
        </div>
      )}

      {tool === EditTool.EFFECTS && (
        <>
          <SliderRow label="Textura" value={adj.texture} min={-100} max={100} onChange={(v) => updateAdjustments({ texture: v })} />
          <SliderRow label="Claridade" value={adj.clarity} min={-100} max={100} onChange={(v) => updateAdjustments({ clarity: v })} />
          <SliderRow label="Desembaçar" value={adj.dehaze} min={-100} max={100} onChange={(v) => updateAdjustments({ dehaze: v })} />
          <SliderRow label="Vinheta" value={adj.vignette} min={-100} max={100} onChange={(v) => updateAdjustments({ vignette: v })} />
          <SliderRow label="Granulado" value={adj.grain} min={0} max={100} isBipolar={false} onChange={(v) => updateAdjustments({ grain: v })} />
        </>
      )}

      {tool === EditTool.OPTICS && (
        <div className="p-6 flex flex-col gap-8">
          <button 
            onClick={() => updateAdjustments({ chromaticAberration: !adj.chromaticAberration })}
            className={`flex items-center justify-between p-5 rounded-3xl bg-zinc-900 border transition-all ${adj.chromaticAberration ? 'border-blue-500/50' : 'border-zinc-800'}`}
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase tracking-widest">Remover Aberração</span>
              <span className="text-[9px] text-zinc-500 font-bold mt-1">Corrige franjas de cores nas bordas</span>
            </div>
            <div className={`w-11 h-6 rounded-full relative transition-colors ${adj.chromaticAberration ? 'bg-blue-600' : 'bg-zinc-800'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all ${adj.chromaticAberration ? 'left-6' : 'left-1'}`} />
            </div>
          </button>
          <SliderRow label="Correção de Lente" value={adj.lensCorrection} min={-100} max={100} onChange={(v) => updateAdjustments({ lensCorrection: v })} />
        </div>
      )}

      {tool === EditTool.GEOMETRY && (
        <div className="flex flex-col">
          <div className="grid grid-cols-2 gap-3 p-5 border-b border-zinc-900">
             <button onClick={() => updateAdjustments({ flipH: !adj.flipH })} className={`p-5 rounded-3xl flex flex-col items-center justify-center gap-3 transition-colors ${adj.flipH ? 'bg-blue-600/20 border border-blue-500/40 text-blue-500' : 'bg-zinc-900 text-zinc-400'}`}>
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 12l-3-3m3 3l3-3M17 8v12m0-12l-3 3m3-3l3-3" /></svg>
               <span className="text-[9px] font-black uppercase tracking-widest">Inverter H</span>
             </button>
             <button onClick={() => updateAdjustments({ rotation: (adj.rotation + 90) % 360 })} className="p-5 rounded-3xl bg-zinc-900 flex flex-col items-center justify-center gap-3 transition-colors text-zinc-400 active:bg-zinc-800">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
               <span className="text-[9px] font-black uppercase tracking-widest">Girar 90°</span>
             </button>
          </div>
          <SliderRow label="Endireitar" value={adj.straighten} min={-45} max={45} onChange={(v) => updateAdjustments({ straighten: v })} />
        </div>
      )}

      {tool === EditTool.CROP && (
        <div className="flex flex-col p-6 gap-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {['Livre', 'Original', '1:1', '4:5', '2:3', '3:4', '9:16'].map(r => (
              <button 
                key={r} 
                onClick={() => updateAdjustments({ aspectRatio: r })} 
                className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${adj.aspectRatio === r ? 'bg-blue-600 border-blue-500 text-white shadow-[0_4px_12px_rgba(37,99,235,0.4)]' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex justify-between items-center gap-3 mt-4">
            <button onClick={() => onToolChange?.(EditTool.LIGHT)} className="flex-1 py-4 bg-zinc-900 rounded-2xl text-zinc-500 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform">Cancelar</button>
            <button onClick={() => onToolChange?.(EditTool.LIGHT)} className="flex-1 py-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform shadow-lg shadow-blue-950/20">Concluir</button>
          </div>
        </div>
      )}

      {tool === EditTool.PRESETS && (
        <div className="grid grid-cols-2 p-5 gap-4">
          {['VIVID', 'CINEMA', 'B&W', 'VINTAGE'].map(p => (
            <button 
              key={p} 
              onClick={() => applyPreset(p)}
              className="p-8 bg-zinc-900 rounded-3xl border border-zinc-800 hover:border-blue-500/30 transition-all active:scale-95 flex flex-col items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-700 shadow-inner group-hover:from-blue-600/20 group-hover:to-blue-500/20" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-blue-500">{p}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Controls;
