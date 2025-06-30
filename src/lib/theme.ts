// 2. CREATE: src/lib/themes.ts
import { ThemeConfig, ColorTheme } from '../types/theme';

export const colorThemes: Record<ColorTheme, ThemeConfig> = {
  'default': {
    name: 'default',
    displayName: 'Default Blue',
    description: 'Original blue theme',
    category: 'minimal',
    colors: {
      primary: 'hsl(199, 89%, 48%)',
      secondary: 'hsl(210, 40%, 96%)',
      accent: 'hsl(210, 40%, 96%)',
    }
  },
  'monochromatic': {
    name: 'monochromatic',
    displayName: 'Monochromatic',
    description: 'Clean black & white with subtle accents',
    category: 'minimal',
    colors: {
      primary: 'hsl(0, 0%, 9%)',
      secondary: 'hsl(0, 0%, 96%)',
      accent: 'hsl(0, 0%, 96%)',
    }
  },
  'warm-neutral': {
    name: 'warm-neutral',
    displayName: 'Warm Neutral',
    description: 'Cozy mocha and cinnamon tones',
    category: 'warm',
    colors: {
      primary: 'hsl(25, 85%, 53%)',
      secondary: 'hsl(30, 20%, 92%)',
      accent: 'hsl(30, 20%, 92%)',
    }
  },
  'sage-green': {
    name: 'sage-green',
    displayName: 'Sage Green',
    description: 'Natural and calming eco-friendly aesthetic',
    category: 'natural',
    colors: {
      primary: 'hsl(120, 25%, 45%)',
      secondary: 'hsl(120, 15%, 93%)',
      accent: 'hsl(120, 15%, 93%)',
    }
  },
  'soft-lavender': {
    name: 'soft-lavender',
    displayName: 'Soft Lavender',
    description: 'Nostalgic Y2K revival with gentle pastels',
    category: 'warm',
    colors: {
      primary: 'hsl(270, 50%, 65%)',
      secondary: 'hsl(270, 20%, 93%)',
      accent: 'hsl(270, 20%, 93%)',
    }
  },
  'ocean-blue': {
    name: 'ocean-blue',
    displayName: 'Ocean Blue',
    description: 'Professional and trustworthy',
    category: 'minimal',
    colors: {
      primary: 'hsl(210, 85%, 55%)',
      secondary: 'hsl(210, 20%, 93%)',
      accent: 'hsl(210, 20%, 93%)',
    }
  },
  'buttercream': {
    name: 'buttercream',
    displayName: 'Buttercream',
    description: 'Warm optimistic luxury',
    category: 'warm',
    colors: {
      primary: 'hsl(45, 85%, 65%)',
      secondary: 'hsl(45, 20%, 93%)',
      accent: 'hsl(45, 20%, 93%)',
    }
  },
  'coral-minimal': {
    name: 'coral-minimal',
    displayName: 'Coral Minimal',
    description: 'Modern energy with sophistication',
    category: 'bold',
    colors: {
      primary: 'hsl(12, 85%, 65%)',
      secondary: 'hsl(0, 0%, 93%)',
      accent: 'hsl(0, 0%, 93%)',
    }
  },
  'electric': {
    name: 'electric',
    displayName: 'Electric',
    description: 'Future-forward dynamic tech aesthetic',
    category: 'bold',
    colors: {
      primary: 'hsl(260, 85%, 60%)',
      secondary: 'hsl(260, 20%, 93%)',
      accent: 'hsl(190, 85%, 60%)',
    }
  }
};