import React, {useEffect, useState} from 'react'

export default function FavoriteRestaurants(){
  const [items,setItems] = useState([])
  useEffect(()=>{
    const raw = localStorage.getItem('favorite_restaurants')
    if(raw) try{ setItems(JSON.parse(raw)) }catch(e){ setItems([]) }
  },[])

  if(!items.length) return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold">Favorite Restaurants</h3>
      <p className="text-sm text-gray-600">No favorite restaurants yet. Add some from the Restaurants tab.</p>
    </div>
  )

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Favorite Restaurants</h3>
      <ul className="space-y-3">
        {items.map((r,i)=> (
          <li key={i} className="flex justify-between items-center border rounded p-3">
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-sm text-gray-600">{r.tags?.join(', ')}</div>
            </div>
            <div className="text-sm text-gray-500">{r.distance_km ? r.distance_km.toFixed(1)+' km' : ''}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
