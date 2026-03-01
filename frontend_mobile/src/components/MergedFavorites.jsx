import React, { useEffect, useState } from 'react'
import MaterialIcon from '../utils/MaterialIcon'

export default function MergedFavorites() {
  const [favoritesCollapsed, setFavoritesCollapsed] = useState(false)
  const [historyCollapsed, setHistoryCollapsed] = useState(false)
  const [favoriteItems, setFavoriteItems] = useState([])
  const [history, setHistory] = useState([])

  // Load favorite meals
  useEffect(() => {
    const loadFavorites = () => {
      const raw = localStorage.getItem('favorite_meals')
      if (raw) try { setFavoriteItems(JSON.parse(raw)) } catch (e) { setFavoriteItems([]) }
    }
    
    loadFavorites()
    
    const handleStorageChange = (e) => {
      if (e.key === 'favorite_meals' || e.key === null) {
        loadFavorites()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    
    const handleCustomEvent = () => loadFavorites()
    window.addEventListener('favoritesUpdated', handleCustomEvent)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('favoritesUpdated', handleCustomEvent)
    }
  }, [])

  // Load meal history
  useEffect(() => {
    const raw = localStorage.getItem('meal_history')
    if (raw) {
      try { setHistory(JSON.parse(raw)) } catch (e) { setHistory([]) }
    }
  }, [])

  const removeFavorite = (i) => {
    const copy = favoriteItems.slice()
    copy.splice(i, 1)
    setFavoriteItems(copy)
    localStorage.setItem('favorite_meals', JSON.stringify(copy))
  }

  return (
    <div className="space-y-6">
      {/* Favorite Meals Card */}
      <div className="glass relative rounded-2.5xl p-6 border border-white/20 shadow-lg backdrop-blur-sm bg-white/40 space-y-4">
        {/* Collapse toggle */}
        <button
          className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-primary-100 text-primary-700 rounded-full p-1 text-base font-semibold shadow transition"
          onClick={() => setFavoritesCollapsed((c) => !c)}
          aria-label="Toggle favorites"
        >
          <MaterialIcon name={favoritesCollapsed ? "expand_more" : "expand_less"} size="20px" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pr-10">
          <MaterialIcon name="favorite" size="28px" />
          <div>
            <h3 className="text-xl font-bold text-slate-800">Favorite Meals</h3>
            <p className="text-sm text-slate-600">Your saved meal favorites</p>
          </div>
        </div>

        {/* Content */}
        {!favoritesCollapsed && (
          <>
            {favoriteItems.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-600">You have no favorite meals yet. Add a meal to favorites from the meal plan view.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {favoriteItems.map((m, i) => (
                  <li key={i} className="flex justify-between items-center border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{m.name}</div>
                      <div className="text-sm text-slate-600">{(m.ingredients || []).join(', ')}</div>
                    </div>
                    <button
                      onClick={() => removeFavorite(i)}
                      className="ml-4 text-sm text-red-600 hover:text-red-800 font-semibold transition"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Meal History Card */}
      <div className="glass relative rounded-2.5xl p-6 border border-white/20 shadow-lg backdrop-blur-sm bg-white/40 space-y-4">
        {/* Collapse toggle */}
        <button
          className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-primary-100 text-primary-700 rounded-full p-1 text-base font-semibold shadow transition"
          onClick={() => setHistoryCollapsed((c) => !c)}
          aria-label="Toggle history"
        >
          <MaterialIcon name={historyCollapsed ? "expand_more" : "expand_less"} size="20px" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pr-10">
          <MaterialIcon name="history" size="28px" />
          <div>
            <h3 className="text-xl font-bold text-slate-800">Meal History</h3>
            <p className="text-sm text-slate-600">Your generated meal plans</p>
          </div>
        </div>

        {/* Content */}
        {!historyCollapsed && (
          <>
            {history.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-600">No saved meal plans yet. Generate a meal plan to save history.</p>
              </div>
            ) : (
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((item, idx) => (
                  <li key={idx} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-gray-600">{new Date(item.createdAt).toLocaleString()}</div>
                      <div className="text-xs text-gray-500 bg-slate-100 px-2 py-1 rounded">
                        {item.meta?.source || 'local'}
                      </div>
                    </div>
                    <div className="font-medium text-slate-900">{item.meals.map((m) => m.name).join(' • ')}</div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
