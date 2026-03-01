import React from 'react'
import MealHistory from './MealHistory'
import FavoriteMeals from './FavoriteMeals'

export default function MergedFavorites() {
  return (
    <div className="space-y-6">
      <FavoriteMeals />
      <MealHistory />
    </div>
  )
}
