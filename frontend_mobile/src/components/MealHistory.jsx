import React, { useEffect, useState } from 'react'

export default function MealHistory(){
  const [history, setHistory] = useState([])

  useEffect(()=>{
    const raw = localStorage.getItem('meal_history')
    if(raw){
      try{ setHistory(JSON.parse(raw)) }catch(e){ setHistory([]) }
    }
  },[]) 

  if(!history.length) return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold">Meal History</h3>
      <p className="text-sm text-gray-600">No saved meal plans yet. Generate a meal plan to save history.</p>
    </div>
  )

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Meal History</h3>
      <ul className="space-y-4">
        {history.map((item,idx)=> (
          <li key={idx} className="border rounded p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-600">{new Date(item.createdAt).toLocaleString()}</div>
              <div className="text-sm text-gray-500">source: {item.meta?.source || 'local'}</div>
            </div>
            <div className="font-medium">{item.meals.map(m=>m.name).join(' • ')}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
