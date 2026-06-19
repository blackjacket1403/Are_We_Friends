import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the React app runs on :5173 and proxies socket.io traffic to the
// game server on :3001. In production the server serves the built bundle, so
// there is no proxy and the socket connects to the same origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
