import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// Empty base → relative URLs → same origin (IIS proxies /api/* to backend)
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  },
);

export default client;
