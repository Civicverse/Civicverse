/** @type {import('vite').UserConfig} */
module.exports = {
  server: {
    host: true,
    proxy: {
      // Proxy API requests to backend during development
      '/api': {
        target: 'http://localhost:3004',
        changeOrigin: true,
        secure: false
      }
    }
  }
}
