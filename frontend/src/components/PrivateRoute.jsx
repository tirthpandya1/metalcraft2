import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
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
  const isAuthenticated = () => {
    const token = localStorage.getItem('access_token');
    
    // Check if token exists
    if (!token) return false;

    // Optional: Add token expiration check
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      return tokenPayload.exp > currentTime;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  // Automatically refresh token if it's close to expiration
  const refreshTokenIfNeeded = async () => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!token || !refreshToken) return;

    try {
      const response = await axios.post('/api/token/refresh/', {
        refresh: refreshToken
      });

      localStorage.setItem('access_token', response.data.access);
      axios.defaults.headers.common['Authorization'] = 
        `Bearer ${response.data.access}`;
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  };

  // Check authentication and potentially refresh token
  React.useEffect(() => {
    if (isAuthenticated()) {
      refreshTokenIfNeeded();
    }
  }, []);

  return isAuthenticated() ? (
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
  ) : <Navigate to="/login" replace />;
};

export default PrivateRoute;
