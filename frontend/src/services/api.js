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

// Response interceptor to handle token expiry / blocked account (401 / 403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || (error.response.status === 403 && error.response.data?.message?.includes('blocked')))) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
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

  // Fetch all images for current authenticated user
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
  // Login supporting user and admin types
  login: async (email, password, loginType = 'user') => {
    const response = await api.post('/auth/login', { email, password, loginType });
    if (response.data.token && response.data.user) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Public user registration
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
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

  // Forgot / Reset Password flow
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyOTP: async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  resendOTP: async (email) => {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },

  resetPassword: async (email, resetToken, newPassword, confirmPassword) => {
    const response = await api.post('/auth/reset-password', {
      email,
      resetToken,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },
};

export default api;
