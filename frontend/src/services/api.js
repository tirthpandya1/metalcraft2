import axios from 'axios';

// Base URL for API
const BASE_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authentication Service
export const authService = {
  // Register a new user
  async register(username, email, password) {
    try {
      const response = await api.post('/auth/register/', { 
        username, 
        email, 
        password 
      });
      
      // Store token and user info in localStorage
      this.setCurrentUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      throw error;
    }
  },

  // Login user
  async login(username, password) {
    try {
      const response = await api.post('/auth/login/', { 
        username, 
        password 
      });
      
      // Ensure we store the token correctly
      const token = response.data.token || response.data.key;
      localStorage.setItem('token', token);
      
      // Store user info
      this.setCurrentUser({
        ...response.data.user,
        token
      });
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data);
      throw error;
    }
  },

  // Logout user
  async logout() {
    try {
      await api.post('/auth/logout/');
      this.clearCurrentUser();
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // Store current user in localStorage
  setCurrentUser(userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  },

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Clear current user from localStorage
  clearCurrentUser() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};

// API Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 (Unauthorized) errors
    if (error.response && error.response.status === 401) {
      // Token might be expired or invalid
      authService.clearCurrentUser();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic API Service
const apiService = {
  // GET all items
  async getAll(endpoint) {
    try {
      const response = await api.get(`/${endpoint}/`);
      console.log(`${endpoint} API response:`, response);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  },

  // GET single item by ID
  async getById(endpoint, id) {
    try {
      const response = await api.get(`/${endpoint}/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${endpoint} by ID:`, error);
      throw error;
    }
  },

  // CREATE new item
  async create(endpoint, data) {
    try {
      const response = await api.post(`/${endpoint}/`, data);
      return response.data;
    } catch (error) {
      console.error(`Error creating ${endpoint}:`, error);
      throw error;
    }
  },

  // UPDATE item by ID
  async update(endpoint, id, data) {
    try {
      const response = await api.put(`/${endpoint}/${id}/`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating ${endpoint}:`, error);
      throw error;
    }
  },

  // DELETE item by ID
  async delete(endpoint, id) {
    try {
      const response = await api.delete(`/${endpoint}/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting ${endpoint}:`, error);
      throw error;
    }
  }
};

// Specific service for each model
export const workStationService = {
  async getAll() {
    try {
      const response = await apiService.getAll('workstations');
      return response;
    } catch (error) {
      console.error('Error fetching workstations:', error);
      throw error;
    }
  },
  getById: (id) => apiService.getById('workstations', id),
  create: (data) => apiService.create('workstations', data),
  update: (id, data) => apiService.update('workstations', id, data),
  delete: (id) => apiService.delete('workstations', id)
};

export const materialService = {
  getAll: () => apiService.getAll('materials'),
  getById: (id) => apiService.getById('materials', id),
  create: (data) => apiService.create('materials', data),
  update: (id, data) => apiService.update('materials', id, data),
  delete: (id) => apiService.delete('materials', id)
};

export const productService = {
  getAll: () => apiService.getAll('products'),
  getById: (id) => apiService.getById('products', id),
  create: (data) => apiService.create('products', data),
  update: (id, data) => apiService.update('products', id, data),
  delete: (id) => apiService.delete('products', id)
};

export const workOrderService = {
  getAll: () => apiService.getAll('work-orders'),
  getById: (id) => apiService.getById('work-orders', id),
  create: (data) => apiService.create('work-orders', data),
  update: (id, data) => apiService.update('work-orders', id, data),
  delete: (id) => apiService.delete('work-orders', id)
};

export default api;
