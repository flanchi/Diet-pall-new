import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { API_URL } from '../config'
export default function RestaurantsList({ settings }){
  const [items,setItems] = useState([])
  const [loading,setLoading] = useState(false)

  useEffect(()=>{
    async function load(){
      setLoading(true)
      try{
        // center of Port of Spain
        const radius = settings?.maps?.searchRadius || 200
        const res = await axios.get(`${API_URL}/api/nearby`, { params: { lat:10.6667, lng:-61.5167, type:'restaurants', radius }})
        setItems(res.data.results || [])
      }catch(e){ console.error(e) }
      setLoading(false)
    }
    load()
  },[])

  if(loading) return <div className="bg-white rounded-lg shadow-lg p-6">Loading restaurants…</div>
  if(!items.length) return <div className="bg-white rounded-lg shadow-lg p-6">No restaurants found.</div>

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Nearby Restaurants</h3>
      <ul className="space-y-3">
        {items.map(it => (
          <li key={it.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{it.name}</div>
              <div className="text-sm text-gray-600">{(it.tags||[]).join(', ')}</div>
            </div>
            <div className="text-sm text-gray-500">{it.distance_km ? it.distance_km.toFixed(1)+' km' : ''}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
