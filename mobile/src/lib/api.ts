import axios from 'axios';
import { BASE_URL } from '@/constants/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

// Inject Clerk JWT token — set dynamically via setAuthToken()
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize network/timeout errors for UI consumption
    if (!error.response) {
      error.message = 'Network error — please check your connection';
    }
    return Promise.reject(error);
  },
);

export default api;
