import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Before user setup: detect system mode (prefers-color-scheme). No system mode in toggle options.
  const [activeTheme, setActiveTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('qr_studio_theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      // Before manual setup: default to system mode
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    } catch (e) {
      console.error('Error reading theme preference', e);
    }
    return 'dark';
  });

  // Strict 2-way toggle between Light and Dark
  const toggleTheme = () => {
    setActiveTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setThemeSetting = (theme) => {
    if (theme === 'dark' || theme === 'light') {
      setActiveTheme(theme);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (activeTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('qr_studio_theme', activeTheme);
    } catch (e) {
      console.error('Error saving theme', e);
    }
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ 
      activeTheme, 
      themeSetting: activeTheme, 
      setThemeSetting, 
      toggleTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
