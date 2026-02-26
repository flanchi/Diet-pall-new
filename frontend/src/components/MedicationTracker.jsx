import React, { useState, useEffect } from "react"
import MaterialIcon from "../utils/MaterialIcon"
import { generateMedicationsPDF, filterLast30Days, formatDateForDisplay } from "../utils/downloadUtils"

export default function MedicationTracker({ user, medicalProfile }) {
  const [medications, setMedications] = useState([])
  const [todayDate, setTodayDate] = useState(new Date().toISOString().split("T")[0])
  const [completedDoses, setCompletedDoses] = useState({})
  const [collapsed, setCollapsed] = useState(true)

  useEffect(() => {
    loadMedications()
    loadCompletedDoses()
    
    // Reset daily tracking at midnight
    const checkMidnight = setInterval(() => {
      const newDate = new Date().toISOString().split("T")[0]
      if (newDate !== todayDate) {
        setTodayDate(newDate)
        setCompletedDoses({})
      }
    }, 60000) // Check every minute

    return () => clearInterval(checkMidnight)
  }, [user, medicalProfile])

  const loadMedications = () => {
    try {
      const profile = medicalProfile || JSON.parse(localStorage.getItem("medical_profile") || "{}")
      if (profile.medications && Array.isArray(profile.medications)) {
        setMedications(profile.medications)
      }
    } catch (e) {
      console.error("Failed to load medications", e)
    }
  }

  const loadCompletedDoses = () => {
    try {
      const stored = localStorage.getItem(`medication_doses_${user?.email}_${todayDate}`)
      if (stored) {
        setCompletedDoses(JSON.parse(stored))
      } else {
        setCompletedDoses({})
      }
    } catch (e) {
      console.error("Failed to load completed doses", e)
    }
  }

  const saveCompletedDoses = (doses) => {
    try {
      localStorage.setItem(`medication_doses_${user?.email}_${todayDate}`, JSON.stringify(doses))
      setCompletedDoses(doses)
    } catch (e) {
      console.error("Failed to save completed doses", e)
    }
  }

  const getFrequencyCheckboxes = (frequency) => {
    const checkboxes = {
      morning: ["Morning"],
      afternoon: ["Afternoon"],
      evening: ["Evening"],
      night: ["Night"],
      "morning-evening": ["Morning", "Evening"],
      daily: ["Take"],
      "twice-daily": ["1st Dose", "2nd Dose"],
      "three-times-daily": ["1st Dose", "2nd Dose", "3rd Dose"],
      weekly: ["Weekly"],
      "as-needed": ["As Needed"]
    }
    return checkboxes[frequency] || ["Take"]
  }

  const toggleDose = (medId, doseIndex) => {
    const key = `${medId}_${doseIndex}`
    const updated = { ...completedDoses }
    updated[key] = !updated[key]
    saveCompletedDoses(updated)
  }

  const getCompletionPercentage = () => {
    if (medications.length === 0) return 0

    let totalDoses = 0
    let completedCount = 0

    medications.forEach((med) => {
      const checkboxes = getFrequencyCheckboxes(med.frequency)
      totalDoses += checkboxes.length
      checkboxes.forEach((_, idx) => {
        if (completedDoses[`${med.id}_${idx}`]) {
          completedCount++
        }
      })
    })

    return totalDoses === 0 ? 0 : Math.round((completedCount / totalDoses) * 100)
  }

  const getProgressColor = () => {
    const completion = getCompletionPercentage()
    if (completion === 0) return "from-slate-400 to-slate-500"
    if (completion < 50) return "from-red-400 to-red-500"
    if (completion < 100) return "from-yellow-400 to-yellow-500"
    return "from-green-400 to-green-500"
  }

  const getDoseTimeLabel = (frequency, index) => {
    const times = {
      morning: ["7:00 AM"],
      afternoon: ["1:00 PM"],
      evening: ["6:00 PM"],
      night: ["9:00 PM"],
      "morning-evening": ["7:00 AM", "6:00 PM"],
      daily: ["Any time"],
      "twice-daily": ["Morning", "Evening"],
      "three-times-daily": ["Morning", "Afternoon", "Evening"],
      weekly: ["Once per week"],
      "as-needed": ["As needed"]
    }
    const timeArray = times[frequency] || ["Take"]
    return timeArray[index] || "Take"
  }

  const handleDownloadMedications = () => {
    try {
      if (medications.length === 0) {
        alert("No medication data to download")
        return
      }

      // Get today's doses data
      const today = todayDate
      const dosesData = Object.entries(completedDoses)
        .filter(([key]) => key.includes(`_`))
        .map(([key, completed]) => {
          const [medId, doseIndex] = key.split("_")
          const med = medications.find((m) => m.id == medId)
          if (!med) return null
          return {
            medId,
            doseIndex: parseInt(doseIndex),
            completed
          }
        })
        .filter(Boolean)

      const exportData = {
        exportDate: formatDateForDisplay(new Date().toISOString()),
        user: user?.email,
        trackedDate: today,
        totalMedications: medications.length,
        totalDosesCompleted: Object.values(completedDoses).filter(Boolean).length,
        medications: medications.map((med) => {
          const checkboxes = getFrequencyCheckboxes(med.frequency)
          const medCompleted = checkboxes.filter((_, idx) => completedDoses[`${med.id}_${idx}`]).length
          return {
            id: med.id,
            name: med.name,
            concentration: med.concentration,
            medium: med.medium,
            dosage: med.dosage,
            frequency: med.frequency,
            notes: med.notes || "N/A",
            dosesScheduled: checkboxes.length,
            dosesCompleted: medCompleted,
            completionPercentage: Math.round((medCompleted / checkboxes.length) * 100),
            doseDetails: checkboxes.map((label, idx) => ({
              dose: label,
              scheduledTime: getDoseTimeLabel(med.frequency, idx),
              completed: completedDoses[`${med.id}_${idx}`] || false
            }))
          }
        })
      }

      console.log("Exporting medications:", exportData)
      generateMedicationsPDF(exportData, user?.email)
    } catch (error) {
      console.error("Error downloading medications:", error)
      alert("Error downloading medications: " + error.message)
    }
  }


  return (
    <div className="glass rounded-2.5xl p-6 border border-white/20 shadow-lg backdrop-blur-sm bg-white/40 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 relative">
        <button
          className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-primary-100 text-primary-700 rounded-full p-1 text-base font-semibold shadow transition"
          onClick={() => setCollapsed(c => !c)}
        >
          <MaterialIcon name={collapsed ? "expand_more" : "expand_less"} size="20px" />
        </button>
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MaterialIcon name="medication" size="28px" />
            Medication Tracker
          </h3>
          <p className="text-sm text-slate-600">Today's Medication Schedule</p>
        </div>
        <button
          onClick={handleDownloadMedications}
          title="Download today's medication data"
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 px-4 rounded-lg transition shadow-md text-sm flex items-center gap-2"
        >
          <MaterialIcon name="download" size="18px" />
          Download
        </button>
      </div>

      {!collapsed && (
        <div>
          {medications.length === 0 ? (
            <div className="text-sm text-slate-600 py-4">
              No medications found. Add medications in your medical profile to start tracking.
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Daily Progress</p>
                  <p className="text-sm font-bold text-slate-800">{getCompletionPercentage()}%</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-300`}
                    style={{ width: `${getCompletionPercentage()}%` }}
                  />
                </div>
              </div>

              {/* Medications List */}
              <div className="space-y-4">
                {medications.map((med) => {
                  const checkboxes = getFrequencyCheckboxes(med.frequency)
                  const medDosesCompleted = checkboxes.filter((_, idx) => completedDoses[`${med.id}_${idx}`]).length
                  const isAllTaken = medDosesCompleted === checkboxes.length

                  return (
                    <div
                      key={med.id}
                      className={`rounded-lg p-4 border transition ${
                        isAllTaken
                          ? "bg-green-50 border-green-300"
                          : medDosesCompleted > 0
                            ? "bg-blue-50 border-blue-300"
                            : "bg-slate-50 border-slate-300"
                      }`}
                    >
                      {/* Medication Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-bold text-slate-900">
                            {med.name} <span className="text-xs font-normal text-slate-600">{med.concentration}</span>
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            {med.medium} • {med.dosage} • {med.frequency}
                          </p>
                        </div>
                        {isAllTaken && <span className="text-2xl">✅</span>}
                      </div>

                      {/* Dose Checkboxes */}
                      <div className="space-y-2">
                        {checkboxes.map((label, idx) => {
                          const isChecked = completedDoses[`${med.id}_${idx}`] || false
                          return (
                            <label
                              key={idx}
                              className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white/50 transition"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleDose(med.id, idx)}
                                className="w-5 h-5 rounded border-2 border-slate-400 cursor-pointer accent-blue-600"
                              />
                              <div className="flex-1">
                                <span className={`text-sm font-medium ${isChecked ? "line-through text-slate-500" : "text-slate-700"}`}>
                                  {label}
                                </span>
                                <span className="text-xs text-slate-500 ml-2">{getDoseTimeLabel(med.frequency, idx)}</span>
                              </div>
                              {isChecked && <span className="text-green-600">✓</span>}
                            </label>
                          )
                        })}
                      </div>

                      {/* Dose Counter */}
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs text-slate-600">
                          Doses taken: <span className="font-bold text-slate-800">{medDosesCompleted}</span> / {checkboxes.length}
                        </p>
                      </div>

                      {/* Notes */}
                      {med.notes && (
                        <div className="mt-2 text-xs italic text-slate-600 bg-white/50 rounded p-2">
                          {med.notes}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Footer Info */}
              <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg p-3 border border-blue-200 text-xs text-slate-700">
                <p>
                  <strong>💡 Tip:</strong> Check off each dose as you take your medication. Progress resets daily at midnight.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
