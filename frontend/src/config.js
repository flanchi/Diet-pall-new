// API URL strategy:
// - For localhost: use http://localhost:4000 directly
// - For external (ngrok): use relative paths which Vite proxy will forward to localhost:4000
// - The Vite server proxy handles: /api/* → http://localhost:4000/api/*

const getAPIUrl = () => {
  // If explicit env var is set, use it
  if (import.meta.env.VITE_API_URL) {
    console.log('Using explicit VITE_API_URL:', import.meta.env.VITE_API_URL)
    return import.meta.env.VITE_API_URL
  }
  
  // For localhost development, direct connection
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const url = 'http://localhost:4000'
    console.log('Using localhost API URL:', url)
    return url
  }
  
  // For external access (ngrok), use empty string for relative paths
  // Vite proxy will forward /api/* requests to http://localhost:4000
  // This works because the Vite server itself can reach localhost:4000
  console.log('Using relative API paths (Vite proxy will handle forwarding)')
  console.log('Accessed from:', window.location.hostname)
  return ''
}

export const API_URL = getAPIUrl()
console.log('Final API_URL:', API_URL || '(using relative paths)')
