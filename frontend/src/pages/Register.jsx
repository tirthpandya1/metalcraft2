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

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Basic client-side validation
    if (password !== confirmPassword) {
      handleApiError(new Error('Passwords do not match'), {
        message: 'Passwords do not match. Please try again.',
        silent: false
      });
      return;
    }

    try {
      const response = await authService.register({
        username,
        email,
        password
      });
      
      // Store authentication token if returned
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      
      // Redirect to login or dashboard
      navigate('/login');
    } catch (error) {
      // Use centralized error handling with custom message
      handleApiError(error, {
        message: 'Registration failed. Please check your details.',
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
          Register for Metalcraft
        </Typography>
        <Box 
          component="form" 
          onSubmit={handleRegister} 
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
            label="Email Address"
            name="email"
            autoComplete="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="confirm-password"
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2 }}
          >
            Register
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default withErrorHandling(Register);
