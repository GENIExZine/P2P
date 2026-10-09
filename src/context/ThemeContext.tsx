import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeMode } from '../types';
import { DarkThemeColors, LightThemeColors, ThemeColors } from '../constants/colors';
import { LocalStorage } from '../services/storage/localStorage';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  isDark: true,
  colors: DarkThemeColors,
  setThemeMode: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme(); // 'dark' | 'light' | null
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    LocalStorage.getThemeMode().then(saved => {
      if (saved) setThemeModeState(saved);
    });
  }, []);

  const isDark = themeMode === 'system' ? systemScheme !== 'light' : themeMode === 'dark';
  const colors = isDark ? DarkThemeColors : LightThemeColors;

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await LocalStorage.saveThemeMode(mode);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, colors, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
