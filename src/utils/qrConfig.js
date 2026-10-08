export const QR_DOT_STYLES = [
  { id: 'square', label: 'Classic Square' },
  { id: 'rounded', label: 'Smooth Rounded' },
  { id: 'dots', label: 'Circular Dots' },
  { id: 'classy', label: 'Classy Diamond' },
  { id: 'classy-rounded', label: 'Modern Sleek' },
  { id: 'extra-rounded', label: 'Soft Pill' },
];

export const CORNER_SQUARE_STYLES = [
  { id: 'square', label: 'Square' },
  { id: 'extra-rounded', label: 'Rounded' },
  { id: 'dot', label: 'Circular' },
];

export const CORNER_DOT_STYLES = [
  { id: 'square', label: 'Square' },
  { id: 'dot', label: 'Dot' },
];

export const QR_FRAMES = [
  { id: 'none', label: 'No Frame' },
  { id: 'simple', label: 'Clean Border' },
  { id: 'scan-me-bottom', label: 'Scan Me Badge' },
  { id: 'card', label: 'Glass Card' },
  { id: 'promotional', label: 'Header Ribbon' },
];

export const QR_COLOR_PALETTES = [
  { name: 'Monochrome', fg: '#0f172a', bg: '#ffffff', eye: '#0f172a' },
  { name: 'Slate Minimal', fg: '#334155', bg: '#f8fafc', eye: '#1e293b' },
  { name: 'Indigo Electric', fg: '#4f46e5', bg: '#ffffff', eye: '#4338ca' },
  { name: 'Deep Midnight', fg: '#6366f1', bg: '#0b0f19', eye: '#818cf8' },
  { name: 'Emerald Luxe', fg: '#059669', bg: '#ffffff', eye: '#047857' },
  { name: 'Sunset Amber', fg: '#ea580c', bg: '#ffffff', eye: '#c2410c' },
  { name: 'Rosewood', fg: '#e11d48', bg: '#ffffff', eye: '#be123c' },
  { name: 'Dark Cyber', fg: '#06b6d4', bg: '#090d16', eye: '#22d3ee' },
];

export const QR_PRESETS = [
  {
    id: 'preset-minimal-slate',
    name: 'Minimal Slate',
    description: 'Clean, understated corporate design',
    config: {
      dotsType: 'square',
      cornersSquareType: 'square',
      cornersDotType: 'square',
      fgColor: '#1e293b',
      bgColor: '#ffffff',
      gradient: null,
      eyeColor: '#0f172a',
      frame: 'none',
      frameText: 'SCAN ME',
      frameColor: '#1e293b',
      logoSize: 0.2,
    }
  },
  {
    id: 'preset-indigo-pulse',
    name: 'Indigo Modern',
    description: 'Curved modern modules with energetic accent',
    config: {
      dotsType: 'classy-rounded',
      cornersSquareType: 'extra-rounded',
      cornersDotType: 'dot',
      fgColor: '#4f46e5',
      bgColor: '#ffffff',
      gradient: null,
      eyeColor: '#4338ca',
      frame: 'scan-me-bottom',
      frameText: 'SCAN TO OPEN',
      frameColor: '#4f46e5',
      logoSize: 0.22,
    }
  },
  {
    id: 'preset-emerald-tech',
    name: 'Emerald Luxe',
    description: 'High-contrast organic dots with soft corners',
    config: {
      dotsType: 'dots',
      cornersSquareType: 'dot',
      cornersDotType: 'dot',
      fgColor: '#059669',
      bgColor: '#ffffff',
      gradient: null,
      eyeColor: '#047857',
      frame: 'simple',
      frameText: 'SCAN HERE',
      frameColor: '#059669',
      logoSize: 0.2,
    }
  },
  {
    id: 'preset-dark-obsidian',
    name: 'Obsidian Night',
    description: 'Dark-mode ready inverted palette',
    config: {
      dotsType: 'classy',
      cornersSquareType: 'extra-rounded',
      cornersDotType: 'dot',
      fgColor: '#818cf8',
      bgColor: '#090d16',
      gradient: null,
      eyeColor: '#a5b4fc',
      frame: 'card',
      frameText: 'SCAN CODE',
      frameColor: '#818cf8',
      logoSize: 0.2,
    }
  },
  {
    id: 'preset-sunset-gradient',
    name: 'Sunset Linear',
    description: 'Smooth gradient transitioning from rose to amber',
    config: {
      dotsType: 'rounded',
      cornersSquareType: 'extra-rounded',
      cornersDotType: 'square',
      fgColor: '#e11d48',
      bgColor: '#ffffff',
      gradient: {
        type: 'linear',
        rotation: 45,
        colorStops: [
          { offset: 0, color: '#e11d48' },
          { offset: 1, color: '#f59e0b' }
        ]
      },
      eyeColor: '#e11d48',
      frame: 'scan-me-bottom',
      frameText: 'EXPLORE',
      frameColor: '#e11d48',
      logoSize: 0.22,
    }
  },
  {
    id: 'preset-corporate-blue',
    name: 'Corporate Crisp',
    description: 'Trusted cobalt geometry for official communication',
    config: {
      dotsType: 'classy',
      cornersSquareType: 'square',
      cornersDotType: 'square',
      fgColor: '#1d4ed8',
      bgColor: '#ffffff',
      gradient: null,
      eyeColor: '#1e40af',
      frame: 'simple',
      frameText: 'OFFICIAL QR',
      frameColor: '#1d4ed8',
      logoSize: 0.2,
    }
  }
];

export const DEFAULT_QR_CONFIG = {
  dotsType: 'classy-rounded',
  cornersSquareType: 'extra-rounded',
  cornersDotType: 'dot',
  fgColor: '#0f172a',
  bgColor: '#ffffff',
  gradient: null,
  eyeColor: '#0f172a',
  logo: null,
  logoSize: 0.22,
  logoMargin: 6,
  logoBackground: 'white', // 'white', 'none', 'circle'
  frame: 'scan-me-bottom',
  frameText: 'SCAN ME',
  frameColor: '#0f172a',
};
