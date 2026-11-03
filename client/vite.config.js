import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the Vite server proxies API + uploaded files to the Express server.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
