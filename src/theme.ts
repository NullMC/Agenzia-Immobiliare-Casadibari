import { createTheme, alpha } from '@mui/material/styles';

const green = '#35a94a';
const greenDark = '#218337';
const ink = '#18251c';
const muted = '#68736b';
const border = '#e3eae3';

export const casadibariTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: green, dark: greenDark, light: '#e9f6eb', contrastText: '#ffffff' },
    secondary: { main: '#34473a', contrastText: '#ffffff' },
    success: { main: greenDark },
    background: { default: '#ffffff', paper: '#ffffff' },
    text: { primary: ink, secondary: muted },
    divider: border,
    error: { main: '#c53b3b' }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica Neue", Arial, sans-serif',
    button: { fontWeight: 700, textTransform: 'none', letterSpacing: '0.01em' },
    h1: { fontWeight: 750, letterSpacing: '-0.04em', lineHeight: 1.08 },
    h2: { fontWeight: 750, letterSpacing: '-0.035em', lineHeight: 1.15 },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    body1: { lineHeight: 1.7 },
    body2: { lineHeight: 1.6 }
  },
  shape: { borderRadius: 12 },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { scrollBehavior: 'smooth', WebkitFontSmoothing: 'antialiased' },
        body: { minWidth: 320, color: ink, backgroundColor: '#fff' },
        '::selection': { backgroundColor: alpha(green, 0.2) }
      }
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 9, minHeight: 42, padding: '10px 18px', fontWeight: 700, textTransform: 'none', gap: 6, transition: 'transform .18s ease, background-color .18s ease' },
        containedPrimary: { backgroundColor: green, '&:hover': { backgroundColor: greenDark, transform: 'translateY(-1px)' } },
        outlinedPrimary: { borderColor: alpha(green, 0.35), '&:hover': { borderColor: green, backgroundColor: alpha(green, 0.05) } },
        sizeSmall: { minHeight: 34, padding: '6px 12px' },
        sizeLarge: { minHeight: 50, padding: '13px 22px' }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 10, '&:hover': { backgroundColor: alpha(green, 0.09) } },
        colorPrimary: { color: greenDark }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: { border: '1px solid ' + border, borderRadius: 16, boxShadow: '0 7px 24px rgba(22, 44, 26, 0.045)', backgroundImage: 'none' }
      }
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 16 },
        outlined: { borderColor: border }
      }
    },
    MuiTextField: {
      defaultProps: { size: 'small', fullWidth: true, variant: 'outlined' }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 9, backgroundColor: '#fff', '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(green, 0.65) }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2, borderColor: green } },
        notchedOutline: { borderColor: '#d6dfd6' }
      }
    },
    MuiInputLabel: { styleOverrides: { root: { color: muted, '&.Mui-focused': { color: greenDark } } } },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 7, fontWeight: 700 },
        colorSuccess: { backgroundColor: '#e7f6e9', color: greenDark }
      }
    },
    MuiAlert: { styleOverrides: { root: { borderRadius: 10, alignItems: 'center' } } },
    MuiTableCell: { styleOverrides: { head: { color: muted, fontWeight: 700, backgroundColor: '#f7faf7' } } }
  }
});
