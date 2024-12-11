import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

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
      // Only handle API error if it hasn't been handled already
      if (!error.handled) {
        handleApiError(error);
        error.handled = true;
      }
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
      // Only handle API error if it hasn't been handled already
      if (!error.handled) {
        handleApiError(error);
        error.handled = true;
      }
      throw error;
    }
  },

  // CREATE new item
  async create(endpoint, data) {
    try {
      console.log(`Attempting to create ${endpoint} with data:`, data);
      const response = await api.post(`/${endpoint}/`, data);
      return response.data;
    } catch (error) {
      console.error(`Error creating ${endpoint}:`, error);
      // Only handle API error if it hasn't been handled already
      if (!error.handled) {
        handleApiError(error);
        error.handled = true;
      }
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
      // Only handle API error if it hasn't been handled already
      if (!error.handled) {
        handleApiError(error);
        error.handled = true;
      }
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
      // Only handle API error if it hasn't been handled already
      if (!error.handled) {
        handleApiError(error);
        error.handled = true;
      }
      throw error;
    }
  }
};

// Specific service for each model
export const workstationService = {
  async getAll() {
    return apiService.getAll('workstations');
  },
  
  async getById(id) {
    return apiService.getById('workstations', id);
  },
  
  async create(data) {
    return apiService.create('workstations', data);
  },
  
  async update(id, data) {
    return apiService.update('workstations', id, data);
  },
  
  async delete(id) {
    return apiService.delete('workstations', id);
  }
};

export const materialService = {
  async getAll() {
    try {
      const response = await apiService.getAll('materials');
      return response;
    } catch (error) {
      console.error('Error fetching materials:', error);
      handleApiError(error);
      throw error;
    }
  },
  async getById(id) {
    try {
      const response = await apiService.getById('materials', id);
      return response;
    } catch (error) {
      console.error('Error fetching material by ID:', error);
      handleApiError(error);
      throw error;
    }
  },
  async create(data) {
    try {
      const response = await apiService.create('materials', data);
      return response;
    } catch (error) {
      console.error('Error creating material:', error);
      handleApiError(error);
      throw error;
    }
  },
  async update(id, data) {
    try {
      const response = await apiService.update('materials', id, data);
      return response;
    } catch (error) {
      console.error('Error updating material:', error);
      handleApiError(error);
      throw error;
    }
  },
  async delete(id) {
    try {
      const response = await apiService.delete('materials', id);
      return response;
    } catch (error) {
      console.error('Error deleting material:', error);
      handleApiError(error);
      throw error;
    }
  }
};

export const productService = {
  async getAll() {
    try {
      console.log('Attempting to fetch products via productService');
      
      // Fetch products
      const response = await api.get('/products/');
      
      console.log('Raw products response:', response);
      console.log('Response data:', response.data);
      
      // Validate the response
      if (!response || !response.data) {
        console.error('Invalid response structure');
        return [];
      }
      
      // Ensure we return an array
      const products = Array.isArray(response.data) ? response.data : [response.data];
      
      console.log('Processed products:', products);
      
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      
      // Log more details about the error
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      // Return an empty array to prevent breaking the application
      return [];
    }
  },
  async getById(id) {
    try {
      const response = await apiService.getById('products', id);
      return response;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      handleApiError(error);
      throw error;
    }
  },
  async create(data) {
    try {
      const response = await apiService.create('products', data);
      return response;
    } catch (error) {
      console.error('Error creating product:', error);
      handleApiError(error);
      throw error;
    }
  },
  async update(id, data) {
    try {
      const response = await apiService.update('products', id, data);
      return response;
    } catch (error) {
      console.error('Error updating product:', error);
      handleApiError(error);
      throw error;
    }
  },
  async delete(id) {
    try {
      const response = await apiService.delete('products', id);
      return response;
    } catch (error) {
      console.error('Error deleting product:', error);
      handleApiError(error);
      throw error;
    }
  }
};

export const workOrderService = {
  async getAll() {
    try {
      const response = await apiService.getAll('work-orders');
      return response;
    } catch (error) {
      console.error('Error fetching work orders:', error);
      handleApiError(error);
      throw error;
    }
  },
  async getById(id) {
    try {
      const response = await apiService.getById('work-orders', id);
      return response;
    } catch (error) {
      console.error('Error fetching work order by ID:', error);
      handleApiError(error);
      throw error;
    }
  },
  async create(data) {
    try {
      console.log('Creating Work Order with Data:', data);
      const response = await apiService.create('work-orders', data);
      return response;
    } catch (error) {
      console.error('Error creating work order:', error);
      console.error('Error Response:', error.response);
      console.error('Error Response Data:', error.response?.data);
      throw error;
    }
  },
  async update(id, data) {
    try {
      const response = await apiService.update('work-orders', id, data);
      return response;
    } catch (error) {
      console.error('Error updating work order:', error);
      handleApiError(error);
      throw error;
    }
  },
  async delete(id) {
    try {
      const response = await apiService.delete('work-orders', id);
      return response;
    } catch (error) {
      console.error('Error deleting work order:', error);
      handleApiError(error);
      throw error;
    }
  }
};

export const workstationEfficiencyService = {
  async getAll() {
    return apiService.getAll('workstation-efficiency');
  },
  
  async getById(id) {
    return apiService.getById('workstation-efficiency', id);
  },
  
  async create(data) {
    return apiService.create('workstation-efficiency', data);
  },
  
  async update(id, data) {
    return apiService.update('workstation-efficiency', id, data);
  },
  
  async delete(id) {
    return apiService.delete('workstation-efficiency', id);
  }
};

export const productionDesignService = {
  async getAll() {
    return apiService.getAll('production-designs');
  },
  
  async getById(id) {
    return apiService.getById('production-designs', id);
  },
  
  async create(data) {
    return apiService.create('production-designs', data);
  },
  
  async update(id, data) {
    return apiService.update('production-designs', id, data);
  },
  
  async delete(id) {
    return apiService.delete('production-designs', id);
  }
};

export const productionEventService = {
  async getAll() {
    return apiService.getAll('production-events');
  },
  
  async getById(id) {
    return apiService.getById('production-events', id);
  },
  
  async create(data) {
    return apiService.create('production-events', data);
  },
  
  async update(id, data) {
    return apiService.update('production-events', id, data);
  },
  
  async delete(id) {
    return apiService.delete('production-events', id);
  }
};

export default api;
