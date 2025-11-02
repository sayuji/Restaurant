const API_BASE_URL = 'http://localhost:5000/api';

// 🔐 GET AUTH TOKEN FROM LOCALSTORAGE
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// 🔐 GET AUTH HEADERS
const getAuthHeaders = (isFormData = false) => {
  const token = getAuthToken();
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

// 🔐 HANDLE UNAUTHORIZED RESPONSES
const handleUnauthorized = (response) => {
  if (response.status === 401 || response.status === 403) {
    // Clear invalid token and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
  return response;
};

export const api = {
  async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getAuthHeaders(),
    });
    
    handleUnauthorized(response);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GET failed: ${response.status} - ${errorText}`);
    }
    
    return response.json();
  },

  async post(endpoint, data) {
    const isFormData = data instanceof FormData;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? data : JSON.stringify(data),
    });
    
    handleUnauthorized(response);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`POST failed: ${response.status} - ${errorText}`);
    }
    
    return response.json();
  },

  async put(endpoint, data) {
    const isFormData = data instanceof FormData;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? data : JSON.stringify(data),
    });
    
    handleUnauthorized(response);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PUT failed: ${response.status} - ${errorText}`);
    }
    
    return response.json();
  },

  async delete(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    handleUnauthorized(response);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DELETE failed: ${response.status} - ${errorText}`);
    }
    
    return response.json();
  }
};

// ==========================================
// 🔐 AUTHENTICATION API
// ==========================================

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// ==========================================
// 📋 MENU API
// ==========================================

export const menuAPI = {
  getAll: () => api.get('/menu'),
  getById: (id) => api.get(`/menu/${id}`),
  create: (menuData) => {
    // Handle FormData for file upload
    if (menuData.image instanceof File) {
      const formData = new FormData();
      formData.append('name', menuData.name);
      formData.append('price', menuData.price);
      formData.append('description', menuData.description || '');
      formData.append('category', JSON.stringify(menuData.category) || '');
      formData.append('image', menuData.image);
      return api.post('/menu', formData);
    }
    return api.post('/menu', menuData);
  },
  update: (id, menuData) => {
    // Handle FormData for file upload
    if (menuData.image instanceof File) {
      const formData = new FormData();
      formData.append('name', menuData.name);
      formData.append('price', menuData.price);
      formData.append('description', menuData.description || '');
      formData.append('category', JSON.stringify(menuData.category) || '');
      formData.append('image', menuData.image);
      return api.put(`/menu/${id}`, formData);
    }
    return api.put(`/menu/${id}`, menuData);
  },
  delete: (id) => api.delete(`/menu/${id}`),
};

// ==========================================
// 🏪 TABLES API
// ==========================================

export const tablesAPI = {
  getAll: () => api.get('/tables'),
  getById: (id) => api.get(`/tables/${id}`),
  create: (tableData) => api.post('/tables', tableData),
  update: (id, tableData) => api.put(`/tables/${id}`, tableData),
  delete: (id) => api.delete(`/tables/${id}`),
  updateStatus: (id, status) => api.put(`/tables/${id}/status`, { status }),
};

// ==========================================
// 🛒 ORDERS API
// ==========================================

export const ordersAPI = {
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (orderData) => api.post('/orders', orderData),
  update: (id, orderData) => api.put(`/orders/${id}`, orderData),
  delete: (id) => api.delete(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

// ==========================================
// 🔧 UTILITY FUNCTIONS
// ==========================================

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Get current user data
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Check if user has specific role
export const hasRole = (role) => {
  const user = getCurrentUser();
  return user && user.role === role;
};

// Check if user has any of the specified roles
export const hasAnyRole = (roles) => {
  const user = getCurrentUser();
  return user && roles.includes(user.role);
};

// Role-based access control
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  KITCHEN: 'kitchen',
  CASHIER: 'cashier',
  STAFF: 'staff'
};

// Default export
export default api;