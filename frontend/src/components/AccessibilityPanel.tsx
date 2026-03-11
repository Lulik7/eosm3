import React, { useState } from 'react';
import {
    Box, IconButton, Tooltip, Typography, Slider, Switch,
    FormControlLabel, Divider, Button, Stack, Chip,
    Fade, Paper, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import {
    Accessibility as AccessibilityIcon,
    Close as CloseIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    TextFields as TextIcon,
    Contrast as ContrastIcon,
    Animation as MotionIcon,
    FormatLineSpacing as LineSpacingIcon,
    Mouse as CursorIcon,
    RestartAlt as ResetIcon,
    Spellcheck as DyslexicIcon
} from '@mui/icons-material';
import {useAppTheme} from "../context/ThemeContext";


const AccessibilityPanel: React.FC = () => {
    const { darkMode, toggleDarkMode, accessibility, updateAccessibility, resetAccessibility } = useAppTheme();
    const [open, setOpen] = useState(false);

    const primaryColor = darkMode ? '#4a9eff' : '#2b4d7e';
    const accentColor = '#f5a623';

    const panelBg = darkMode ? '#1a1a2e' : '#ffffff';
    const panelBorder = darkMode ? '#2d2d4e' : '#e0e8f0';
    const textColor = darkMode ? '#e0e0e0' : '#1a2a40';

    return (
        <>
            {/* Floating trigger button */}
            <Box sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 1,
            }}>
                {/* Panel */}
                <Fade in={open} unmountOnExit>
                    <Paper elevation={12} sx={{
                        width: { xs: 300, sm: 340 },
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        borderRadius: 2,
                        border: `2px solid ${panelBorder}`,
                        bgcolor: panelBg,
                        color: textColor,
                        '&::-webkit-scrollbar': { width: 4 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: primaryColor, borderRadius: 2 },
                    }}>
                        {/* Header */}
                        <Box sx={{
                            p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            bgcolor: primaryColor, color: 'white', borderRadius: '6px 6px 0 0'
                        }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <AccessibilityIcon sx={{ fontSize: 22 }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 900, letterSpacing: 0.5 }}>
                                    Accessibility
                                </Typography>
                            </Stack>
                            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>

                        <Box sx={{ p: 2.5 }}>

                            {/* ── Dark Mode ── */}
                            <Section title="Theme" icon={darkMode ? <DarkModeIcon /> : <LightModeIcon />} color={primaryColor}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" sx={{ color: textColor }}>
                                        {darkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
                                    </Typography>
                                    <Box
                                        onClick={toggleDarkMode}
                                        sx={{
                                            width: 56, height: 28, borderRadius: 14,
                                            bgcolor: darkMode ? primaryColor : '#ccc',
                                            cursor: 'pointer', position: 'relative',
                                            transition: 'background-color 0.3s',
                                            border: `2px solid ${darkMode ? primaryColor : '#aaa'}`,
                                        }}
                                        role="switch"
                                        aria-checked={darkMode}
                                        aria-label="Toggle dark mode"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && toggleDarkMode()}
                                    >
                                        <Box sx={{
                                            position: 'absolute', top: 2,
                                            left: darkMode ? 28 : 2,
                                            width: 20, height: 20, borderRadius: '50%',
                                            bgcolor: 'white', transition: 'left 0.3s',
                                            boxShadow: 1,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 12,
                                        }}>
                                            {darkMode ? '🌙' : '☀️'}
                                        </Box>
                                    </Box>
                                </Stack>
                            </Section>

                            <Divider sx={{ my: 1.5, borderColor: panelBorder }} />

                            {/* ── Font Size ── */}
                            <Section title="Text Size" icon={<TextIcon />} color={primaryColor}>
                                <ToggleButtonGroup
                                    value={accessibility.fontSize}
                                    exclusive
                                    onChange={(_, v) => v && updateAccessibility('fontSize', v)}
                                    fullWidth size="small"
                                    aria-label="Font size"
                                >
                                    <ToggleButton value="normal" aria-label="Normal text" sx={{ fontSize: '0.75rem', fontWeight: 'bold', borderColor: panelBorder }}>A</ToggleButton>
                                    <ToggleButton value="large" aria-label="Large text" sx={{ fontSize: '0.95rem', fontWeight: 'bold', borderColor: panelBorder }}>A+</ToggleButton>
                                    <ToggleButton value="xlarge" aria-label="Extra large text" sx={{ fontSize: '1.15rem', fontWeight: 'bold', borderColor: panelBorder }}>A++</ToggleButton>
                                </ToggleButtonGroup>
                                <Typography variant="caption" sx={{ color: darkMode ? '#8b949e' : '#888', mt: 0.5, display: 'block' }}>
                                    Current: {accessibility.fontSize === 'normal' ? '14px' : accessibility.fontSize === 'large' ? '17px' : '20px'}
                                </Typography>
                            </Section>

                            <Divider sx={{ my: 1.5, borderColor: panelBorder }} />

                            {/* ── High Contrast ── */}
                            <Section title="High Contrast" icon={<ContrastIcon />} color={primaryColor}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={accessibility.highContrast}
                                            onChange={(e) => updateAccessibility('highContrast', e.target.checked)}
                                            color="primary"
                                            inputProps={{ 'aria-label': 'High contrast mode' }}
                                        />
                                    }
                                    label={
                                        <Typography variant="body2" sx={{ color: textColor }}>
                                            {accessibility.highContrast ? 'On — Maximum contrast' : 'Off — Standard contrast'}
                                        </Typography>
                                    }
                                />
                                {accessibility.highContrast && (
                                    <Chip label="WCAG AAA compliant" size="small" sx={{ bgcolor: '#27ae60', color: 'white', fontSize: '0.65rem' }} />
                                )}
                            </Section>

                            <Divider sx={{ my: 1.5, borderColor: panelBorder }} />

                            {/* ── Dyslexic Font ── */}
                            <Section title="Dyslexia-Friendly Font" icon={<DyslexicIcon />} color={primaryColor}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={accessibility.dyslexicFont}
                                            onChange={(e) => updateAccessibility('dyslexicFont', e.target.checked)}
                                            color="primary"
                                            inputProps={{ 'aria-label': 'Dyslexia friendly font' }}
                                        />
                                    }
                                    label={
                                        <Typography variant="body2" sx={{
                                            color: textColor,
                                            fontFamily: accessibility.dyslexicFont ? '"Comic Sans MS", cursive' : 'inherit'
                                        }}>
                                            {accessibility.dyslexicFont ? 'Comic Sans style active' : 'Standard font'}
                                        </Typography>
                                    }
                                />
                            </Section>

                            <Divider sx={{ my: 1.5, borderColor: panelBorder }} />

                            {/* ── Line Spacing ── */}
                            <Section title="Line Spacing" icon={<LineSpacingIcon />} color={primaryColor}>
                                <ToggleButtonGroup
                                    value={accessibility.lineSpacing}
                                    exclusive
                                    onChange={(_, v) => v && updateAccessibility('lineSpacing', v)}
                                    fullWidth size="small"
                                    aria-label="Line spacing"
                                >
                                    <ToggleButton value="normal" aria-label="Normal spacing" sx={{ borderColor: panelBorder }}>
                                        <Stack alignItems="center">
                                            <Typography variant="caption" sx={{ fontSize: '0.6rem', lineHeight: 1 }}>Normal</Typography>
                                        </Stack>
                                    </ToggleButton>
                                    <ToggleButton value="wide" aria-label="Wide spacing" sx={{ borderColor: panelBorder }}>
                                        <Stack alignItems="center">
                                            <Typography variant="caption" sx={{ fontSize: '0.6rem', lineHeight: 2 }}>Wide</Typography>
                                        </Stack>
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Section>

                            <Divider sx={{ my: 1.5, borderColor: panelBorder }} />

                            {/* ── Reduced Motion ── */}
                            <Section title="Reduced Motion" icon={<MotionIcon />} color={primaryColor}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={accessibility.reducedMotion}
                                            onChange={(e) => updateAccessibility('reducedMotion', e.target.checked)}
                                            color="primary"
                                            inputProps={{ 'aria-label': 'Reduce animations' }}
                                        />
                                    }
                                    label={
                                        <Typography variant="body2" sx={{ color: textColor }}>
                                            {accessibility.reducedMotion ? 'Animations disabled' : 'Animations enabled'}
                                        </Typography>
                                    }
                                />
                            </Section>

                            <Divider sx={{ my: 1.5, borderColor: panelBorder }} />

                            {/* ── Cursor Size ── */}
                            <Section title="Cursor Size" icon={<CursorIcon />} color={primaryColor}>
                                <ToggleButtonGroup
                                    value={accessibility.cursorSize}
                                    exclusive
                                    onChange={(_, v) => v && updateAccessibility('cursorSize', v)}
                                    fullWidth size="small"
                                    aria-label="Cursor size"
                                >
                                    <ToggleButton value="normal" aria-label="Normal cursor" sx={{ borderColor: panelBorder }}>Normal</ToggleButton>
                                    <ToggleButton value="large" aria-label="Large cursor" sx={{ borderColor: panelBorder }}>Large 🖱️</ToggleButton>
                                </ToggleButtonGroup>
                            </Section>

                            <Divider sx={{ my: 2, borderColor: panelBorder }} />

                            {/* Reset */}
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<ResetIcon />}
                                onClick={resetAccessibility}
                                sx={{
                                    borderColor: primaryColor, color: primaryColor, borderRadius: 1,
                                    fontWeight: 'bold', '&:hover': { bgcolor: primaryColor, color: 'white' }
                                }}
                                aria-label="Reset all accessibility settings"
                            >
                                Reset to Default
                            </Button>

                            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1.5, color: darkMode ? '#666' : '#aaa' }}>
                                Settings are saved automatically
                            </Typography>
                        </Box>
                    </Paper>
                </Fade>

                {/* FAB button */}
                <Tooltip title={open ? 'Close accessibility panel' : 'Accessibility & Theme settings'} placement="left">
                    <Box
                        onClick={() => setOpen(prev => !prev)}
                        role="button"
                        tabIndex={0}
                        aria-label="Toggle accessibility panel"
                        aria-expanded={open}
                        onKeyDown={(e) => e.key === 'Enter' && setOpen(p => !p)}
                        sx={{
                            width: 56, height: 56, borderRadius: '50%',
                            bgcolor: open ? '#d32f2f' : primaryColor,
                            color: 'white', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                            transition: 'all 0.3s',
                            '&:hover': { transform: 'scale(1.1)', boxShadow: '0 6px 24px rgba(0,0,0,0.4)' },
                        }}
                    >
                        {open
                            ? <CloseIcon sx={{ fontSize: 26 }} />
                            : <AccessibilityIcon sx={{ fontSize: 26 }} />
                        }
                    </Box>
                </Tooltip>
            </Box>
        </>
    );
};

// ── Helper component ──────────────────────────
const Section: React.FC<{ title: string; icon: React.ReactNode; color: string; children: React.ReactNode }> = ({ title, icon, color, children }) => (
    <Box sx={{ mb: 0.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Box sx={{ color, display: 'flex', '& svg': { fontSize: 18 } }}>{icon}</Box>
            <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.8, color, fontSize: '0.65rem' }}>
                {title}
            </Typography>
        </Stack>
        {children}
    </Box>
);

export default AccessibilityPanel;
