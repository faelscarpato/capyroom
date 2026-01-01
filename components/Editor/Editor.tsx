
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
      // Create an offscreen canvas for processing
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
            onClick={() => setShowExportModal(true)}
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
        <div className="h-28 px-4 flex flex-col justify-center">
            <Controls tool={activeTool} />
        </div>

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

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-1">Exportar Foto</h2>
              <p className="text-zinc-500 text-sm mb-6">Escolha a qualidade da sua imagem.</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  disabled={isExporting}
                  onClick={() => handleExport('SMALL')}
                  className="flex justify-between items-center p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  <div className="text-left">
                    <div className="font-bold">JPG (Pequeno)</div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Ideal para Redes Sociais (1080p)</div>
                  </div>
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>

                <button 
                  disabled={isExporting}
                  onClick={() => handleExport('LARGE')}
                  className="flex justify-between items-center p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  <div className="text-left">
                    <div className="font-bold">JPG (Grande)</div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Alta definição (2.5K)</div>
                  </div>
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>

                <button 
                  disabled={isExporting}
                  onClick={() => handleExport('ORIGINAL')}
                  className="flex justify-between items-center p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  <div className="text-left">
                    <div className="font-bold">Qualidade Original</div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">Resolução total do arquivo</div>
                  </div>
                  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              {isExporting && (
                <div className="mt-6 flex items-center justify-center gap-3 text-blue-500 animate-pulse">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-bold uppercase tracking-widest">Processando...</span>
                </div>
              )}

              <button 
                onClick={() => setShowExportModal(false)}
                className="w-full mt-6 py-3 text-zinc-500 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors"
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
