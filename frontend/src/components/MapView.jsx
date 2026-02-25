import React, { useState } from 'react'
import axios from 'axios'
import { API_URL } from '../config'

export default function MapView({ settings }) {
  const [pos, setPos] = useState({ lat: 10.6667, lng: -61.5167 })
  const [items, setItems] = useState([])
  const [message, setMessage] = useState('🔍 Click to find nearby restaurants')
  const [loading, setLoading] = useState(false)

  const radius = settings?.maps?.searchRadius || 50
  const allowPrecise = settings?.maps?.usePreciseLocation !== false

  function openMap() {
    const url = `https://www.google.com/maps/search/restaurants/@${pos.lat},${pos.lng},14z`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function useGPS() {
    if (!allowPrecise) {
      setMessage('⚠️ Precise location is disabled in Settings')
      return
    }
    if (!navigator.geolocation) {
      setMessage('❌ Geolocation unavailable')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(async (p) => {
      const lat = p.coords.latitude
      const lng = p.coords.longitude
      setPos({ lat, lng })
      setMessage('📍 Fetching nearby items...')
      try {
        const res = await axios.get(`${API_URL}/api/nearby`, { params: { lat, lng, type: 'restaurants', radius } })
        setItems(res.data.results || [])
        setMessage(`✓ Found ${(res.data.results || []).length} restaurants`)
      } catch (err) {
        console.error(err)
        setMessage('⚠️ Failed to fetch')
      } finally { setLoading(false) }
    }, (err) => {
      setMessage('❌ Location permission denied')
      setLoading(false)
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-secondary p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">📍 GPS & Nearby</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={useGPS}
            disabled={loading}
            className="bg-white hover:bg-gray-100 text-primary font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? '⏳ Locating...' : '📍 Use GPS'}
          </button>
          <button
            onClick={openMap}
            className="bg-white/90 hover:bg-white text-slate-900 font-bold py-2 px-4 rounded-lg border border-slate-200 transition"
          >
            🗺️ Open Map
          </button>
        </div>
        <p className="text-slate-900 text-sm mt-3 font-semibold">{message}</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
          <p className="font-semibold">Current coordinates</p>
          <p>{pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}</p>
        </div>

        {items.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Nearby restaurants</p>
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.slice(0, 8).map((it) => (
                <li key={it.id} className="text-sm bg-white border border-slate-200 rounded-md px-3 py-2">
                  <span className="font-semibold text-slate-800">{it.name}</span>
                  {it.distance_km ? <span className="text-slate-600"> • {it.distance_km.toFixed(1)} km</span> : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
