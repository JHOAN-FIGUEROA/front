import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://backend-wi7t.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
