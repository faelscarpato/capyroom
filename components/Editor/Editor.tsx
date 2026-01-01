
import React, { useState } from 'react';
import { useStore } from '../../store';
import { EditTool } from '../../types';
import EditorCanvas from './EditorCanvas';
import Controls from './Controls';
import { WebGLRenderer } from '../../engine/renderer';

const Editor: React.FC = () => {
  const { setActivePhoto, undo, redo, historyIndex, history, activePhotoId, photos, resetAdjustments } = useStore();
  const [activeTool, setActiveTool] = useState<EditTool>(EditTool.LIGHT);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const photo = photos.find(p => p.id === activePhotoId);

  const handleExport = async (sizeType: 'SMALL' | 'LARGE' | 'ORIGINAL') => {
    if (!photo) return;
    setIsExporting(true);

    try {
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.src = photo.previewUrl;
      
      await new Promise((resolve) => { img.onload = resolve; });

      let targetWidth = img.width;
      let targetHeight = img.height;

      if (sizeType === 'SMALL') {
        const max = 1080;
        if (targetWidth > targetHeight) {
          targetHeight = (max / targetWidth) * targetHeight;
          targetWidth = max;
        } else {
          targetWidth = (max / targetHeight) * targetWidth;
          targetHeight = max;
        }
      } else if (sizeType === 'LARGE') {
        const max = 2560;
        if (targetWidth > targetHeight) {
          targetHeight = (max / targetWidth) * targetHeight;
          targetWidth = max;
        } else {
          targetWidth = (max / targetHeight) * targetWidth;
          targetHeight = max;
        }
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const renderer = new WebGLRenderer(canvas);
      renderer.setImage(img);
      renderer.render(photo.adjustments, targetWidth, targetHeight);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `capyroom_${sizeType.toLowerCase()}_${photo.name.split('.')[0]}.jpg`;
      link.href = dataUrl;
      link.click();
      
      renderer.dispose();
      setShowExportModal(false);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Top Bar */}
      <header className="px-4 h-12 flex justify-between items-center border-b border-zinc-900 bg-black/80 backdrop-blur z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActivePhoto(null)}
            className="p-1 -ml-1 text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 truncate max-w-[120px]">
            {photo?.name}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
            <button 
              onClick={undo}
              disabled={historyIndex <= 0}
              className={`p-1.5 rounded-md transition-colors ${historyIndex <= 0 ? 'text-zinc-800' : 'text-zinc-400 hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </button>
            <button 
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className={`p-1.5 rounded-md transition-colors ${historyIndex >= history.length - 1 ? 'text-zinc-800' : 'text-zinc-400 hover:text-white'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
            </button>
          </div>
          <button 
            onClick={() => setShowExportModal(true)}
            className="bg-blue-600 text-white font-black text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-900/20 active:scale-95 transition-transform"
          >
            Exportar
          </button>
        </div>
      </header>

      {/* Main Preview */}
      <EditorCanvas />

      {/* Controls Area */}
      <footer className="bg-black/95 backdrop-blur-xl border-t border-zinc-900 pb-safe z-10">
        <div className="h-44 px-5 flex flex-col justify-center">
            <Controls tool={activeTool} />
        </div>

        <div className="h-16 overflow-x-auto no-scrollbar flex items-center px-4 gap-8 border-t border-zinc-900/50">
          {[EditTool.LIGHT, EditTool.COLOR, EditTool.EFFECTS, EditTool.PRESETS].map((tool) => (
            <button
              key={tool}
              onClick={() => setActiveTool(tool)}
              className={`flex flex-col items-center gap-1.5 shrink-0 transition-all ${activeTool === tool ? 'text-blue-500' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${activeTool === tool ? 'opacity-100' : 'opacity-60'}`}>
                {tool}
              </span>
              <div className={`w-1 h-1 rounded-full transition-transform ${activeTool === tool ? 'bg-blue-500 scale-100' : 'bg-transparent scale-0'}`} />
            </button>
          ))}
          <div className="w-px h-6 bg-zinc-800 mx-2" />
          <button
              onClick={resetAdjustments}
              className={`flex flex-col items-center gap-1.5 shrink-0 text-red-900/40 hover:text-red-600 transition-colors`}
            >
              <span className={`text-[10px] font-black uppercase tracking-[0.2em]`}>Reset</span>
              <div className="w-1 h-1" />
            </button>
        </div>
      </footer>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-zinc-950 w-full max-w-sm rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5">
            <div className="p-8">
              <h2 className="text-xl font-black mb-1 uppercase tracking-tight">Exportar Foto</h2>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-8">Processamento WebGL de Alta Resolução</p>
              
              <div className="flex flex-col gap-4">
                <button 
                  disabled={isExporting}
                  onClick={() => handleExport('SMALL')}
                  className="group flex justify-between items-center p-5 bg-zinc-900 hover:bg-blue-600/10 rounded-2xl transition-all border border-zinc-800 hover:border-blue-500/30 disabled:opacity-50"
                >
                  <div className="text-left">
                    <div className="font-black uppercase text-xs tracking-wider">JPG (Social)</div>
                    <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest group-hover:text-blue-400">Otimizado para Instagram • 1080p</div>
                  </div>
                  <div className="bg-zinc-800 p-2 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </button>

                <button 
                  disabled={isExporting}
                  onClick={() => handleExport('LARGE')}
                  className="group flex justify-between items-center p-5 bg-zinc-900 hover:bg-blue-600/10 rounded-2xl transition-all border border-zinc-800 hover:border-blue-500/30 disabled:opacity-50"
                >
                  <div className="text-left">
                    <div className="font-black uppercase text-xs tracking-wider">JPG (HD)</div>
                    <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest group-hover:text-blue-400">Qualidade Master • 2560px</div>
                  </div>
                  <div className="bg-zinc-800 p-2 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </button>

                <button 
                  disabled={isExporting}
                  onClick={() => handleExport('ORIGINAL')}
                  className="group flex justify-between items-center p-5 bg-zinc-900 hover:bg-blue-600/10 rounded-2xl transition-all border border-zinc-800 hover:border-blue-500/30 disabled:opacity-50"
                >
                  <div className="text-left">
                    <div className="font-black uppercase text-xs tracking-wider">Resolução Original</div>
                    <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest group-hover:text-blue-400">Sem compressão de dimensões</div>
                  </div>
                  <div className="bg-zinc-800 p-2 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </button>
              </div>

              {isExporting && (
                <div className="mt-8 flex flex-col items-center justify-center gap-3">
                   <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 animate-[shimmer_2s_infinite] w-full origin-left" />
                   </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500 animate-pulse">Renderizando Master...</span>
                </div>
              )}

              <button 
                onClick={() => setShowExportModal(false)}
                className="w-full mt-8 py-3 text-zinc-600 font-black uppercase text-[10px] tracking-[0.3em] hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
