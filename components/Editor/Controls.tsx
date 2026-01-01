
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
  
  // Impede que o scroll horizontal da aba aconteça enquanto arrastamos o slider
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="flex flex-col w-full touch-none">
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
      <div className="slider-container flex items-center h-8" onTouchStart={handleTouchStart}>
        {isBipolar && <div className="slider-center-tick" />}
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={1} 
          value={value} 
          onChange={(e) => onChange(parseFloat(e.target.value))} 
          className="pro-slider"
          onPointerDown={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

const Toggle: React.FC<{ label: string, active: boolean, onChange: (v: boolean) => void }> = ({ label, active, onChange }) => (
  <button onClick={() => onChange(!active)} className="flex items-center justify-between w-full group py-2">
    <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-blue-500' : 'text-zinc-500'}`}>{label}</span>
    <div className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-blue-600' : 'bg-zinc-800'}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all ${active ? 'left-5.5' : 'left-0.5'}`} />
    </div>
  </button>
);

const Controls: React.FC<{ tool: EditTool, onToolChange?: (t: EditTool) => void }> = ({ tool, onToolChange }) => {
  const { activePhotoId, photos, updateAdjustments, applyAutoAdjustments, resetAdjustments } = useStore();
  const photo = photos.find(p => p.id === activePhotoId);
  if (!photo) return null;
  const adj = photo.adjustments;

  const aspectRatios = [
    { label: 'Original', value: 'Original' },
    { label: 'Livre', value: 'Livre' },
    { label: '1:1', value: '1:1' },
    { label: '4:5', value: '4:5' },
    { label: '2:3', value: '2:3' },
    { label: '3:4', value: '3:4' },
    { label: '9:16', value: '9:16' }
  ];

  const renderLight = () => (
    <div className="flex gap-10 overflow-x-auto no-scrollbar pb-2">
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
  );

  const renderOptics = () => (
    <div className="flex gap-10 items-center">
      <div className="min-w-[160px]">
        <Toggle label="Remover Aberração" active={adj.chromaticAberration} onChange={(v) => updateAdjustments({ chromaticAberration: v })} />
      </div>
      <div className="min-w-[200px]">
        <ProSlider label="Correção de Lente" value={adj.lensCorrection} min={-100} max={100} onChange={(v) => updateAdjustments({ lensCorrection: v })} />
      </div>
      <button 
        onClick={() => updateAdjustments({ lensCorrection: 0, chromaticAberration: false })}
        className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white"
      >
        Nenhuma Lente
      </button>
    </div>
  );

  const renderGeometry = () => (
    <div className="flex gap-10 items-center h-full">
      <div className="min-w-[200px]">
        <ProSlider label="Endireitar" value={adj.straighten} min={-45} max={45} onChange={(v) => updateAdjustments({ straighten: v })} />
      </div>
      <div className="flex gap-4">
        <button onClick={() => updateAdjustments({ flipH: !adj.flipH })} className={`p-3 rounded-xl ${adj.flipH ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/></svg>
        </button>
        <button onClick={() => updateAdjustments({ rotation: (adj.rotation + 90) % 360 })} className="p-3 rounded-xl bg-zinc-900 text-zinc-500">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15.55 5.55L11 1v4.07C7.06 5.56 4 8.93 4 13s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45z"/></svg>
        </button>
      </div>
    </div>
  );

  const renderCrop = () => (
    <div className="flex flex-col gap-4 w-full h-full justify-center">
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
        {aspectRatios.map((ratio) => (
          <button
            key={ratio.value}
            onClick={() => updateAdjustments({ aspectRatio: ratio.value })}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase whitespace-nowrap transition-all border ${adj.aspectRatio === ratio.value ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
          >
            {ratio.label}
          </button>
        ))}
      </div>
      <div className="flex justify-between items-center px-2">
        <button onClick={() => onToolChange?.(EditTool.LIGHT)} className="text-zinc-500 font-black uppercase text-[10px]">Cancelar</button>
        <div className="flex gap-6">
          <button onClick={() => updateAdjustments({ rotation: (adj.rotation - 90) % 360 })} className="text-white font-black uppercase text-[10px]">Girar</button>
          <button onClick={() => updateAdjustments({ flipH: !adj.flipH })} className="text-white font-black uppercase text-[10px]">Espelhar</button>
        </div>
        <button onClick={() => onToolChange?.(EditTool.LIGHT)} className="text-blue-500 font-black uppercase text-[10px]">Pronto</button>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full">
      {tool === EditTool.LIGHT && renderLight()}
      {tool === EditTool.OPTICS && renderOptics()}
      {tool === EditTool.GEOMETRY && renderGeometry()}
      {tool === EditTool.CROP && renderCrop()}
      {![EditTool.LIGHT, EditTool.OPTICS, EditTool.GEOMETRY, EditTool.CROP].includes(tool) && (
        <div className="flex items-center justify-center text-zinc-700 text-[10px] font-black uppercase h-full italic">Em desenvolvimento</div>
      )}
    </div>
  );
};

export default Controls;
