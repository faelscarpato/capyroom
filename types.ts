
export enum ViewMode {
  GALLERY = 'GALLERY',
  EDITOR = 'EDITOR'
}

export enum EditTool {
  LIGHT = 'LUZ',
  COLOR = 'COR',
  EFFECTS = 'EFEITOS',
  DETAIL = 'DETALHE',
  OPTICS = 'ÓTICA',
  GEOMETRY = 'GEOMETRIA',
  PRESETS = 'PREDEFINIÇÕES',
  CROP = 'CORTAR',
  MASK = 'MÁSCARA',
  REMOVE = 'REMOVER'
}

export interface Photo {
  id: string;
  name: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  lastModified: number;
  adjustments: Adjustments;
}

export interface Adjustments {
  // Light
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  curvePoints: { x: number; y: number }[];
  // Color
  temp: number;
  tint: number;
  vibrance: number;
  saturation: number;
  // HSL
  hsl: {
    [key: string]: { h: number; s: number; l: number };
  };
  // Effects
  texture: number;
  clarity: number;
  dehaze: number;
  vignette: number;
  grain: number;
  // Detail
  sharpening: number;
  noiseReduction: number;
  // Optics
  lensCorrection: number;
  chromaticAberration: boolean;
  // Geometry
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  straighten: number; // fine rotation -45 to 45
  aspectRatio: string;
  crop: { x: number; y: number; w: number; h: number }; // normalized 0-1
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  curvePoints: [{ x: 0, y: 0 }, { x: 0.33, y: 0.33 }, { x: 0.66, y: 0.66 }, { x: 1, y: 1 }],
  temp: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  hsl: {
    red: { h: 0, s: 0, l: 0 }, orange: { h: 0, s: 0, l: 0 }, yellow: { h: 0, s: 0, l: 0 },
    green: { h: 0, s: 0, l: 0 }, aqua: { h: 0, s: 0, l: 0 }, blue: { h: 0, s: 0, l: 0 },
    purple: { h: 0, s: 0, l: 0 }, magenta: { h: 0, s: 0, l: 0 },
  },
  texture: 0,
  clarity: 0,
  dehaze: 0,
  vignette: 0,
  grain: 0,
  sharpening: 0,
  noiseReduction: 0,
  lensCorrection: 0,
  chromaticAberration: false,
  rotation: 0,
  flipH: false,
  flipV: false,
  straighten: 0,
  aspectRatio: 'Original',
  crop: { x: 0, y: 0, w: 1, h: 1 }
};
