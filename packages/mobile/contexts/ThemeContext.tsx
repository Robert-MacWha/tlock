import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
    DefaultTheme as NavLightTheme,
    DarkTheme as NavDarkTheme,
    ThemeProvider as NavThemeProvider,
} from '@react-navigation/native';
import { adaptNavigationTheme, MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { customDarkTheme, customLightTheme } from '../lib/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => Promise<void>;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_mode';

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

    const isDark = themeMode === 'system'
        ? systemColorScheme === 'dark'
        : themeMode === 'dark';

    const lightTheme = {
        ...MD3LightTheme,
        colors: customLightTheme.colors,
    };

    const darkTheme = {
        ...MD3DarkTheme,
        colors: customDarkTheme.colors,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { LightTheme, DarkTheme } = adaptNavigationTheme({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        reactNavigationLight: NavLightTheme,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        reactNavigationDark: NavDarkTheme,
        materialLight: lightTheme,
        materialDark: darkTheme
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const currentNavTheme = isDark
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        ? { ...DarkTheme, fonts: NavDarkTheme.fonts }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        : { ...LightTheme, fonts: NavLightTheme.fonts };

    const currentPaperTheme = isDark ? darkTheme : lightTheme;

    // Load saved theme preference
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const saved = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
                if (saved && ['light', 'dark', 'system'].includes(saved)) {
                    setThemeModeState(saved as ThemeMode);
                }
            } catch (error) {
                console.warn('Failed to load theme preference:', error);
            }
        };
        void loadTheme();
    }, []);

    const setThemeMode = async (mode: ThemeMode) => {
        try {
            await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
            setThemeModeState(mode);
        } catch (error) {
            console.warn('Failed to save theme preference:', error);
            setThemeModeState(mode); // Still update state even if storage fails
        }
    };

    return (
        <ThemeContext.Provider value={{ themeMode, setThemeMode, isDark }}>
            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
            <NavThemeProvider value={currentNavTheme}>
                <PaperProvider theme={currentPaperTheme}>
                    {children}
                </PaperProvider>
            </NavThemeProvider>
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