import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173 },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) return 'three-vendor'
            // Ensure React and closely-related packages are forced into the react-vendor chunk
            if (id.includes('/node_modules/react-dom') || id.includes('/node_modules/react/') || id.includes('/node_modules/scheduler') || id.includes('/node_modules/react-reconciler') || id.includes('/node_modules/react-is') || id.includes('/node_modules/react/jsx-runtime')) return 'react-vendor'
            if (id.includes('react')) return 'react-vendor'
            return 'vendor'
          }
        }
      }
    }
  }
})
