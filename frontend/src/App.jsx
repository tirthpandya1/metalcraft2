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

// Import existing pages
import WorkOrders from './pages/WorkOrders';
import Materials from './pages/Materials';
import Products from './pages/Products';
import Workstations from './pages/Workstations';

// Import new Production Line Management pages
import WorkstationProcesses from './pages/WorkstationProcesses';
import WorkstationEfficiency from './pages/WorkstationEfficiency';
import ProductionDesigns from './pages/ProductionDesigns';
import ProductionEvents from './pages/ProductionEvents';

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
  },
});

// Wrapper component for protected routes with Sidebar
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - 240px)` },
          backgroundColor: 'background.default',
          minHeight: '100vh'
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
        {/* Authentication Routes */}
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

        {/* New Production Line Management Routes */}
        <Route 
          path="/workstation-processes" 
          element={
            <ProtectedRoute>
              <WorkstationProcesses />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/workstation-efficiency" 
          element={
            <ProtectedRoute>
              <WorkstationEfficiency />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/production-designs" 
          element={
            <ProtectedRoute>
              <ProductionDesigns />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/production-events" 
          element={
            <ProtectedRoute>
              <ProductionEvents />
            </ProtectedRoute>
          } 
        />

        {/* Redirect to Dashboard by default */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
