const API_BASE_URL = 'http://localhost:5000/api';

// Generic API function
export const api = {
  async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async post(endpoint, data) {
    // Handle FormData (file upload) vs JSON data
    const isFormData = data instanceof FormData;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? data : JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`POST failed: ${response.status} - ${errorText}`);
    }
    
    return response.json();
  },

  async put(endpoint, data) {
    // Handle FormData untuk update juga
    const isFormData = data instanceof FormData;
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? data : JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PUT failed: ${response.status} - ${errorText}`);
    }
    
    return response.json();
  },

  async delete(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
};

// Menu-specific API calls
export const menuAPI = {
  getAll: () => api.get('/menu'),
  getById: (id) => api.get(`/menu/${id}`),
  create: (menuData) => api.post('/menu', menuData),
  update: (id, menuData) => api.put(`/menu/${id}`, menuData),
  delete: (id) => api.delete(`/menu/${id}`),
  toggleAvailability: (id) => api.put(`/menu/${id}/toggle-availability`),
};