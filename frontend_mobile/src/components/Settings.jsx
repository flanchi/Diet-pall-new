import React from "react"
import MaterialIcon from "../utils/MaterialIcon"

const lengthOptions = [
  { value: "short", label: "Short" },
  { value: "normal", label: "Normal" },
  { value: "detailed", label: "Detailed" }
]

const toneOptions = [
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" }
]

export default function Settings({ settings, onChange, onClearChatMemory, onClearLocalProfile }) {
  const update = (path, value) => {
    const next = { ...settings }
    let cursor = next
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i]
      cursor[key] = { ...cursor[key] }
      cursor = cursor[key]
    }
    cursor[path[path.length - 1]] = value
    onChange(next)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="neu-surface p-6">
        <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MaterialIcon name="settings" size="28px" />
          Settings
        </h3>
        <p className="text-sm text-slate-600">Adjust appearance, AI behavior, and health preferences.</p>
      </div>

      <div className="neu-surface p-6 space-y-4">
        <h4 className="text-lg font-semibold text-slate-800">Appearance</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="text-sm font-semibold text-slate-700">
            Theme
            <select
              className="mt-2 w-full px-3 py-2 neu-surface-inset"
              value={settings.appearance.theme}
              onChange={e => update(["appearance", "theme"], e.target.value)}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Text Size
            <select
              className="mt-2 w-full px-3 py-2 neu-surface-inset"
              value={settings.appearance.textSize}
              onChange={e => update(["appearance", "textSize"], e.target.value)}
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              checked={settings.appearance.reduceMotion}
              onChange={e => update(["appearance", "reduceMotion"], e.target.checked)}
              className="w-4 h-4"
            />
            Reduce Motion
          </label>
        </div>
      </div>

      <div className="neu-surface p-6 space-y-4">
        <h4 className="text-lg font-semibold text-slate-800">AI Advisor</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm font-semibold text-slate-700">
            Response Length
            <select
              className="mt-2 w-full px-3 py-2 neu-surface-inset"
              value={settings.ai.responseLength}
              onChange={e => update(["ai", "responseLength"], e.target.value)}
            >
              {lengthOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Tone
            <select
              className="mt-2 w-full px-3 py-2 neu-surface-inset"
              value={settings.ai.tone}
              onChange={e => update(["ai", "tone"], e.target.value)}
            >
              {toneOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.ai.includeSources}
              onChange={e => update(["ai", "includeSources"], e.target.checked)}
              className="w-4 h-4"
            />
            Always include sources
          </label>
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.ai.multiAgent}
              onChange={e => update(["ai", "multiAgent"], e.target.checked)}
              className="w-4 h-4"
            />
            Use multiple agents
          </label>
        </div>
      </div>

      <div className="neu-surface p-6 space-y-4">
        <h4 className="text-lg font-semibold text-slate-800">Health Preferences</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="text-sm font-semibold text-slate-700">
            Weight Units
            <select
              className="mt-2 w-full px-3 py-2 neu-surface-inset"
              value={settings.units.weight}
              onChange={e => update(["units", "weight"], e.target.value)}
            >
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Height Units
            <select
              className="mt-2 w-full px-3 py-2 neu-surface-inset"
              value={settings.units.height}
              onChange={e => update(["units", "height"], e.target.value)}
            >
              <option value="cm">cm</option>
              <option value="in">in</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Glucose Units
            <select
              className="mt-2 w-full px-3 py-2 neu-surface-inset"
              value={settings.units.glucose}
              onChange={e => update(["units", "glucose"], e.target.value)}
            >
              <option value="mg/dL">mg/dL</option>
              <option value="mmol/L">mmol/L</option>
            </select>
          </label>
        </div>
      </div>

      <div className="neu-surface p-6 space-y-4">
        <h4 className="text-lg font-semibold text-slate-800">Notifications</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.notifications.mealReminders}
              onChange={e => update(["notifications", "mealReminders"], e.target.checked)}
              className="w-4 h-4"
            />
            Meal plan reminders
          </label>
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.notifications.medicationReminders}
              onChange={e => update(["notifications", "medicationReminders"], e.target.checked)}
              className="w-4 h-4"
            />
            Medication reminders
          </label>
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.notifications.biomarkerReminders}
              onChange={e => update(["notifications", "biomarkerReminders"], e.target.checked)}
              className="w-4 h-4"
            />
            Biomarker logging reminders
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Reminder time
            <input
              type="time"
              className="mt-2 w-full px-3 py-2 neu-surface-inset"
              value={settings.notifications.reminderTime}
              onChange={e => update(["notifications", "reminderTime"], e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="neu-surface p-6 space-y-4">
        <h4 className="text-lg font-semibold text-slate-800">Privacy</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClearChatMemory}
            className="neu-button font-semibold py-2 px-4"
          >
            Clear chat history
          </button>
          <button
            onClick={onClearLocalProfile}
            className="neu-button font-semibold py-2 px-4"
          >
            Clear saved profile
          </button>
        </div>
      </div>

      <div className="neu-surface p-6 space-y-4">
        <h4 className="text-lg font-semibold text-slate-800">Maps</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.maps.usePreciseLocation}
              onChange={e => update(["maps", "usePreciseLocation"], e.target.checked)}
              className="w-4 h-4"
            />
            Use precise location
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Default radius (km)
            <input
              type="number"
              min="1"
              max="50"
              className="mt-2 w-full px-3 py-2 neu-surface-inset"
              value={settings.maps.searchRadius}
              onChange={e => update(["maps", "searchRadius"], Number(e.target.value))}
            />
          </label>
        </div>
      </div>
    </div>
  )
}
