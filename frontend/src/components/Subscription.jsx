import React, { useEffect, useState } from "react"
import MaterialIcon from "../utils/MaterialIcon"

const PLAN_OPTIONS = [
  {
    key: "free",
    title: "Continue Free",
    price: "$0/month",
    details: "Basic planning and core app features"
  },
  {
    key: "monthly",
    title: "Monthly Subscription",
    price: "$9.99/month",
    details: "Full feature access with monthly billing"
  },
  {
    key: "annual",
    title: "Annual Subscription",
    price: "$99.99/year",
    details: "Best value with yearly billing"
  }
]

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState("free")

  useEffect(() => {
    const saved = localStorage.getItem("subscription_plan")
    if (saved) {
      setSelectedPlan(saved)
    }
  }, [])

  const choosePlan = (planKey) => {
    setSelectedPlan(planKey)
    localStorage.setItem("subscription_plan", planKey)
  }

  return (
    <div className="glass rounded-2.5xl p-6 border border-white/20 shadow-lg backdrop-blur-sm bg-white/40">
      <div className="flex items-center gap-2 mb-3">
        <MaterialIcon name="workspace_premium" size="26px" />
        <h3 className="text-xl font-bold text-slate-800">Subscription</h3>
      </div>
      <p className="text-sm text-slate-600 mb-5">Placeholder pricing and plans for now. Billing is not active yet.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLAN_OPTIONS.map((plan) => {
          const isSelected = selectedPlan === plan.key
          return (
            <div
              key={plan.key}
              className={`rounded-xl border p-4 bg-white ${isSelected ? "border-primary-500 ring-2 ring-primary-200" : "border-slate-200"}`}
            >
              <p className="text-base font-bold text-slate-800">{plan.title}</p>
              <p className="text-sm text-slate-900 mt-1 font-semibold">{plan.price}</p>
              <p className="text-xs text-slate-600 mt-2 min-h-[2.5rem]">{plan.details}</p>
              <button
                onClick={() => choosePlan(plan.key)}
                className={`mt-3 w-full py-2 px-3 rounded-lg text-sm font-semibold transition ${isSelected ? "bg-primary text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
              >
                {isSelected ? "Selected" : "Choose Plan"}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
