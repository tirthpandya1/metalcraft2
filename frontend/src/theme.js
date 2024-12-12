import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // A professional blue
      light: '#4791db',
      dark: '#115293',
    },
    secondary: {
      main: '#dc004e', // A complementary accent color
      light: '#ff4081',
      dark: '#9a0036',
    },
    background: {
      default: '#f4f4f4',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Prevents uppercase transformation
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: 16,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 0, 0, 0.23)', // Default border color
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 0, 0, 0.87)', // Slightly darker on hover
          }
        },
        notchedOutline: {
          borderColor: 'rgba(0, 0, 0, 0.23)',
        }
      }
    }
  },
});

export default theme;
