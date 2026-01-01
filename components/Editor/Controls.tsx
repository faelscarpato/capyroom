
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
        <button onDoubleClick={() => onChange(resetValue)} className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isChanged ? 'text-blue-500' : 'text-zinc-500'}`}>{label}</button>
        <span className={`text-[10px] font-mono font-medium ${isChanged ? 'text-white' : 'text-zinc-600'}`}>{value > 0 && isBipolar ? `+${Math.round(value)}` : Math.round(value)}</span>
      </div>
      <div className="slider-container flex items-center h-8">
        {isBipolar && <div className="slider-center-tick" />}
        <input type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="pro-slider" />
      </div>
    </div>
  );
};

const Toggle: React.FC<{ label: string, active: boolean, onChange: (v: boolean) => void }> = ({ label, active, onChange }) => (
  <button onClick={() => onChange(!active)} className="flex flex-col gap-2 group">
    <span className={`text-[9px] font-black uppercase tracking-widest text-left ${active ? 'text-blue-500' : 'text-zinc-500'}`}>{label}</span>
    <div className={`w-12 h-6 rounded-full relative transition-colors ${active ? 'bg-blue-600' : 'bg-zinc-800'}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all ${active ? 'left-7' : 'left-1'}`} />
    </div>
  </button>
);

const Controls: React.FC<{ tool: EditTool }> = ({ tool }) => {
  const { activePhotoId, photos, updateAdjustments, applyAutoAdjustments } = useStore();
  const [colorTab, setColorTab] = useState<'GLOBAL' | 'MIXER'>('GLOBAL');
  const [mixerMode, setMixerMode] = useState<'h' | 's' | 'l'>('s');
  const [selectedColor, setSelectedColor] = useState<string>('red');

  const photo = photos.find(p => p.id === activePhotoId);
  if (!photo) return null;
  const adj = photo.adjustments;

  const handleRotation = () => updateAdjustments({ rotation: (adj.rotation + 90) % 360 });

  const aspectRatios = [
    'Original', 'Livre', '1:1', '2:1', '3:2', '4:3', '5:4', '7:5', '11:8.5', '16:9', '16:10'
  ];

  const renderLight = () => (
    <div className="flex flex-col h-full justify-center">
      <div className="flex justify-between items-center mb-3 px-1">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ajustes de Luz</span>
        <button onClick={applyAutoAdjustments} className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Auto</button>
      </div>
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
    </div>
  );

  const renderOptics = () => (
    <div className="flex flex-col h-full justify-center">
      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 px-1">Correções de Ótica</span>
      <div className="flex gap-12 items-center">
        <Toggle label="Aberração Cromática" active={adj.chromaticAberration} onChange={(v) => updateAdjustments({ chromaticAberration: v })} />
        <div className="flex-1 max-w-[200px]">
          <ProSlider label="Correção de Lente" value={adj.lensCorrection} min={-100} max={100} onChange={(v) => updateAdjustments({ lensCorrection: v })} />
        </div>
      </div>
    </div>
  );

  const renderGeometry = () => (
    <div className="flex flex-col h-full justify-center">
      <div className="flex justify-between items-center mb-3 px-1">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Geometria</span>
        <div className="flex gap-2">
          <button onClick={() => updateAdjustments({ flipH: !adj.flipH })} className={`p-2 rounded-lg ${adj.flipH ? 'bg-blue-600' : 'bg-zinc-900'}`}><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/></svg></button>
          <button onClick={handleRotation} className="p-2 rounded-lg bg-zinc-900"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.55 5.55L11 1v4.07C7.06 5.56 4 8.93 4 13s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.93c.87-.14 1.72-.48 2.47-1.02l1.42 1.42c-1.16.9-2.5 1.45-3.89 1.62v-2.02z"/></svg></button>
        </div>
      </div>
      <div className="max-w-[240px]">
        <ProSlider label="Endireitar" value={adj.straighten} min={-45} max={45} onChange={(v) => updateAdjustments({ straighten: v })} />
      </div>
    </div>
  );

  const renderCrop = () => (
    <div className="flex flex-col h-full justify-center">
      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 px-1">Cortar e Girar</span>
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {aspectRatios.map(ratio => (
          <button 
            key={ratio}
            onClick={() => updateAdjustments({ aspectRatio: ratio })}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase whitespace-nowrap border transition-all ${adj.aspectRatio === ratio ? 'bg-blue-600 border-blue-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
          >
            {ratio}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full">
      {tool === EditTool.LIGHT && renderLight()}
      {tool === EditTool.COLOR && <div className="text-zinc-500 text-[10px] font-black">COLOR UI IMPLEMENTED IN PREVIOUS STEP</div>}
      {tool === EditTool.OPTICS && renderOptics()}
      {tool === EditTool.GEOMETRY && renderGeometry()}
      {tool === EditTool.CROP && renderCrop()}
      {tool === EditTool.PRESETS && <div className="text-zinc-500 text-[10px] font-black uppercase">Presets UI</div>}
    </div>
  );
};

export default Controls;
