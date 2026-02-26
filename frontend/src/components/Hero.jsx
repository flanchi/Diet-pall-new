import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import MaterialIcon from "../utils/MaterialIcon"

export default function Hero() {
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [slides, setSlides] = useState([])
  const [activeTab, setActiveTab] = useState("meals")

  const fallbackSlides = useMemo(
    () => [
      { title: "Grilled Veggie Bowl", subtitle: "Balanced • Fiber-rich", emoji: "🥗" },
      { title: "Island Fish Plate", subtitle: "Omega-3 • Light", emoji: "🐟" },
      { title: "Tropical Fruit Mix", subtitle: "Vitamins • Hydrating", emoji: "🍍" },
      { title: "Hearty Bean Stew", subtitle: "Protein • Comfort", emoji: "🥣" }
    ],
    []
  )

  useEffect(() => {
    const loadSlides = () => {
      try {
        const favoriteMealsRaw = localStorage.getItem("favorite_meals")
        const favoriteMeals = favoriteMealsRaw ? JSON.parse(favoriteMealsRaw) : []
        const historyRaw = localStorage.getItem("meal_history")
        const history = historyRaw ? JSON.parse(historyRaw) : []

        const fromFavorites = favoriteMeals.slice(0, 6).map((m) => ({
          title: m.name || "Favorite Meal",
          subtitle: "From favorites",
          emoji: "⭐"
        }))

        const fromHistory = history.slice(0, 6).map((m) => ({
          title: m?.meals?.[0]?.name || m?.name || "Meal Plan",
          subtitle: "From history",
          emoji: "📜"
        }))

        const combined = [...fromFavorites, ...fromHistory]
        setSlides(combined.length ? combined : fallbackSlides)
      } catch (e) {
        console.error("Failed to load slideshow data", e)
        setSlides(fallbackSlides)
      }
    }

    loadSlides()
    const interval = setInterval(() => {
      setSlideIndex((prev) => (slides.length ? (prev + 1) % slides.length : 0))
    }, 4000)

    return () => clearInterval(interval)
  }, [fallbackSlides, slides.length])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      console.log("Searching for:", search)
      setSearch("")
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mb-6">
        {/* Left Side - Content */}
        <div className="animate-slide-up space-y-6">
          <div className="space-y-3">
            <h1 className="text-5xl lg:text-6xl font-bold">
              <span className="gradient-text">Your Personalized</span>
              <br />
              <span className="text-slate-900">Nutrition Guide</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Get AI-powered meal plans tailored to your health conditions, allergies, and dietary preferences. Discover healthy recipes and local Trinidad & Tobago restaurants.
            </p>
          </div>


        </div>

        {/* Right Side - Slideshow */}
        <div className="relative hidden lg:flex items-center justify-center justify-self-end">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-3xl blur-2xl opacity-50"></div>
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-card border border-white/20 w-full max-w-sm mt-4 lg:mt-8 ml-auto">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 pb-3">
              <button
                onClick={() => { setActiveTab("meals"); setSlideIndex(0) }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1 ${
                  activeTab === "meals"
                    ? "bg-primary-500 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <MaterialIcon name="restaurant_menu" size="18px" />
                Meals
              </button>
              <button
                onClick={() => setActiveTab("restaurants")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1 ${
                  activeTab === "restaurants"
                    ? "bg-primary-500 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <MaterialIcon name="store" size="18px" />
                Restaurants
              </button>
              <button
                onClick={() => setActiveTab("grocery")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1 ${
                  activeTab === "grocery"
                    ? "bg-primary-500 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <MaterialIcon name="shopping_cart" size="18px" />
                Grocery
              </button>
            </div>

            {/* Meals Tab */}
            {activeTab === "meals" && slides.length > 0 && (
              <div className="space-y-4 animate-fade-in">
                <div className="h-36 rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-5xl">
                  {slides[slideIndex]?.emoji || "🍽️"}
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">{slides[slideIndex]?.title}</p>
                  <p className="text-sm text-slate-600">{slides[slideIndex]?.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  {slides.slice(0, 5).map((_, i) => (
                    <span
                      key={i}
                      className={`h-2 w-2 rounded-full ${i === slideIndex ? "bg-primary-600" : "bg-slate-300"}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500">Uses favorites and history when available.</p>
              </div>
            )}

            {/* Restaurants Tab */}
            {activeTab === "restaurants" && (
              <div className="space-y-4 animate-fade-in">
                <div className="h-36 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-5xl">
                  🏪
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">Nearby Restaurants</p>
                  <p className="text-sm text-slate-600">GPS-powered recommendations</p>
                </div>
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-slate-500">Find local restaurants matching your dietary preferences</p>
                  <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
                    View Restaurants
                  </button>
                </div>
              </div>
            )}

            {/* Grocery Tab */}
            {activeTab === "grocery" && (
              <div className="space-y-4 animate-fade-in">
                <div className="h-36 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-5xl">
                  🛒
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900">Shopping List</p>
                  <p className="text-sm text-slate-600">Suggested grocery items</p>
                </div>
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-slate-500">Stock up on healthy ingredients from local stores</p>
                  <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
                    View Products
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
