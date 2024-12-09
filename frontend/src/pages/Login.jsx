import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Container,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await authService.login(username, password);
      navigate('/dashboard');  // Redirect to dashboard after successful login
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box 
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign in to Metalcraft
        </Typography>
        <Paper 
          elevation={3} 
          sx={{ 
            padding: 3, 
            marginTop: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ width: '100%', marginBottom: 2 }}
              >
                {error}
              </Alert>
            )}
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
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
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/register')}
            >
              Register
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;
