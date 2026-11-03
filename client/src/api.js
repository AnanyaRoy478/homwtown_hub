import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong. Please try again.';

export const assetUrl = (p) => (p && p.startsWith('/uploads') ? (import.meta.env.VITE_ASSET_URL || '') + p : p);

export async function uploadImage(file) {
  const fd = new FormData();
  fd.append('image', file);
  const { data } = await api.post('/upload', fd);
  return data.url;
}

export default api;
