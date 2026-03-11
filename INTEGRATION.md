

# Dark Theme & Accessibility Panel — Integration Guide

## File Structure

```
frontend/src/
├── context/
│   └── ThemeContext.tsx        ← theme + accessibility provider
├── components/
│   └── AccessibilityPanel.tsx  ← floating button + panel
└── App.tsx                     ← updated App with provider
```

## Setup Steps

### 1. Create folders
```bash
mkdir -p frontend/src/context
mkdir -p frontend/src/components
```

### 2. Copy files
- `ThemeContext.tsx` → `frontend/src/context/ThemeContext.tsx`
- `AccessibilityPanel.tsx` → `frontend/src/components/AccessibilityPanel.tsx`
- `App.tsx` → `frontend/src/App.tsx`

### 3. Imports in App.tsx are already configured:
```tsx
import { AppThemeProvider } from './context/ThemeContext';
import AccessibilityPanel from './components/AccessibilityPanel';
```

### 4. Using the dark theme in your own components (optional)
```tsx
import { useAppTheme } from '../context/ThemeContext';
import { useTheme } from '@mui/material';

const MyComponent = () => {
    const { darkMode } = useAppTheme();
    const theme = useTheme(); // MUI theme updates automatically

    return (
        <Box sx={{
            bgcolor: 'background.paper', // automatically dark/light
            color: 'text.primary',
        }}>
            ...
        </Box>
    );
};
```

## Feature Reference

| Feature | Description | Persisted |
|---------|-------------|-----------|
| Dark Mode | Switches dark/light theme via MUI ThemeProvider | ✅ localStorage |
| Text Size | A / A+ / A++ (14px / 17px / 20px) | ✅ localStorage |
| High Contrast | WCAG AAA compliant mode | ✅ localStorage |
| Dyslexia Font | Comic Sans style for improved readability | ✅ localStorage |
| Line Spacing | Normal / Wide line height | ✅ localStorage |
| Reduced Motion | Disables all CSS animations | ✅ localStorage |
| Cursor Size | Standard / Large cursor | ✅ localStorage |



-------------------------------------------------------------------------------------------------------------

# Подключение тёмной темы и панели доступности

## Структура файлов

```
frontend/src/
├── context/
│   └── ThemeContext.tsx        ← провайдер темы + доступности
├── components/
│   └── AccessibilityPanel.tsx  ← плавающая кнопка + панель
└── App.tsx                     ← обновлённый App с провайдером
```

## Шаги установки

### 1. Создайте папки
```bash
mkdir -p frontend/src/context
mkdir -p frontend/src/components
```

### 2. Скопируйте файлы
- `ThemeContext.tsx` → `frontend/src/context/ThemeContext.tsx`
- `AccessibilityPanel.tsx` → `frontend/src/components/AccessibilityPanel.tsx`
- `App.tsx` → `frontend/src/App.tsx`

### 3. Импорты в App.tsx уже настроены:
```tsx
import { AppThemeProvider } from './context/ThemeContext';
import AccessibilityPanel from './components/AccessibilityPanel';
```

### 4. Использование тёмной темы в своих компонентах (опционально)
```tsx
import { useAppTheme } from '../context/ThemeContext';
import { useTheme } from '@mui/material';

const MyComponent = () => {
    const { darkMode } = useAppTheme();
    const theme = useTheme(); // MUI тема обновляется автоматически

    return (
        <Box sx={{
            bgcolor: 'background.paper', // автоматически тёмный/светлый
            color: 'text.primary',
        }}>
            ...
        </Box>
    );
};
```

## Что делает каждая функция

| Функция | Описание | Сохраняется |
|---------|----------|-------------|
| Dark Mode | Переключает тёмную/светлую тему через MUI ThemeProvider | ✅ localStorage |
| Размер текста | A / A+ / A++ (14px / 17px / 20px) | ✅ localStorage |
| Высокий контраст | WCAG AAA режим | ✅ localStorage |
| Дислексия-шрифт | Comic Sans стиль для читаемости | ✅ localStorage |
| Межстрочный интервал | Нормальный / Широкий | ✅ localStorage |
| Уменьшение анимации | Отключает все CSS анимации | ✅ localStorage |
| Размер курсора | Стандартный / Большой | ✅ localStorage |
