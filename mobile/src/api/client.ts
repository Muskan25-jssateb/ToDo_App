import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_ENDPOINTS = [
  'http://192.168.29.30:5000/api',
  'http://localhost:5000/api',
  'http://10.0.2.2:5000/api',
];

export let currentBaseUrlIndex = 0;
export const TOKEN_STORAGE_KEY = '@todo_app_auth_token';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_ENDPOINTS[0],
  timeout: 3500,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token if available
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Failed to retrieve token from storage', err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Fast fallback across local Wi-Fi, USB reverse, and emulator
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      (!error.response || error.code === 'ECONNABORTED' || error.message?.includes('Network Error')) &&
      originalRequest &&
      !originalRequest._retriedEndpointCount
    ) {
      originalRequest._retriedEndpointCount = 1;

      for (let i = 1; i < API_ENDPOINTS.length; i++) {
        const nextEndpoint = API_ENDPOINTS[(currentBaseUrlIndex + i) % API_ENDPOINTS.length];
        try {
          const res = await axios({
            ...originalRequest,
            baseURL: nextEndpoint,
            timeout: 2500,
          });
          currentBaseUrlIndex = (currentBaseUrlIndex + i) % API_ENDPOINTS.length;
          apiClient.defaults.baseURL = nextEndpoint;
          return res;
        } catch (retryErr) {
          // Continue to next endpoint
        }
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'Server unreachable. Please ensure Wi-Fi is connected to 192.168.29.x or use Offline Mode.';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
