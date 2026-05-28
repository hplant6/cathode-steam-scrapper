import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // /mnt/c/ files don't fire inotify events from WSL — use polling.
    watch: {
      usePolling: true,
      interval: 200,
    },
    proxy: {
      '/api': 'http://localhost:5174',
    },
  },
});
