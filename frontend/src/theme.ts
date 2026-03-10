import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        primary: {
            main: '#2b4d7e',
        },
        secondary: {
            main: '#f5a623',
        },
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
        h2: {
            fontWeight: 700,
            textTransform: 'uppercase',
        },
    },
});