import React from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import App from './App'
import 'leaflet/dist/leaflet.css'
import './index.css'

// Add ngrok header to all requests
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true'

const container = document.getElementById('root')
createRoot(container).render(<App />)
