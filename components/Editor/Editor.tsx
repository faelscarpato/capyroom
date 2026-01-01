
import React, { useState } from 'react';
import { useStore } from '../../store';
import { ViewMode, EditTool, DEFAULT_ADJUSTMENTS } from '../../types';
import EditorCanvas from './EditorCanvas';
import Controls from './Controls';

const Editor: React.FC = () => {
  const { setActivePhoto, undo, redo, historyIndex, history, activePhotoId, photos, updateAdjustments, resetAdjustments } = useStore();
  const [activeTool, setActiveTool] = useState<EditTool>(EditTool.LIGHT);
  const [showExportModal, setShowExportModal] = useState(false);

  const photo = photos.find(p => p.id === activePhotoId);

  const handleExport = () => {
    if (!photo) return;
    
    // Simple export: Download full res processed canvas
    // In a real app, we'd render the full-res file in an OffscreenCanvas
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `capyroom_${photo.name}`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Top Bar */}
      <header className="px-4 h-12 flex justify-between items-center border-b border-zinc-900 bg-black/80 backdrop-blur">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActivePhoto(null)}
            className="p-1 -ml-1 text-zinc-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-medium opacity-60 truncate max-w-[120px]">
            {photo?.name}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={undo}
            disabled={historyIndex <= 0}
            className={`p-1 ${historyIndex <= 0 ? 'opacity-20 cursor-not-allowed' : 'text-white'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
          </button>
          <button 
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className={`p-1 ${historyIndex >= history.length - 1 ? 'opacity-20 cursor-not-allowed' : 'text-white'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
          </button>
          <button 
            onClick={handleExport}
            className="text-blue-500 font-bold text-sm px-2"
          >
            EXPORTAR
          </button>
        </div>
      </header>

      {/* Main Preview */}
      <EditorCanvas />

      {/* Controls Area */}
      <footer className="bg-black/95 backdrop-blur-lg border-t border-zinc-900 pb-safe">
        {/* Sliders Area */}
        <div className="h-28 px-4 flex flex-col justify-center">
            <Controls tool={activeTool} />
        </div>

        {/* Tools Selector */}
        <div className="h-14 overflow-x-auto no-scrollbar flex items-center px-4 gap-6">
          {Object.values(EditTool).map((tool) => (
            <button
              key={tool}
              onClick={() => setActiveTool(tool)}
              className={`flex flex-col items-center gap-1 shrink-0 transition-colors ${activeTool === tool ? 'text-white' : 'text-zinc-600'}`}
            >
              <span className={`text-[10px] font-black uppercase tracking-widest ${activeTool === tool ? 'text-blue-500' : ''}`}>
                {tool}
              </span>
              <div className={`w-1 h-1 rounded-full ${activeTool === tool ? 'bg-blue-500' : 'bg-transparent'}`} />
            </button>
          ))}
          <button
              onClick={resetAdjustments}
              className={`flex flex-col items-center gap-1 shrink-0 text-red-500/50 hover:text-red-500 transition-colors`}
            >
              <span className={`text-[10px] font-black uppercase tracking-widest`}>RESET</span>
              <div className="w-1 h-1" />
            </button>
        </div>
      </footer>
    </div>
  );
};

export default Editor;
