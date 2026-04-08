import axiosInstance from './axiosInstance';

/**
 * Get the base API URL from the Axios configuration
 */
export const API_BASE_URL = axiosInstance.defaults.baseURL;

/**
 * Global API request utility using Axios
 * Automatically handles Bearer tokens and 401 redirects via axiosInstance interceptors.
 * 
 * @param endpoint - The API endpoint (e.g., '/auth/login')
 * @param method - HTTP Method (GET, POST, PUT, DELETE, PATCH)
 * @param body - Optional request payload
 * @returns - The JSON response data
 */
export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
  try {
    const config = {
      url: endpoint,
      method,
      data: body,
    };

    const response = await axiosInstance(config);
    return response.data;
  } catch (error: any) {
    // Extract error message for consistency with the previous fetch implementation
    const message = error.response?.data?.message || error.message || 'API request failed';
    
    // Log error for debugging (matches previous behavior)
    if (error.response) {
      console.error('API Error Status:', error.response.status);
      console.error('API Error Body:', error.response.data);
    } else {
      console.error('API Network Error:', error.message);
    }

    throw new Error(message);
  }
};
