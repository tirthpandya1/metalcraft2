import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/api';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Sidebar from './Sidebar';

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Blue theme color
    },
  },
});

const PrivateRoute = () => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <Sidebar />
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            height: '100vh', 
            overflow: 'auto',
            padding: 3,
            marginLeft: '240px' // Match Sidebar width
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default PrivateRoute;
