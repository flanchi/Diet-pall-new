import React from "react"

const mealEmojis = {
  breakfast: "",
  lunch: "",
  dinner: ""
}

const mealGradients = {
  breakfast: "from-yellow-50 to-orange-50 border-yellow-300",
  lunch: "from-green-50 to-emerald-50 border-green-300",
  dinner: "from-indigo-50 to-purple-50 border-indigo-300"
}

export default function MealPlanDisplay({ mealPlan, onGetRecipe }) {
  if (!mealPlan || !mealPlan.meals) return null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass rounded-3xl shadow-card p-8 border border-white/20 backdrop-blur-sm">
        <div className="space-y-2 mb-8">
          <h3 className="text-4xl font-bold gradient-text">Your Personalized Meal Plan</h3>
          <p className="text-slate-300 text-lg">Optimized for your health conditions and allergies</p>
        </div>

        <div className="grid gap-6">
          {mealPlan.meals.map((meal, idx) => (
            <div
              key={idx}
              className={`group relative rounded-2.5xl p-8 border-2 bg-white/20 backdrop-blur-sm ${mealGradients[meal.slot] || "border-slate-300"} card-hover overflow-hidden`}
            >
              {/* Background glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-300 to-secondary-300 rounded-2.5xl blur opacity-0 group-hover:opacity-10 transition duration-500"></div>

              <div className="relative space-y-4">
                {/* Header with emoji and time */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{mealEmojis[meal.slot] || ""}</div>
                    <div>
                      <h4 className="text-2xl font-bold text-slate-900 capitalize">{meal.slot}</h4>
                      <p className="text-sm text-slate-600">Recommended meal</p>
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-slate-500 uppercase tracking-widest">Meal</p>
                    <p className="text-lg font-bold gradient-text">#{idx + 1}</p>
                  </div>
                </div>

                {/* Meal name - highlighted */}
                <div className="pb-4 border-b-2 border-white/40">
                  <p className="text-3xl font-bold text-slate-900">{meal.name}</p>
                </div>

                {/* Ingredients section */}
                <div className="space-y-3">
                  <h5 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <span></span> Key Ingredients
                  </h5>
                  <div className="flex flex-wrap gap-2.5">
                    {meal.ingredients && meal.ingredients.map((ing, i) => (
                      <span
                        key={i}
                        className="badge-secondary text-sm font-medium hover:shadow-lg transition-all duration-300"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Health benefits */}
                {meal.notes && meal.notes.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <h5 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <span></span> Health Benefits
                    </h5>
                    <ul className="space-y-2">
                      {meal.notes.map((note, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                          <span className="text-primary-500 font-bold pt-0.5"></span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-6 flex-col sm:flex-row">
                  <button
                    className="flex-1 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-6 py-3 rounded-full font-semibold text-sm uppercase tracking-wide hover:shadow-glow-primary transition-all duration-300 transform hover:scale-105"
                    onClick={() => {
                      try {
                        const raw = localStorage.getItem("favorite_meals")
                        const arr = raw ? JSON.parse(raw) : []
                        arr.push({ name: meal.name, ingredients: meal.ingredients, notes: meal.notes || [] })
                        localStorage.setItem("favorite_meals", JSON.stringify(arr))
                        alert(" Added to favorite meals")
                      } catch (e) {
                        console.error(e)
                        alert("Failed to add favorite")
                      }
                    }}
                  >
                     Add to Favorites
                  </button>
                  <button
                    className="flex-1 bg-gradient-to-r from-secondary-600 to-secondary-500 text-white px-6 py-3 rounded-full font-semibold text-sm uppercase tracking-wide hover:shadow-glow-secondary transition-all duration-300 transform hover:scale-105"
                    onClick={() => {
                      if (onGetRecipe) {
                        onGetRecipe(meal.name)
                      }
                    }}
                  >
                     Get Recipe
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer info box */}
      <div className="glass rounded-2.5xl p-6 border-l-4 border-accent-500 space-y-2 animate-slide-up">
        <p className="text-sm font-semibold text-accent-700 flex items-center gap-2">
          <span></span> Pro Tip
        </p>
        <p className="text-slate-700">
          Save your profile to keep track of your meal plans. Focus on balanced, nourishing choices for healthy eating—not weight loss. Stay consistent for best results!
        </p>
      </div>
    </div>
  )
}
