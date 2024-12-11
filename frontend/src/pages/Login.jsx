import React, { useState } from 'react';
import { 
  Button, 
  TextField, 
  Box, 
  Typography, 
  Container, 
  Paper 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { handleApiError, withErrorHandling } from '../utils/errorHandler';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await authService.login(username, password);
      
      // Store authentication token
      localStorage.setItem('authToken', response.token);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      // Use centralized error handling with custom message
      handleApiError(error, {
        message: 'Login failed. Please check your credentials.',
        silent: false  // Ensure user sees the error
      });
    }
  };

  return (
    <Container maxWidth="xs">
      <Paper 
        elevation={3} 
        sx={{ 
          marginTop: 8, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: 4 
        }}
      >
        <Typography component="h1" variant="h5">
          Sign in to Metalcraft
        </Typography>
        <Box 
          component="form" 
          onSubmit={handleLogin} 
          sx={{ width: '100%', mt: 1 }}
        >
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default withErrorHandling(Login);
