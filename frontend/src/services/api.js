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
  async register(userData) {
    try {
      const response = await api.post('/auth/register/', userData);
      
      // Store token and user info in localStorage
      this.setCurrentUser(response.data);
      return response.data;
    } catch (error) {
      // Detailed error handling for registration
      const errorResponse = error.response?.data || {};
      
      // Create a custom error with more details
      const registrationError = new Error('Registration failed');
      registrationError.details = errorResponse;
      
      // Add specific error messages if available
      if (errorResponse.username) {
        registrationError.message = errorResponse.username[0] || 'Invalid username';
      } else if (errorResponse.email) {
        registrationError.message = errorResponse.email[0] || 'Invalid email';
      } else if (errorResponse.password) {
        registrationError.message = errorResponse.password[0] || 'Invalid password';
      } else if (errorResponse.detail) {
        registrationError.message = errorResponse.detail;
      }

      console.error('Registration error:', registrationError.message);
      throw registrationError;
    }
  },

  // Login user
  async login(username, password) {
    try {
      const response = await api.post('/token/', { 
        username, 
        password 
      });
      
      // Store tokens correctly for SimpleJWT
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Store user info
      this.setCurrentUser({
        ...response.data.user,
        access_token: response.data.access
      });
      
      return response.data;
    } catch (error) {
      // Detailed error handling for login
      const errorResponse = error.response?.data || {};
      
      // Create a custom error with more details
      const loginError = new Error('Login failed');
      loginError.details = errorResponse;
      
      // Add specific error messages if available
      if (errorResponse.detail) {
        loginError.message = errorResponse.detail;
      } else if (errorResponse.username) {
        loginError.message = 'Invalid username';
      } else if (errorResponse.password) {
        loginError.message = 'Invalid password';
      } else if (error.response?.status === 401) {
        loginError.message = 'Unauthorized: Incorrect username or password';
      }

      console.error('Login error:', loginError.message);
      throw loginError;
    }
  },

  // Refresh token method
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/token/refresh/', { 
        refresh: refreshToken 
      });

      // Update access token
      localStorage.setItem('access_token', response.data.access);
      return response.data.access;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Logout user if refresh fails
      this.clearCurrentUser();
      throw error;
    }
  },

  // Logout user
  async logout() {
    try {
      // Optionally invalidate the refresh token on the server if needed
      await api.post('/auth/logout/', {
        refresh_token: localStorage.getItem('refresh_token')
      });
      this.clearCurrentUser();
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local tokens even if server logout fails
      this.clearCurrentUser();
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
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  }
};

// API Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
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
  async (error) => {
    const originalRequest = error.config;

    // If the error is due to an unauthorized access and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await authService.refreshToken();
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed, force logout
        authService.clearCurrentUser();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
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
      // Ensure sell_cost and labor_cost are always set
      const processedData = {
        ...data,
        sell_cost: data.sell_cost !== undefined ? data.sell_cost : 0,
        labor_cost: data.labor_cost !== undefined ? data.labor_cost : 0,
        // Ensure productmaterial_set is in the correct format
        productmaterial_set: data.productmaterial_set || []
      };

      console.log('Creating Product - Processed Data:', {
        originalData: data,
        processedData: processedData
      });

      const response = await apiService.create('products', processedData);
      
      console.log('Product Creation Response:', response);
      
      return response;
    } catch (error) {
      console.error('Error creating product:', error);
      
      // Log more details about the error
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      throw error;
    }
  },
  async update(id, data) {
    try {
      // Retrieve existing product to preserve materials and labor_cost if not provided
      const existingProduct = await apiService.getById('products', id);
      
      console.log('Updating Product - Existing Product:', existingProduct);
      console.log('Updating Product - Incoming Data:', data);
      
      // Ensure sell_cost and labor_cost are always set
      const processedData = {
        ...data,
        sell_cost: data.sell_cost !== undefined ? data.sell_cost : existingProduct.sell_cost,
        labor_cost: data.labor_cost !== undefined ? data.labor_cost : (existingProduct.labor_cost || 0),
        // Preserve existing materials if not provided
        productmaterial_set: data.productmaterial_set || 
          (existingProduct.materials || []).map(m => ({
            material_id: m.material_id,
            quantity: m.quantity
          }))
      };

      console.log('Updating Product - Processed Data:', processedData);

      const response = await apiService.update('products', id, processedData);
      
      console.log('Product Update Response:', response);
      
      return response;
    } catch (error) {
      console.error('Error updating product:', error);
      
      // Log more details about the error
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
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

export const productionLogService = {
  async getAll(params = {}) {
    try {
      const response = await api.get('/production-logs/', { params });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/production-logs/${id}/`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async create(data) {
    try {
      const response = await api.post('/production-logs/', data);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async update(id, data) {
    try {
      const response = await api.put(`/production-logs/${id}/`, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async delete(id) {
    try {
      await api.delete(`/production-logs/${id}/`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async getStats() {
    try {
      const response = await api.get('/production-logs/production_stats/');
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};

export default api;
