import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@noble/hashes': '@noble/hashes'
    },
    dedupe: ['react', 'react-dom']
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    proxy: {
      '/api/identity': {
        target: 'http://localhost:3003',
        changeOrigin: true
      },
      '/api/wallet/backup': {
        target: 'http://localhost:3003',
        changeOrigin: true
      },
      '/api/status': {
        target: 'http://localhost:3003',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser'
  }
})
