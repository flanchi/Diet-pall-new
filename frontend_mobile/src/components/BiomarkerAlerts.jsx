import React, { useState, useEffect } from "react"
import MaterialIcon from "../utils/MaterialIcon"

export default function BiomarkerAlerts({ user }) {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    loadAlerts()
    // Check for new alerts periodically
    const interval = setInterval(loadAlerts, 2000)
    return () => clearInterval(interval)
  }, [user])

  const loadAlerts = () => {
    try {
      const stored = localStorage.getItem(`biomarker_alerts_${user?.email}`)
      if (stored) {
        const parsedAlerts = JSON.parse(stored)
        setAlerts(parsedAlerts)
      }
    } catch (e) {
      console.error("Failed to load alerts", e)
    }
  }

  const dismissAlert = (id) => {
    const updated = alerts.filter((alert) => alert.id !== id)
    localStorage.setItem(`biomarker_alerts_${user?.email}`, JSON.stringify(updated))
    setAlerts(updated)
  }

  const dismissAllAlerts = () => {
    localStorage.setItem(`biomarker_alerts_${user?.email}`, JSON.stringify([]))
    setAlerts([])
  }

  if (alerts.length === 0) return null

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-800 flex items-center gap-2">
          <MaterialIcon name="warning" size="24px" />
          Health Alerts
        </h4>
        <button
          onClick={dismissAllAlerts}
          className="text-xs text-slate-600 hover:text-slate-800 underline"
        >
          Dismiss All
        </button>
      </div>

      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-lg p-4 border-l-4 animate-slide-in ${
            alert.severity === "critical"
              ? "bg-red-50 border-red-500 shadow-md"
              : alert.severity === "warning"
                ? "bg-yellow-50 border-yellow-500"
                : "bg-orange-50 border-orange-500"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="font-bold text-slate-900 flex items-center gap-2">
                <MaterialIcon name={alert.icon} size="20px" />
                {alert.biomarkerLabel}
              </p>
              <p className="text-sm text-slate-700 mt-1">{alert.message}</p>
              <div className="mt-2 text-xs text-slate-600 flex flex-wrap gap-3">
                <span>
                  <strong>Your Reading:</strong> {alert.reading}
                </span>
                <span>
                  <strong>Normal Range:</strong> {alert.normalRange}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 italic">
                {new Date(alert.timestamp).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 text-lg"
              title="Dismiss alert"
            >
              ✕
            </button>
          </div>

          {alert.recommendation && (
            <div className="mt-3 bg-white/60 rounded p-3 border-l-2 border-blue-400">
              <p className="text-xs font-semibold text-blue-900">💡 Recommendation:</p>
              <p className="text-xs text-slate-700 mt-1">{alert.recommendation}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
