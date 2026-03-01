import React, { useEffect, useState } from "react"
import MaterialIcon from "../utils/MaterialIcon"

const PLAN_OPTIONS = [
  {
    key: "free",
    title: "Basic",
    subtitle: "Free",
    priceMonthly: "$0",
    priceAnnual: "$0",
    details: "Essential nutrition tracking and core app features",
    baseFeatures: [
      "Basic tracking log",
      "BMI calculator",
      "5 sample recipes",
      "10 AI chat responses per day"
    ],
    additionalFeatures: []
  },
  {
    key: "standard",
    title: "Standard",
    subtitle: "",
    priceMonthly: "$12.99",
    priceAnnual: "$119.88",
    details: "Enhanced features with full recipe access and more AI responses",
    baseFeatures: [],
    additionalFeatures: [
      "Full local recipe database",
      "Portion Scaler",
      "40 AI chat responses per day"
    ]
  },
  {
    key: "premium",
    title: "Premium",
    subtitle: "Clinical",
    priceMonthly: "$14.99",
    priceAnnual: "$179.88",
    details: "Advanced health monitoring and priority support with clinical features",
    baseFeatures: [],
    additionalFeatures: [
      "Safety Guardrails (Critical Alerts)",
      "PDF Download Reports",
      "Unlimited AI chat responses",
      "POI restaurant filtering",
      "Free one-on-one consultation (1x per year)"
    ]
  }
]

// Get cumulative features for a tier
const getCumulativeFeatures = (tierKey) => {
  const allFeatures = []
  
  // Add all features from Basic tier
  allFeatures.push(...PLAN_OPTIONS[0].baseFeatures)
  
  // Add additional features from Standard and below
  if (tierKey === "standard" || tierKey === "premium") {
    allFeatures.push(...PLAN_OPTIONS[1].additionalFeatures)
  }
  
  // Add additional features from Premium
  if (tierKey === "premium") {
    allFeatures.push(...PLAN_OPTIONS[2].additionalFeatures)
  }
  
  return allFeatures
}

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
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2.5xl p-6 border border-white/20 shadow-lg backdrop-blur-sm bg-white/40">
        <div className="flex items-center gap-2 mb-3">
          <MaterialIcon name="workspace_premium" size="26px" />
          <h3 className="text-2xl font-bold text-slate-800">Subscription Plans</h3>
        </div>
        <p className="text-slate-600">Choose a plan that fits your needs. Monthly and annual billing options are shown for paid tiers. Billing functionality is not active yet.</p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLAN_OPTIONS.map((plan) => {
          const isSelected = selectedPlan === plan.key
          const isPremium = plan.key === "premium"
          
          return (
            <div
              key={plan.key}
              className={`glass rounded-2.5xl border p-6 backdrop-blur-sm bg-white/40 transition flex flex-col h-full ${
                isSelected ? "border-primary-500 ring-2 ring-primary-200" : "border-white/20"
              }`}
            >
              {isPremium && (
                <div className="mb-3 inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold w-fit">
                  <MaterialIcon name="star" size="14px" filled={true} />
                  Most Popular
                </div>
              )}
              
              <div className="mb-4">
                <p className="text-2xl font-bold text-slate-900">{plan.title}</p>
                {plan.subtitle && <p className="text-xs text-slate-600 font-semibold">{plan.subtitle}</p>}
              </div>

              {/* Pricing */}
              <div className="mb-5">
                <p className="text-3xl font-bold text-slate-900">
                  {plan.key === 'free' ? '$0' : plan.priceMonthly}
                </p>
                {plan.key !== 'free' && (
                  <p className="text-sm text-slate-600">/month (or {plan.priceAnnual}/year)</p>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 mb-5">{plan.details}</p>

              {/* Features List */}
              <div className="mb-6 space-y-3 flex-1">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Included Features</p>
                {getCumulativeFeatures(plan.key).map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <MaterialIcon name="check_circle" size="18px" className="text-green-600" filled={true} />
                    </div>
                    <p className="text-sm text-slate-700">{feature}</p>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="mt-auto">
                {plan.key === 'free' ? (
                  <button
                    onClick={() => choosePlan(plan.key)}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                      isSelected 
                        ? "bg-gradient-to-r from-primary-600 to-secondary-600 text-white" 
                        : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <MaterialIcon name="check" size="18px" />
                        Selected
                      </>
                    ) : (
                      'Continue Free'
                    )}
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => choosePlan(`${plan.key}_monthly`)}
                      className={`py-3 px-3 rounded-lg font-semibold transition text-sm ${
                        selectedPlan === `${plan.key}_monthly` 
                          ? "bg-gradient-to-r from-primary-600 to-secondary-600 text-white" 
                          : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                      }`}
                    >
                      {selectedPlan === `${plan.key}_monthly` ? (
                        <>
                          <MaterialIcon name="check" size="16px" inline={true} /> Monthly
                        </>
                      ) : (
                        `Monthly`
                      )}
                    </button>
                    <button
                      onClick={() => choosePlan(`${plan.key}_annual`)}
                      className={`py-3 px-3 rounded-lg font-semibold transition text-sm ${
                        selectedPlan === `${plan.key}_annual` 
                          ? "bg-gradient-to-r from-primary-600 to-secondary-600 text-white" 
                          : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                      }`}
                    >
                      {selectedPlan === `${plan.key}_annual` ? (
                        <>
                          <MaterialIcon name="check" size="16px" inline={true} /> Annual
                        </>
                      ) : (
                        `Annual`
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* FAQ/Info Section */}
      <div className="glass rounded-2.5xl p-6 border border-white/20 shadow-lg backdrop-blur-sm bg-white/40">
        <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <MaterialIcon name="info" size="22px" />
          Plan Comparison
        </h4>
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Basic (Free):</span> Perfect for casual users who want to explore the app with essential features like tracking logs, BMI calculations, and sample recipes.
          </p>
          <p>
            <span className="font-semibold">Standard:</span> Ideal for users seeking more recipe variety, portion scaling, and increased AI chat support. Includes all Basic features plus enhanced capabilities.
          </p>
          <p>
            <span className="font-semibold">Premium (Clinical):</span> Designed for health-conscious individuals who need advanced safety alerts, comprehensive reports, and priority support including consultations. Includes all Standard features plus clinical-grade tools.
          </p>
        </div>
      </div>
    </div>
  )
}
