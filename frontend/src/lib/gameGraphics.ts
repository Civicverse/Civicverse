export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface GraphicsPreset {
  label: string;
  description: string;
  maxPixelRatio: number;
  minPixelRatio: number;
  shadows: boolean;
  shadowMapSize: number;
  antiAliasing: boolean;
  bloom: boolean;
  rainCount: number;
  rainOpacity: number;
  fogBankCount: number;
  puddleCount: number;
}

const STORAGE_KEY = 'civicverse.graphics-quality.v1';

export const GRAPHICS_PRESETS: Record<GraphicsQuality, GraphicsPreset> = {
  low: {
    label: 'Low',
    description: 'Handheld battery saver',
    maxPixelRatio: 0.85,
    minPixelRatio: 0.65,
    shadows: false,
    shadowMapSize: 512,
    antiAliasing: false,
    bloom: false,
    rainCount: 420,
    rainOpacity: 0.13,
    fogBankCount: 3,
    puddleCount: 28
  },
  medium: {
    label: 'Medium',
    description: 'Balanced · recommended for ROG Ally',
    maxPixelRatio: 1,
    minPixelRatio: 0.78,
    shadows: true,
    shadowMapSize: 1024,
    antiAliasing: true,
    bloom: true,
    rainCount: 900,
    rainOpacity: 0.22,
    fogBankCount: 6,
    puddleCount: 68
  },
  high: {
    label: 'High',
    description: 'Full effects for gaming PCs',
    maxPixelRatio: 1.5,
    minPixelRatio: 1,
    shadows: true,
    shadowMapSize: 2048,
    antiAliasing: true,
    bloom: true,
    rainCount: 1800,
    rainOpacity: 0.3,
    fogBankCount: 10,
    puddleCount: 120
  }
};

export function getGraphicsQuality(): GraphicsQuality {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'low' || saved === 'medium' || saved === 'high') return saved;
  } catch {}
  return 'medium';
}

export function saveGraphicsQuality(quality: GraphicsQuality): void {
  try {
    localStorage.setItem(STORAGE_KEY, quality);
  } catch {}
  window.dispatchEvent(new CustomEvent<GraphicsQuality>('civicverse:graphics-quality-change', { detail: quality }));
}
