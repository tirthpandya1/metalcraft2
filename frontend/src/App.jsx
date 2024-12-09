import React from 'react';
import { 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';

// Import pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Sidebar from './components/Sidebar';

// Import MUI components and theming
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CssBaseline } from '@mui/material';

// Import other pages
import WorkOrders from './pages/WorkOrders';
import Materials from './pages/Materials';
import Products from './pages/Products';
import Workstations from './pages/Workstations';

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7aa2f7',  // Primary color
    },
    secondary: {
      main: '#9ece6a',  // Secondary color
    },
    background: {
      default: '#1a1b26',  // Main background
      paper: '#16161e',    // Paper/card background
    },
    text: {
      primary: '#c0caf5',  // Primary text
      secondary: '#6272a4', // Secondary text
    },
    error: {
      main: '#f7768e',     // Error/destructive color
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: {
      color: '#c0caf5',
    },
    h2: {
      color: '#c0caf5',
    },
    body1: {
      color: '#c0caf5',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        body {
          background-color: #1a1b26;
          color: #c0caf5;
        }
        ::-webkit-scrollbar {
          width: 12px;
        }
        ::-webkit-scrollbar-track {
          background: #16161e;
        }
        ::-webkit-scrollbar-thumb {
          background: #2a2b3d;
          border-radius: 6px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #3a3b4d;
        }
      `,
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#16161e',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#16161e',
          color: '#c0caf5',
          borderColor: '#2a2b3d',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
        },
        containedPrimary: {
          backgroundColor: '#7aa2f7',
          '&:hover': {
            backgroundColor: '#89b4fa',
          },
        },
        containedSecondary: {
          backgroundColor: '#9ece6a',
          '&:hover': {
            backgroundColor: '#a9dc76',
          },
        },
      },
    },
  },
});

// Wrapper component for protected routes with Sidebar
const ProtectedRoute = ({ children }) => {
  // Check authentication (you can modify this logic)
  const isAuthenticated = localStorage.getItem('token') !== null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Sidebar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto',
          padding: 3,
          width: 'calc(100% - 240px)' // Adjust based on Sidebar width
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/work-orders" 
          element={
            <ProtectedRoute>
              <WorkOrders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/materials" 
          element={
            <ProtectedRoute>
              <Materials />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/products" 
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/workstations" 
          element={
            <ProtectedRoute>
              <Workstations />
            </ProtectedRoute>
          } 
        />

        {/* Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
