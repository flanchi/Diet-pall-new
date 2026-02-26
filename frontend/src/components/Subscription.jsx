import React, { useEffect, useState } from "react"
import MaterialIcon from "../utils/MaterialIcon"

const PLAN_OPTIONS = [
  {
    key: "free",
    title: "Free",
    priceMonthly: "$0",
    priceAnnual: "$0",
    details: "Basic planning and core app features"
  },
  {
    key: "standard",
    title: "Standard",
    priceMonthly: "$12.99",
    priceAnnual: "$119.88",
    details: "Full feature access, meal plans, and basic AI suggestions"
  },
  {
    key: "premium",
    title: "Premium",
    priceMonthly: "$14.99",
    priceAnnual: "$179.88",
    details: "Priority support, advanced AI meal planning, and premium content"
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
      <p className="text-sm text-slate-600 mb-5">Choose a plan that fits your needs. Monthly and annual billing options are shown for paid tiers. Billing functionality is not active yet.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLAN_OPTIONS.map((plan) => {
          const isSelected = selectedPlan === plan.key
          return (
            <div
              key={plan.key}
              className={`rounded-xl border p-4 bg-white ${isSelected ? "border-primary-500 ring-2 ring-primary-200" : "border-slate-200"}`}
            >
              <p className="text-base font-bold text-slate-800">{plan.title}</p>
              <div className="mt-1">
                <p className="text-sm text-slate-900 font-semibold">{plan.key === 'free' ? "$0" : `${plan.priceMonthly}/month`}</p>
                {plan.key !== 'free' && (
                  <p className="text-xs text-slate-600">or {plan.priceAnnual}/year</p>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-2 min-h-[2.5rem]">{plan.details}</p>

              {/* Action buttons: Free has single button, paid plans offer Monthly and Annual choices */}
              {plan.key === 'free' ? (
                <button
                  onClick={() => choosePlan(plan.key)}
                  className={`mt-3 w-full py-2 px-3 rounded-lg text-sm font-semibold transition ${isSelected ? "bg-primary text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  {isSelected ? "Selected" : "Continue Free"}
                </button>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => choosePlan(`${plan.key}_monthly`)}
                    className={`py-2 px-3 rounded-lg text-sm font-semibold transition ${selectedPlan === `${plan.key}_monthly` ? "bg-primary text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                  >
                    {selectedPlan === `${plan.key}_monthly` ? "Selected" : `${plan.priceMonthly}/mo`}
                  </button>
                  <button
                    onClick={() => choosePlan(`${plan.key}_annual`)}
                    className={`py-2 px-3 rounded-lg text-sm font-semibold transition ${selectedPlan === `${plan.key}_annual` ? "bg-primary text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                  >
                    {selectedPlan === `${plan.key}_annual` ? "Selected" : `${plan.priceAnnual}/yr`}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
