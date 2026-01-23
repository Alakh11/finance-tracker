import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/finance-tracker/',
  server: {
    proxy: {
      '/api': {
        target: 'https://finance-tracker-q60v.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    allowedHosts: [
      "alakh-finance.onrender.com",
      "finance-tracker-q60v.onrender.com",
      "alakh11.github.io"
    ],
  },

  build: {
    chunkSizeWarningLimit: 1000 // in KB (1000 KB = 1 MB)
  }
})