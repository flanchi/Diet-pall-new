import React, { useEffect, useState } from 'react'

export default function GroceryList() {
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState('')

  // Function to load items from localStorage
  const loadItems = () => {
    const raw = localStorage.getItem('shopping_list')
    if (raw) {
      try {
        setItems(JSON.parse(raw))
      } catch (e) {
        setItems([])
      }
    }
  }

  useEffect(() => {
    loadItems()
    
    // Listen for storage changes (when items are added from AI chat widget)
    const handleStorageChange = (e) => {
      if (e.key === 'shopping_list' || e.key === null) {
        loadItems()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom event when items are added from same window
    const handleCustomEvent = () => loadItems()
    window.addEventListener('shoppingListUpdated', handleCustomEvent)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('shoppingListUpdated', handleCustomEvent)
    }
  }, [])

  function save(items) {
    setItems(items)
    localStorage.setItem('shopping_list', JSON.stringify(items))
  }

  function add() {
    if (!newItem.trim()) return
    const raw = localStorage.getItem('shopping_list')
    const list = raw ? JSON.parse(raw) : []
    
    // Check for duplicates (case-insensitive)
    const exists = list.some(item => 
      item.name.toLowerCase() === newItem.trim().toLowerCase()
    )
    
    if (!exists) {
      list.push({ name: newItem.trim(), checked: false, addedAt: new Date().toISOString() })
      save(list)
    }
    setNewItem('')
  }

  function toggle(index) {
    const list = items.slice()
    list[index].checked = !list[index].checked
    save(list)
  }

  function remove(index) {
    const list = items.slice()
    list.splice(index, 1)
    save(list)
  }

  function clearAll() {
    save([])
  }

  if (!items.length) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold">Shopping List</h3>
        <p className="text-sm text-gray-600 mb-4">Your shopping list is empty. Add items or ask the AI to add ingredients for you.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && add()}
            placeholder="Add item..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={add}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Add
          </button>
        </div>
      </div>
    )
  }

  const uncheckedCount = items.filter(item => !item.checked).length

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Shopping List</h3>
        <span className="text-sm text-gray-600">{uncheckedCount} items remaining</span>
      </div>
      
      <ul className="space-y-2 mb-4">
        {items.map((item, i) => (
          <li key={i} className={`flex items-center justify-between border rounded p-3 ${item.checked ? 'bg-gray-50' : ''}`}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggle(i)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary"
              />
              <span className={item.checked ? 'line-through text-gray-500' : ''}>{item.name}</span>
            </div>
            <button onClick={() => remove(i)} className="text-sm text-red-600 hover:text-red-700">Remove</button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && add()}
          placeholder="Add item..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={add}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Add
        </button>
      </div>

      <button
        onClick={clearAll}
        className="text-sm text-gray-600 hover:text-gray-800"
      >
        Clear all items
      </button>
    </div>
  )
}
