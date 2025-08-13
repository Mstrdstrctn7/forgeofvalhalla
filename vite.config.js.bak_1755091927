import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:9998',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
