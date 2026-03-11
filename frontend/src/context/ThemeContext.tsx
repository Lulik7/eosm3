import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface AccessibilitySettings {
    fontSize: 'normal' | 'large' | 'xlarge';
    highContrast: boolean;
    reducedMotion: boolean;
    dyslexicFont: boolean;
    lineSpacing: 'normal' | 'wide';
    cursorSize: 'normal' | 'large';
}

interface AppThemeContextType {
    darkMode: boolean;
    toggleDarkMode: () => void;
    accessibility: AccessibilitySettings;
    updateAccessibility: (key: keyof AccessibilitySettings, value: any) => void;
    resetAccessibility: () => void;
}

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────
const defaultAccessibility: AccessibilitySettings = {
    fontSize: 'normal',
    highContrast: false,
    reducedMotion: false,
    dyslexicFont: false,
    lineSpacing: 'normal',
    cursorSize: 'normal',
};

const AppThemeContext = createContext<AppThemeContextType>({
    darkMode: false,
    toggleDarkMode: () => {},
    accessibility: defaultAccessibility,
    updateAccessibility: () => {},
    resetAccessibility: () => {},
});

export const useAppTheme = () => useContext(AppThemeContext);

// ─────────────────────────────────────────────
// Font size map
// ─────────────────────────────────────────────
const fontSizeMap = {
    normal: 14,
    large: 17,
    xlarge: 20,
};

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [darkMode, setDarkMode] = useState<boolean>(() => {
        try { return localStorage.getItem('darkMode') === 'true'; } catch { return false; }
    });

    const [accessibility, setAccessibility] = useState<AccessibilitySettings>(() => {
        try {
            const saved = localStorage.getItem('accessibility');
            return saved ? { ...defaultAccessibility, ...JSON.parse(saved) } : defaultAccessibility;
        } catch { return defaultAccessibility; }
    });

    const toggleDarkMode = () => setDarkMode(prev => {
        const next = !prev;
        try { localStorage.setItem('darkMode', String(next)); } catch {}
        return next;
    });

    const updateAccessibility = (key: keyof AccessibilitySettings, value: any) => {
        setAccessibility(prev => {
            const next = { ...prev, [key]: value };
            try { localStorage.setItem('accessibility', JSON.stringify(next)); } catch {}
            return next;
        });
    };

    const resetAccessibility = () => {
        setAccessibility(defaultAccessibility);
        try { localStorage.setItem('accessibility', JSON.stringify(defaultAccessibility)); } catch {}
    };

    // Apply global CSS effects
    useEffect(() => {
        const root = document.documentElement;

        // Font size
        root.style.fontSize = fontSizeMap[accessibility.fontSize] + 'px';

        // Dyslexic font
        if (accessibility.dyslexicFont) {
            root.style.fontFamily = '"OpenDyslexic", "Comic Sans MS", cursive';
        } else {
            root.style.fontFamily = '';
        }

        // Line spacing
        root.style.lineHeight = accessibility.lineSpacing === 'wide' ? '2' : '';

        // Reduced motion
        if (accessibility.reducedMotion) {
            const style = document.getElementById('reduced-motion-style') || document.createElement('style');
            style.id = 'reduced-motion-style';
            style.textContent = '*, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }';
            document.head.appendChild(style);
        } else {
            document.getElementById('reduced-motion-style')?.remove();
        }

        // Cursor size
        if (accessibility.cursorSize === 'large') {
            root.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'%3E%3Cpath d=\'M0 0 L0 28 L8 20 L14 32 L18 30 L12 18 L24 18 Z\' fill=\'black\' stroke=\'white\' stroke-width=\'2\'/%3E%3C/svg%3E") 0 0, auto';
        } else {
            root.style.cursor = '';
        }

        // High contrast — override via CSS variables
        if (accessibility.highContrast) {
            root.style.setProperty('--hc-bg', darkMode ? '#000' : '#fff');
            root.style.setProperty('--hc-text', darkMode ? '#fff' : '#000');
            root.style.setProperty('--hc-border', darkMode ? '#fff' : '#000');
        } else {
            root.style.removeProperty('--hc-bg');
            root.style.removeProperty('--hc-text');
            root.style.removeProperty('--hc-border');
        }
    }, [accessibility, darkMode]);

    // MUI Theme
    const theme = useMemo(() => createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: { main: accessibility.highContrast ? (darkMode ? '#fff' : '#000') : '#2b4d7e' },
            secondary: { main: '#f5a623' },
            background: {
                default: darkMode
                    ? (accessibility.highContrast ? '#000' : '#0d1117')
                    : (accessibility.highContrast ? '#fff' : '#f4f7f9'),
                paper: darkMode
                    ? (accessibility.highContrast ? '#111' : '#161b22')
                    : (accessibility.highContrast ? '#fff' : '#ffffff'),
            },
            text: {
                primary: darkMode
                    ? (accessibility.highContrast ? '#fff' : '#e6edf3')
                    : (accessibility.highContrast ? '#000' : '#1a2a40'),
                secondary: darkMode ? '#8b949e' : '#666',
            },
        },
        typography: {
            fontSize: fontSizeMap[accessibility.fontSize],
            fontFamily: accessibility.dyslexicFont
                ? '"OpenDyslexic", "Comic Sans MS", cursive'
                : '"Roboto", "Helvetica", "Arial", sans-serif',
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        ...(accessibility.highContrast && {
                            border: '2px solid currentColor',
                            fontWeight: 900,
                        }),
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        ...(accessibility.highContrast && darkMode && {
                            border: '1px solid #444',
                        }),
                    },
                },
            },
        },
    }), [darkMode, accessibility]);

    return (
        <AppThemeContext.Provider value={{ darkMode, toggleDarkMode, accessibility, updateAccessibility, resetAccessibility }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </AppThemeContext.Provider>
    );
};
