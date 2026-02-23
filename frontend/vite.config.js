export default {
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'brunilda-lateenrigged-atticus.ngrok-free.dev',
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false
      }
    }
  }
}
