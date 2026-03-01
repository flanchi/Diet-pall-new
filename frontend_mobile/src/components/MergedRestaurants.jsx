import React from 'react'
import RestaurantsList from './RestaurantsList'
import FavoriteRestaurants from './FavoriteRestaurants'

export default function MergedRestaurants({ settings }) {
  return (
    <div className="space-y-6">
      <RestaurantsList settings={settings} />
      <FavoriteRestaurants />
    </div>
  )
}
