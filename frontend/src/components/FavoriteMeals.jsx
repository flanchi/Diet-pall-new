import React, {useEffect, useState} from 'react'

export default function FavoriteMeals(){
  const [items,setItems] = useState([])
  
  // Function to load items from localStorage
  const loadItems = () => {
    const raw = localStorage.getItem('favorite_meals')
    if(raw) try{ setItems(JSON.parse(raw)) }catch(e){ setItems([]) }
  }
  
  useEffect(()=>{
    loadItems()
    
    // Listen for storage changes (when items are added from AI chat widget)
    const handleStorageChange = (e) => {
      if (e.key === 'favorite_meals' || e.key === null) {
        loadItems()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom event when items are added from same window
    const handleCustomEvent = () => loadItems()
    window.addEventListener('favoritesUpdated', handleCustomEvent)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('favoritesUpdated', handleCustomEvent)
    }
  },[])

  function remove(i){
    const copy = items.slice(); copy.splice(i,1)
    setItems(copy); localStorage.setItem('favorite_meals', JSON.stringify(copy))
  }

  if(!items.length) return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold">Favorite Meals</h3>
      <p className="text-sm text-gray-600">You have no favorite meals yet. Add a meal to favorites from the meal plan view.</p>
    </div>
  )

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Favorite Meals</h3>
      <ul className="space-y-3">
        {items.map((m,i)=> (
          <li key={i} className="flex justify-between items-center border rounded p-3">
            <div>
              <div className="font-medium">{m.name}</div>
              <div className="text-sm text-gray-600">{(m.ingredients||[]).join(', ')}</div>
            </div>
            <button onClick={()=>remove(i)} className="text-sm text-red-600">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
