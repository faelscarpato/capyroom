
import { create } from 'zustand';
import { ViewMode, Photo, Adjustments, DEFAULT_ADJUSTMENTS } from './types';

interface AppState {
  view: ViewMode;
  photos: Photo[];
  activePhotoId: string | null;
  history: Adjustments[];
  historyIndex: number;
  
  // Actions
  setView: (view: ViewMode) => void;
  addPhotos: (files: File[]) => void;
  setActivePhoto: (id: string | null) => void;
  updateAdjustments: (adj: Partial<Adjustments>) => void;
  applyAutoAdjustments: () => void;
  applyPreset: (presetName: string) => void;
  undo: () => void;
  redo: () => void;
  resetAdjustments: () => void;
}

export const useStore = create<AppState>((set) => ({
  view: ViewMode.GALLERY,
  photos: [],
  activePhotoId: null,
  history: [],
  historyIndex: -1,

  setView: (view) => set({ view }),

  addPhotos: (files) => {
    const newPhotos = files.map((file) => {
      const url = URL.createObjectURL(file);
      return {
        id: Math.random().toString(36).substring(7),
        name: file.name,
        file,
        previewUrl: url,
        width: 0,
        height: 0,
        lastModified: file.lastModified,
        adjustments: { ...DEFAULT_ADJUSTMENTS },
      };
    });
    set((state) => ({ photos: [...state.photos, ...newPhotos] }));
  },

  setActivePhoto: (id) => set((state) => {
    const photo = state.photos.find(p => p.id === id);
    if (!photo) return { activePhotoId: null, view: ViewMode.GALLERY };
    return { 
      activePhotoId: id, 
      view: ViewMode.EDITOR,
      history: [photo.adjustments],
      historyIndex: 0
    };
  }),

  updateAdjustments: (adj) => set((state) => {
    if (!state.activePhotoId) return state;
    
    const photo = state.photos.find(p => p.id === state.activePhotoId);
    if (!photo) return state;

    const newAdjustments = { ...photo.adjustments, ...adj };
    const updatedPhotos = state.photos.map(p => 
      p.id === state.activePhotoId ? { ...p, adjustments: newAdjustments } : p
    );

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newAdjustments);
    if (newHistory.length > 50) newHistory.shift();

    return { 
      photos: updatedPhotos,
      history: newHistory,
      historyIndex: newHistory.length - 1
    };
  }),

  applyPreset: (name) => set((state) => {
    if (!state.activePhotoId) return state;
    const photo = state.photos.find(p => p.id === state.activePhotoId);
    if (!photo) return state;

    let preset: Partial<Adjustments> = {};
    switch(name) {
      case 'B&W': 
        preset = { saturation: -100, contrast: 20, exposure: 10, highlights: -10, shadows: 10 }; break;
      case 'CINEMA': 
        preset = { temp: 10, tint: -5, contrast: 15, shadows: -10, saturation: 10, vignette: -30 }; break;
      case 'VINTAGE': 
        preset = { temp: 15, grain: 40, contrast: -10, exposure: 5, texture: -20, vignette: -20 }; break;
      case 'VIVID': 
        preset = { vibrance: 40, saturation: 10, contrast: 10, texture: 15 }; break;
    }

    const newAdjustments = { ...photo.adjustments, ...preset };
    const updatedPhotos = state.photos.map(p => p.id === state.activePhotoId ? { ...p, adjustments: newAdjustments } : p);
    return { photos: updatedPhotos, history: [...state.history, newAdjustments], historyIndex: state.historyIndex + 1 };
  }),

  applyAutoAdjustments: () => set((state) => {
    if (!state.activePhotoId) return state;
    const photo = state.photos.find(p => p.id === state.activePhotoId);
    if (!photo) return state;
    const auto: Partial<Adjustments> = { exposure: 12, contrast: 15, highlights: -25, shadows: 20, vibrance: 25 };
    const newAdjustments = { ...photo.adjustments, ...auto };
    const updatedPhotos = state.photos.map(p => p.id === state.activePhotoId ? { ...p, adjustments: newAdjustments } : p);
    return { photos: updatedPhotos, history: [...state.history, newAdjustments], historyIndex: state.historyIndex + 1 };
  }),

  undo: () => set((state) => {
    if (state.historyIndex <= 0) return state;
    const newIndex = state.historyIndex - 1;
    const adj = state.history[newIndex];
    const updatedPhotos = state.photos.map(p => p.id === state.activePhotoId ? { ...p, adjustments: adj } : p);
    return { photos: updatedPhotos, historyIndex: newIndex };
  }),

  redo: () => set((state) => {
    if (state.historyIndex >= state.history.length - 1) return state;
    const newIndex = state.historyIndex + 1;
    const adj = state.history[newIndex];
    const updatedPhotos = state.photos.map(p => p.id === state.activePhotoId ? { ...p, adjustments: adj } : p);
    return { photos: updatedPhotos, historyIndex: newIndex };
  }),

  resetAdjustments: () => set((state) => {
    if (!state.activePhotoId) return state;
    const updatedPhotos = state.photos.map(p => p.id === state.activePhotoId ? { ...p, adjustments: { ...DEFAULT_ADJUSTMENTS } } : p);
    return { photos: updatedPhotos, history: [{ ...DEFAULT_ADJUSTMENTS }], historyIndex: 0 };
  })
}));
