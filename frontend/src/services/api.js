import axios from 'axios';

// Base API URL from environment variable or fallback to relative /api proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to attach JWT authorization header if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// User Upload API Service Methods
export const uploadApi = {
  // Upload a new image
  upload: async (file, metadata = {}, onProgress = null) => {
    const formData = new FormData();
    formData.append('image', file);
    if (metadata.title) formData.append('title', metadata.title);
    if (metadata.description) formData.append('description', metadata.description);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    };

    const response = await api.post('/upload', formData, config);
    return response.data;
  },

  // Fetch all images
  getAll: async () => {
    const response = await api.get('/upload');
    return response.data;
  },

  // Fetch single image
  getById: async (id) => {
    const response = await api.get(`/upload/${id}`);
    return response.data;
  },

  // Replace / update image
  replace: async (id, fileOrMetadata, onProgress = null) => {
    let payload;
    let config = {};

    if (fileOrMetadata instanceof File) {
      payload = new FormData();
      payload.append('image', fileOrMetadata);
      config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      };
    } else if (fileOrMetadata instanceof FormData) {
      payload = fileOrMetadata;
      config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      };
    } else {
      payload = fileOrMetadata;
    }

    const response = await api.put(`/upload/${id}`, payload, config);
    return response.data;
  },

  // Delete image by MongoDB ID or Cloudinary Public ID
  delete: async (idOrPublicId) => {
    const encodedId = encodeURIComponent(idOrPublicId);
    const response = await api.delete(`/upload/${encodedId}`);
    return response.data;
  },
};

// Admin API Services
export const adminApi = {
  // Get dashboard statistics
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // User management
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  blockUser: async (id) => {
    const response = await api.put(`/admin/users/${id}/block`);
    return response.data;
  },

  unblockUser: async (id) => {
    const response = await api.put(`/admin/users/${id}/unblock`);
    return response.data;
  },

  changeRole: async (id, role) => {
    const response = await api.put(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Image management
  getImages: async (params = {}) => {
    const response = await api.get('/admin/images', { params });
    return response.data;
  },

  getImageById: async (id) => {
    const response = await api.get(`/admin/images/${id}`);
    return response.data;
  },

  deleteImage: async (id) => {
    const response = await api.delete(`/admin/images/${id}`);
    return response.data;
  },

  // Analytics
  getAnalytics: async () => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },

  // Settings
  getSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateSettings: async (settings) => {
    const response = await api.put('/admin/settings', settings);
    return response.data;
  },
};

// Authentication Services
export const authApi = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.user?.token) {
      localStorage.setItem('token', response.data.user.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    if (response.data.user?.token) {
      localStorage.setItem('token', response.data.user.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default api;
