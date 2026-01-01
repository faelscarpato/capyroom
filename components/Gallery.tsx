
import React from 'react';
import { useStore } from '../store';

const Gallery: React.FC = () => {
  const { photos, addPhotos, setActivePhoto } = useStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addPhotos(Array.from(e.target.files));
    }
  };

  const handleOpenFolder = async () => {
    // Check for File System Access API support
    if ('showDirectoryPicker' in window) {
      try {
        const directoryHandle = await (window as any).showDirectoryPicker();
        const files: File[] = [];
        for await (const entry of directoryHandle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            if (file.type.startsWith('image/')) {
              files.push(file);
            }
          }
        }
        addPhotos(files);
      } catch (err) {
        console.error('Directory selection cancelled or failed', err);
      }
    } else {
      // Fallback
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*';
      input.onchange = (e) => handleFileChange(e as any);
      input.click();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black">
      <header className="px-4 py-3 flex justify-between items-center border-b border-zinc-800">
        <h1 className="text-xl font-bold tracking-tight">CapyRoom</h1>
        <div className="flex gap-2">
          <button 
            onClick={handleOpenFolder}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
            Adicionar Fotos
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-2">
        {photos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
            <svg className="w-16 h-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-center px-8">Nenhuma foto selecionada.<br/>Toque no botão acima para abrir sua galeria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
            {photos.map((photo) => (
              <div 
                key={photo.id} 
                onClick={() => setActivePhoto(photo.id)}
                className="aspect-square relative group cursor-pointer overflow-hidden bg-zinc-900 rounded-sm"
              >
                <img 
                  src={photo.previewUrl} 
                  alt={photo.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-zinc-950 border-t border-zinc-800 flex justify-around p-2">
        <button className="flex flex-col items-center gap-1 text-blue-500">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path></svg>
          <span className="text-[10px] font-bold">GALERIA</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-zinc-500 opacity-50 cursor-not-allowed">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          <span className="text-[10px] font-bold uppercase">Editor</span>
        </button>
      </footer>
    </div>
  );
};

export default Gallery;
