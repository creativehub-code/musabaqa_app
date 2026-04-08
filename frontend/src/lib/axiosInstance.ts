import axios from 'axios';

const getBaseUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }
  return url.replace(/\/$/, '');
};

const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach Bearer token from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors like 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401, clear token and redirect to login
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Prevent redirect loop if already on login page
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
