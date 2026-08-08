import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { themes } from '../theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const colorScheme = Appearance.getColorScheme() || 'dark';
  const [mode, setMode] = useState(colorScheme === 'light' ? 'light' : 'dark');

  useEffect(() => {
    const listener = ({ colorScheme: scheme }) => {
      setMode(scheme === 'light' ? 'light' : 'dark');
    };

    const subscription = Appearance.addChangeListener(listener);
    return () => subscription.remove();
  }, []);

  const theme = useMemo(() => themes[mode], [mode]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode }}>
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
