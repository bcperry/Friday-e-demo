import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Prefer VITE_API_BASE to match frontend/api.ts; default to backend localhost.
  const apiTarget = env.VITE_API_BASE || 'http://localhost:8000'

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
