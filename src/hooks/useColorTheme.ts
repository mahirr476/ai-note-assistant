// 3. CREATE: src/hooks/useColorTheme.ts
import { useState, useEffect } from 'react';
import { ColorTheme } from '../types/theme';

export function useColorTheme() {
  const [colorTheme, setColorTheme] = useState<ColorTheme>('default');


  useEffect(() => {
    const saved = localStorage.getItem('color-theme') as ColorTheme;
    if (saved && saved !== 'default') {
      setColorTheme(saved);
      applyColorTheme(saved);
    }
  }, []);

  const applyColorTheme = (theme: ColorTheme) => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove(
      'theme-monochromatic',
      'theme-warm-neutral', 
      'theme-sage-green',
      'theme-soft-lavender',
      'theme-ocean-blue',
      'theme-buttercream',
      'theme-coral-minimal',
      'theme-electric'
    );
    
    // Add new theme class (except for default)
    if (theme !== 'default') {
      root.classList.add(`theme-${theme}`);
    }
  };

  const changeColorTheme = (theme: ColorTheme) => {
    setColorTheme(theme);
    localStorage.setItem('color-theme', theme);
    applyColorTheme(theme);
  };

  return {
    colorTheme,
    changeColorTheme,
  };
}