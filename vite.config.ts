import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/// <reference types="vitest" />


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use (process as any).cwd() to avoid TS error about 'cwd' missing on Process type
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
      'process.env.ACCESS_CODE': JSON.stringify(env.VITE_ACCESS_CODE)
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        }
      }
    }
  }
})