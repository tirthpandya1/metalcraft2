import React from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Box, 
  Paper 
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { formatLocalDateTime } from '../utils/timeUtils';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    this.setState({ 
      error, 
      errorInfo 
    });
    
    // Optional: Send error to logging service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = async (error, errorInfo) => {
    try {
      await fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: error.toString(),
          errorInfo: errorInfo,
          timestamp: formatLocalDateTime(new Date().toISOString()),
          user: localStorage.getItem('username') || 'anonymous'
        })
      });
    } catch (logError) {
      console.error('Failed to log error', logError);
    }
  };

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm">
          <Paper 
            elevation={3} 
            sx={{ 
              mt: 8, 
              p: 4, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center' 
            }}
          >
            <ErrorOutlineIcon 
              color="error" 
              sx={{ fontSize: 80, mb: 2 }} 
            />
            <Typography variant="h5" color="error" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body1" paragraph>
              An unexpected error occurred. Please try again later.
            </Typography>
            {this.state.error && (
              <Box 
                sx={{ 
                  bgcolor: 'error.light', 
                  color: 'error.contrastText', 
                  p: 2, 
                  borderRadius: 1,
                  mb: 2,
                  width: '100%',
                  overflow: 'auto'
                }}
              >
                <Typography variant="caption">
                  {this.state.error.toString()}
                </Typography>
              </Box>
            )}
            <Button 
              variant="contained" 
              color="primary" 
              onClick={this.handleReset}
            >
              Try Again
            </Button>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
