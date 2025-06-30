// 3. THEME CONTEXT - src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeName, themes } from '../lib/theme';

interface ThemeContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('monochromatic');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load saved theme and dark mode preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as ThemeName;
    const savedDarkMode = localStorage.getItem('app-dark-mode') === 'true';
    
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
    
    setIsDarkMode(savedDarkMode);
  }, []);

  // Apply theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const theme = themes[currentTheme];
    
    // Remove all theme classes
    Object.keys(themes).forEach(themeName => {
      root.classList.remove(`theme-${themeName}`);
    });
    
    // Add current theme class
    root.classList.add(`theme-${currentTheme}`);
    
    // Toggle dark mode class
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [currentTheme, isDarkMode]);

  const setTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
    localStorage.setItem('app-theme', theme);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('app-dark-mode', newDarkMode.toString());
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};