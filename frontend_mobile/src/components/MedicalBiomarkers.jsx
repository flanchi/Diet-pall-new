import React, { useState, useEffect } from "react"
import axios from "axios"
import { API_URL } from "../config"
import MaterialIcon from "../utils/MaterialIcon"
import { generateBiomarkersPDF, filterLast30Days, formatDateForDisplay } from "../utils/downloadUtils"

export default function MedicalBiomarkers({ user }) {
  const [biomarkers, setBiomarkers] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedEntry, setExpandedEntry] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    biomarkerType: "blood-pressure",
    value1: "",
    value2: "",
    unit: "mmHg",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    notes: ""
  })

  const biomarkerTypes = {
    "blood-pressure": {
      label: "Blood Pressure (BP)",
      fields: [
        { name: "value1", label: "Systolic (mmHg)", placeholder: "e.g., 120" },
        { name: "value2", label: "Diastolic (mmHg)", placeholder: "e.g., 80" }
      ],
      unit: "mmHg",
      normal: "< 120/80",
      icon: "favorite"
    },
    "blood-sugar": {
      label: "Blood Sugar (Glucose)",
      fields: [{ name: "value1", label: "Glucose Level", placeholder: "e.g., 100" }],
      unit: "mg/dL",
      normal: "70-100 (fasting)",
      icon: "bloodtype"
    },
    "hba1c": {
      label: "HbA1c (Hemoglobin A1c)",
      fields: [{ name: "value1", label: "HbA1c Level", placeholder: "e.g., 5.5" }],
      unit: "%",
      normal: "< 5.7%",
      icon: "bar_chart"
    },
    "cholesterol": {
      label: "Cholesterol (Total)",
      fields: [{ name: "value1", label: "Total Cholesterol", placeholder: "e.g., 200" }],
      unit: "mg/dL",
      normal: "< 200",
      icon: "science"
    },
    "ldl": {
      label: "LDL (Bad Cholesterol)",
      fields: [{ name: "value1", label: "LDL Level", placeholder: "e.g., 100" }],
      unit: "mg/dL",
      normal: "< 100",
      icon: "trending_down"
    },
    "hdl": {
      label: "HDL (Good Cholesterol)",
      fields: [{ name: "value1", label: "HDL Level", placeholder: "e.g., 50" }],
      unit: "mg/dL",
      normal: "> 40 (M), > 50 (F)",
      icon: "trending_up"
    },
    "triglycerides": {
      label: "Triglycerides",
      fields: [{ name: "value1", label: "Triglyceride Level", placeholder: "e.g., 150" }],
      unit: "mg/dL",
      normal: "< 150",
      icon: "show_chart"
    },
    "heart-rate": {
      label: "Heart Rate (Resting)",
      fields: [{ name: "value1", label: "Beats Per Minute", placeholder: "e.g., 72" }],
      unit: "bpm",
      normal: "60-100",
      icon: "favorite"
    },
    "weight": {
      label: "Body Weight",
      fields: [{ name: "value1", label: "Weight", placeholder: "e.g., 75" }],
      unit: "kg",
      normal: "Depends on height",
      icon: "scale"
    },
    "temperature": {
      label: "Body Temperature",
      fields: [{ name: "value1", label: "Temperature", placeholder: "e.g., 37" }],
      unit: "°C",
      normal: "36.5 - 37.5",
      icon: "thermostat"
    }
  }

  // Load biomarkers from localStorage
  useEffect(() => {
    loadBiomarkers()
    
    // Add test data if empty (for testing download functionality)
    if (!user?.email) return
    const stored = localStorage.getItem(`biomarkers_${user?.email}`)
    if (!stored) {
      const testData = [
        {
          id: 1,
          type: "blood-pressure",
          value1: 120,
          value2: 80,
          date: new Date().toISOString().split("T")[0],
          time: "09:00 AM",
          notes: "Normal reading",
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          type: "blood-sugar",
          value1: 95,
          date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
          time: "09:15 AM",
          notes: "Fasting",
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 3,
          type: "heart-rate",
          value1: 72,
          date: new Date(Date.now() - 172800000).toISOString().split("T")[0],
          time: "10:00 AM",
          notes: "At rest",
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ]
      console.log("Adding test biomarker data for testing...")
      saveBiomarkers(testData)
    }
  }, [user])

  const loadBiomarkers = () => {
    try {
      const stored = localStorage.getItem(`biomarkers_${user?.email}`)
      console.log(`Looking for biomarkers with key: biomarkers_${user?.email}`)
      console.log("Stored biomarkers:", stored)
      if (stored) {
        setBiomarkers(JSON.parse(stored))
      }
    } catch (e) {
      console.error("Failed to load biomarkers", e)
    }
  }

  const saveBiomarkers = (data) => {
    try {
      localStorage.setItem(`biomarkers_${user?.email}`, JSON.stringify(data))
      setBiomarkers(data)
    } catch (e) {
      console.error("Failed to save biomarkers", e)
    }
  }

  const createAlertIfAbnormal = (entry) => {
    const bioType = biomarkerTypes[entry.type]
    let isAbnormal = false
    let severity = "info"
    let message = ""
    let recommendation = ""

    switch (entry.type) {
      case "blood-pressure":
        if (entry.value1 >= 180 || entry.value2 >= 120) {
          isAbnormal = true
          severity = "critical"
          message = "Your blood pressure is dangerously high. Seek immediate medical attention."
          recommendation = "Go to the nearest emergency room or call emergency services if experiencing chest pain, shortness of breath, or severe headache."
        } else if (entry.value1 >= 140 || entry.value2 >= 90) {
          isAbnormal = true
          severity = "warning"
          message = "Your blood pressure is elevated. Contact your doctor for guidance."
          recommendation = "Schedule an appointment with your doctor and consider lifestyle changes like reducing salt intake and increasing exercise."
        } else if (entry.value1 < 90 || entry.value2 < 60) {
          isAbnormal = true
          severity = "warning"
          message = "Your blood pressure is low. Monitor for dizziness or fainting."
          recommendation = "Drink more water, increase salt intake slightly, and avoid sudden position changes."
        }
        break

      case "blood-sugar":
        if (entry.value1 < 70) {
          isAbnormal = true
          severity = "critical"
          message = "Your blood sugar is too low (hypoglycemia). Act immediately!"
          recommendation = "Consume 15g of fast-acting carbs (juice, glucose tablets, or candy) and recheck in 15 minutes."
        } else if (entry.value1 > 250) {
          isAbnormal = true
          severity = "warning"
          message = "Your blood sugar is very high (hyperglycemia). Contact your doctor."
          recommendation = "Drink plenty of water and contact your healthcare provider for guidance."
        } else if ((entry.value1 > 125 && formData.notes?.toLowerCase().includes("fasting")) || entry.value1 > 140) {
          isAbnormal = true
          severity = "warning"
          message = "Your blood sugar level is higher than recommended."
          recommendation = "Increase physical activity, reduce simple carbohydrates, and consult your doctor."
        }
        break

      case "hba1c":
        if (entry.value1 >= 6.5) {
          isAbnormal = true
          severity = "warning"
          message = "Your HbA1c indicates diabetes. Consult your endocrinologist."
          recommendation = "Work with your doctor on a diabetes management plan including diet, exercise, and possibly medication."
        } else if (entry.value1 >= 5.7) {
          isAbnormal = true
          severity = "warning"
          message = "Your HbA1c is in the prediabetes range. Take action now."
          recommendation = "Implement lifestyle changes: lose weight, exercise regularly, and follow a healthy diet."
        }
        break

      case "cholesterol":
        if (entry.value1 >= 240) {
          isAbnormal = true
          severity = "warning"
          message = "Your total cholesterol is high. See your doctor."
          recommendation = "Reduce saturated fat intake, increase fiber, exercise regularly, and consider medication if advised by your doctor."
        } else if (entry.value1 >= 200) {
          isAbnormal = true
          severity = "warning"
          message = "Your total cholesterol is borderline high."
          recommendation = "Monitor your diet and exercise regularly to lower cholesterol naturally."
        }
        break

      case "ldl":
        if (entry.value1 >= 130) {
          isAbnormal = true
          severity = "warning"
          message = "Your LDL (bad cholesterol) is elevated."
          recommendation = "Follow a heart-healthy diet low in saturated fat and exercise regularly."
        }
        break

      case "hdl":
        if (entry.value1 < 40) {
          isAbnormal = true
          severity = "warning"
          message = "Your HDL (good cholesterol) is too low."
          recommendation = "Increase aerobic exercise, reduce refined carbs, and consider fish oil supplements."
        }
        break

      case "triglycerides":
        if (entry.value1 >= 200) {
          isAbnormal = true
          severity = "warning"
          message = "Your triglycerides are elevated."
          recommendation = "Reduce sugar and refined carbs, avoid alcohol, and increase omega-3 intake."
        }
        break

      case "heart-rate":
        if (entry.value1 < 40 || entry.value1 > 120) {
          isAbnormal = true
          severity = "warning"
          message = "Your resting heart rate is outside the normal range."
          recommendation = "Consult your doctor, especially if accompanied by symptoms like dizziness or shortness of breath."
        }
        break
    }

    if (isAbnormal) {
      const alertObj = {
        id: Date.now(),
        biomarkerType: entry.type,
        biomarkerLabel: bioType.label,
        icon: bioType.icon,
        reading: entry.value2 ? `${entry.value1}/${entry.value2} ${bioType.unit}` : `${entry.value1} ${bioType.unit}`,
        normalRange: bioType.normal,
        message,
        recommendation,
        severity,
        timestamp: new Date().toISOString()
      }

      // Store alert
      try {
        const stored = localStorage.getItem(`biomarker_alerts_${user?.email}`)
        const alerts = stored ? JSON.parse(stored) : []
        alerts.unshift(alertObj)
        // Keep only last 20 alerts
        localStorage.setItem(`biomarker_alerts_${user?.email}`, JSON.stringify(alerts.slice(0, 20)))
      } catch (e) {
        console.error("Failed to save alert", e)
      }
    }
  }

  const handleAddBiomarker = () => {
    if (!formData.value1 || (biomarkerTypes[formData.biomarkerType].fields.length > 1 && !formData.value2)) {
      alert("Please fill in all required fields")
      return
    }

    const newEntry = {
      id: Date.now(),
      type: formData.biomarkerType,
      value1: parseFloat(formData.value1),
      value2: formData.value2 ? parseFloat(formData.value2) : null,
      date: formData.date,
      time: formData.time,
      notes: formData.notes,
      createdAt: new Date().toISOString()
    }

    const updated = [newEntry, ...biomarkers]
    saveBiomarkers(updated)

    // Check if reading is abnormal and create alert
    createAlertIfAbnormal(newEntry)

    // Reset form
    setFormData({
      biomarkerType: "blood-pressure",
      value1: "",
      value2: "",
      unit: "mmHg",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      notes: ""
    })
    setShowForm(false)
  }

  const handleDeleteEntry = (id) => {
    const updated = biomarkers.filter((b) => b.id !== id)
    saveBiomarkers(updated)
  }

  const handleBiomarkerChange = (e) => {
    const type = e.target.value
    setFormData({
      biomarkerType: type,
      value1: "",
      value2: "",
      unit: biomarkerTypes[type].unit,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      notes: ""
    })
  }

  const formatValue = (entry) => {
    if (entry.value2) {
      return `${entry.value1}/${entry.value2}`
    }
    return entry.value1
  }

  const getStatusColor = (type, value1, value2) => {
    // Simple health status indicator based on common ranges
    switch (type) {
      case "blood-pressure":
        if (value1 < 120 && value2 < 80) return "text-green-600 bg-green-50"
        if (value1 < 130 && value2 < 85) return "text-yellow-600 bg-yellow-50"
        return "text-red-600 bg-red-50"
      case "blood-sugar":
        if (value1 >= 70 && value1 <= 100) return "text-green-600 bg-green-50"
        if (value1 >= 101 && value1 <= 125) return "text-yellow-600 bg-yellow-50"
        return "text-red-600 bg-red-50"
      case "hba1c":
        if (value1 < 5.7) return "text-green-600 bg-green-50"
        if (value1 < 6.5) return "text-yellow-600 bg-yellow-50"
        return "text-red-600 bg-red-50"
      case "heart-rate":
        if (value1 >= 60 && value1 <= 100) return "text-green-600 bg-green-50"
        if (value1 >= 50 && value1 <= 120) return "text-yellow-600 bg-yellow-50"
        return "text-red-600 bg-red-50"
      default:
        return "text-slate-600 bg-slate-50"
    }
  }

  const currentBiomarkerType = biomarkerTypes[formData.biomarkerType]

  const handleDownloadBiomarkers = () => {
    try {
      const last30Days = filterLast30Days(biomarkers)
      
      if (last30Days.length === 0) {
        alert("No biomarker data to download from the last 30 days")
        return
      }

      const exportData = {
        exportDate: formatDateForDisplay(new Date().toISOString()),
        user: user?.email,
        totalEntries: last30Days.length,
        dateRange: {
          from: formatDateForDisplay(last30Days[last30Days.length - 1].date),
          to: formatDateForDisplay(last30Days[0].date)
        },
        biomarkers: last30Days.map((entry) => {
          const bioType = biomarkerTypes[entry.type]
          return {
            type: entry.type,
            label: bioType.label,
            date: entry.date,
            time: entry.time,
            value: entry.value2 ? `${entry.value1}/${entry.value2}` : entry.value1,
            unit: bioType.unit,
            normalRange: bioType.normal,
            notes: entry.notes || "N/A",
            recordedAt: entry.createdAt
          }
        })
      }

      console.log("Exporting biomarkers:", exportData)
      generateBiomarkersPDF(exportData, user?.email)
    } catch (error) {
      console.error("Error downloading biomarkers:", error)
      alert("Error downloading biomarkers: " + error.message)
    }
  }

  return (
    <div className="glass rounded-2.5xl p-6 border border-white/20 shadow-lg backdrop-blur-sm bg-white/40 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MaterialIcon name="monitor_heart" size="28px" />
            Medical Biomarkers
          </h3>
          <p className="text-sm text-slate-600">Track your daily health metrics and test results</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadBiomarkers}
            disabled={biomarkers.length === 0}
            title="Download last 30 days of biomarker data"
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold py-2 px-4 rounded-lg transition shadow-md text-sm flex items-center gap-2"
          >
            <MaterialIcon name="download" size="18px" />
            Download
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg transition shadow-md text-sm flex items-center gap-2"
          >
            {showForm ? (
              <>
                <MaterialIcon name="close" size="18px" />
                Cancel
              </>
            ) : (
              <>
                <MaterialIcon name="add" size="18px" />
                Add Entry
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Entry Form */}
      {showForm && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200 space-y-4 animate-fade-in">
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Biomarker Type</span>
              <select
                value={formData.biomarkerType}
                onChange={handleBiomarkerChange}
                className="w-full mt-1 p-2 border border-blue-300 rounded-lg bg-white text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(biomarkerTypes).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.emoji} {config.label}
                  </option>
                ))}
              </select>
            </label>

            {/* Dynamic Fields */}
            <div className="space-y-3">
              {currentBiomarkerType.fields.map((field) => (
                <label key={field.name} className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    {field.label} <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="number"
                    placeholder={field.placeholder}
                    value={formData[field.name]}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="w-full mt-1 p-2 border border-blue-300 rounded-lg bg-white text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.1"
                  />
                </label>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Date</span>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full mt-1 p-2 border border-blue-300 rounded-lg bg-white text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Time</span>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full mt-1 p-2 border border-blue-300 rounded-lg bg-white text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Unit</span>
                <input
                  type="text"
                  value={currentBiomarkerType.unit}
                  disabled
                  className="w-full mt-1 p-2 border border-blue-300 rounded-lg bg-slate-100 text-slate-600 text-sm"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Notes (Optional)</span>
              <textarea
                placeholder="E.g., 'After meal', 'During exercise', etc."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full mt-1 p-2 border border-blue-300 rounded-lg bg-white text-slate-800 text-sm resize-none h-20 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </label>

            <button
              onClick={handleAddBiomarker}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 rounded-lg transition text-sm"
            >
              ✅ Save Entry
            </button>
          </div>

          {/* Quick Reference */}
          <div className="bg-white rounded-lg p-3 border border-blue-100 text-xs">
            <p className="font-semibold text-slate-700 mb-2">Normal Range: {currentBiomarkerType.normal}</p>
            <p className="text-slate-600">Regular tracking helps identify health trends and supports informed medical decisions.</p>
          </div>
        </div>
      )}

      {/* Biomarkers List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {biomarkers.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">No biomarker entries yet. Start tracking by adding your first entry!</p>
          </div>
        ) : (
          biomarkers.map((entry) => {
            const bioType = biomarkerTypes[entry.type]
            return (
              <div
                key={entry.id}
                className={`rounded-lg p-4 border cursor-pointer transition ${getStatusColor(
                  entry.type,
                  entry.value1,
                  entry.value2
                )} border-opacity-30`}
                onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MaterialIcon name={bioType.icon} size="32px" />
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{bioType.label}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}{entry.time && ` • ${entry.time}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-slate-900">
                      {formatValue(entry)} <span className="text-xs font-normal text-slate-600">{bioType.unit}</span>
                    </p>
                  </div>
                </div>

                {/* Expanded View */}
                {expandedEntry === entry.id && (
                  <div className="mt-4 pt-4 border-t border-current border-opacity-20 space-y-2 animate-fade-in">
                    {entry.notes && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Notes:</p>
                        <p className="text-sm text-slate-600 italic">{entry.notes}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteEntry(entry.id)
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-1 text-xs rounded transition"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Summary Stats */}
      {biomarkers.length > 0 && (
        <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg p-3 border border-blue-200">
          <p className="text-xs font-semibold text-slate-700">
            📈 Total Tracked: <span className="text-blue-600">{biomarkers.length} entries</span> from{" "}
            <span className="text-blue-600">
              {new Set(biomarkers.map((b) => b.type)).size} different biomarkers
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
