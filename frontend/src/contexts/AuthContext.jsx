import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on app load
    const checkAuthStatus = async () => {
      try {
        const storedUser = authService.getCurrentUser();
        const authenticated = authService.isAuthenticated();
        
        setUser(storedUser);
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error('Authentication check failed', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (username, password) => {
    try {
      const userData = await authService.login(username, password);
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      const userData = await authService.register(username, email, password);
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isLoading, 
        login, 
        register, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
