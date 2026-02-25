// API URL strategy:
// - If VITE_API_URL is set, always use it
// - On native mobile (Capacitor), use deployed backend by default
// - On local web localhost, use http://localhost:4000
// - Otherwise use deployed backend

const getAPIUrl = () => {
  // If explicit env var is set, use it
  if (import.meta.env.VITE_API_URL) {
    console.log('Using explicit VITE_API_URL:', import.meta.env.VITE_API_URL)
    return import.meta.env.VITE_API_URL
  }

  // On native mobile app, localhost points to the device itself.
  // Use deployed API unless explicitly overridden via VITE_API_URL.
  const isNativeMobile = Boolean(window?.Capacitor?.isNativePlatform?.())
  if (isNativeMobile) {
    const url = 'https://diet-pall-new.onrender.com'
    console.log('Using native mobile API URL:', url)
    return url
  }
  
  // For localhost development, direct connection
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const url = 'http://localhost:4000'
    console.log('Using localhost API URL:', url)
    return url
  }
  
  // For external access, use Render backend
  const url = 'https://diet-pall-new.onrender.com'
  console.log('Using Render API URL:', url)
  return url
}

export const API_URL = getAPIUrl()
console.log('Final API_URL:', API_URL || '(using relative paths)')
