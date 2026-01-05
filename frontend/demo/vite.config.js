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
            // Force React runtime + react-dom into a dedicated chunk to avoid duplicate runtimes
            if (/node_modules\/(react|react-dom)(\/|$)/.test(id) || id.includes('react-dom/client')) {
              return 'react-vendor'
            }
            // Do not isolate three.js/@react-three into a separate chunk — keep them in the main vendor chunk
            // (Some packages access React hooks at module-eval time; keeping a single vendor chunk avoids cross-chunk timing)
            // All other node_modules go into a general vendor chunk
            return 'vendor'
          }
        }
      }
    }
  }
})
