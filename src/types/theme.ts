// 1. CREATE: src/types/theme.ts
export type ColorTheme = 
  | 'default'
  | 'monochromatic'
  | 'warm-neutral'
  | 'sage-green'
  | 'soft-lavender'
  | 'ocean-blue'
  | 'buttercream'
  | 'coral-minimal'
  | 'electric';

export interface ThemeConfig {
  name: ColorTheme;
  displayName: string;
  description: string;
  category: 'minimal' | 'warm' | 'natural' | 'bold';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}