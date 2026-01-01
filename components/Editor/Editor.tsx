
import React, { useState } from 'react';
import { useStore } from '../../store';
import { EditTool } from '../../types';
import EditorCanvas from './EditorCanvas';
import Controls from './Controls';

const Editor: React.FC = () => {
  const { setActivePhoto, undo, redo, historyIndex, history, activePhotoId, photos, resetAdjustments } = useStore();
  const [activeTool, setActiveTool] = useState<EditTool>(EditTool.LIGHT);
  const [showExport, setShowExport] = useState(false);

  const photo = photos.find(p => p.id === activePhotoId);

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden select-none">
      {/* Header Fixo */}
      <header className="h-16 px-4 flex justify-between items-center bg-black/90 backdrop-blur-2xl border-b border-zinc-900 z-50 pt-safe">
        <button 
          onClick={() => setActivePhoto(null)} 
          className="p-3 -ml-3 text-zinc-400 active:text-white transition-colors"
        >
           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        
        <div className="flex items-center bg-zinc-900/40 rounded-full px-3 py-1.5 border border-zinc-800/50">
           <button 
             onClick={undo} 
             disabled={historyIndex <= 0} 
             className={`p-1.5 transition-all ${historyIndex <= 0 ? 'opacity-20' : 'text-white active:scale-90'}`}
           >
             <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
           </button>
           <div className="w-px h-4 bg-zinc-800 mx-2" />
           <button 
             onClick={redo} 
             disabled={historyIndex >= history.length - 1} 
             className={`p-1.5 transition-all ${historyIndex >= history.length - 1 ? 'opacity-20' : 'text-white active:scale-90'}`}
           >
             <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
           </button>
        </div>
        
        <button 
          onClick={() => setShowExport(true)} 
          className="bg-blue-600 text-white font-black text-[10px] px-6 py-2 rounded-full uppercase tracking-widest active:scale-95 transition-all shadow-[0_4px_15px_rgba(37,99,235,0.3)]"
        >
          Exportar
        </button>
      </header>

      {/* Viewport do Editor (Canvas) */}
      <div className="flex-1 relative bg-zinc-950 pb-[45vh]">
        <EditorCanvas activeTool={activeTool} />
      </div>

      {/* Painel Inferior (Bottom Sheet) */}
      <footer className="fixed left-0 right-0 bottom-0 bg-black border-t border-zinc-900 z-40 flex flex-col h-[45vh] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        {/* Barra de Ferramentas (Horizontal) */}
        <div className="h-14 flex items-center px-4 gap-7 overflow-x-auto no-scrollbar border-b border-zinc-900/50 flex-shrink-0">
          {[EditTool.LIGHT, EditTool.COLOR, EditTool.EFFECTS, EditTool.OPTICS, EditTool.GEOMETRY, EditTool.CROP, EditTool.PRESETS].map(t => (
            <button 
              key={t} 
              onClick={() => setActiveTool(t)}
              className={`flex-shrink-0 flex flex-col items-center gap-2 transition-all ${activeTool === t ? 'text-blue-500 scale-105' : 'text-zinc-600 active:text-zinc-400'}`}
            >
              <span className="text-[10px] font-black uppercase tracking-[0.25em]">{t}</span>
              <div className={`w-1.5 h-1.5 rounded-full transition-all ${activeTool === t ? 'bg-blue-500 scale-100 opacity-100' : 'bg-transparent scale-0 opacity-0'}`} />
            </button>
          ))}
          <div className="w-px h-5 bg-zinc-800 flex-shrink-0" />
          <button 
            onClick={resetAdjustments} 
            className="text-[10px] font-black uppercase text-red-900/60 active:text-red-600 transition-colors tracking-widest flex-shrink-0"
          >
            Reset
          </button>
        </div>
        
        {/* Conteúdo da Ferramenta (Vertical) */}
        <div className="flex-1 overflow-y-auto no-scrollbar overscroll-contain pb-safe">
           <Controls tool={activeTool} onToolChange={setActiveTool} />
        </div>
      </footer>
    </div>
  );
};

export default Editor;
