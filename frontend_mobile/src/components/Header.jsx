import React from "react"
import MaterialIcon from "../utils/MaterialIcon"

export default function Header() {
  return (
    <div className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white/90 p-3 rounded-xl shadow-md">
            <MaterialIcon name="restaurant" size="40px" filled={true} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Diet-Pal</h1>
            <p className="text-white/90 text-sm font-medium">Your Personal Nutrition Companion</p>
          </div>
        </div>
      </div>
    </div>
  )
}
