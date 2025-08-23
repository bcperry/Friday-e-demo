import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')
  
  // Default to localhost for development if not specified
  const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:8000'
  
  return {
    plugins: [react()],
    build: {
      outDir: '../backend/static',
      emptyOutDir: true,
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
