import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from '../config'
import MaterialIcon from '../utils/MaterialIcon'

// BMI Calculation function
const calculateBMI = (weight, height) => {
  if (!weight || !height) return null
  // height is in cm, convert to meters
  const heightInMeters = height / 100
  return (weight / (heightInMeters * heightInMeters)).toFixed(1)
}

// Get BMI category and recommendation based on age and gender
const getBMIRecommendation = (bmi, age, gender) => {
  const bmiNum = parseFloat(bmi)
  
  // Standard BMI categories
  if (bmiNum < 18.5) {
    return {
      status: 'Underweight',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      recommendation: 'Below healthy weight range',
      range: '18.5 - 24.9'
    }
  } else if (bmiNum >= 18.5 && bmiNum < 25) {
    return {
      status: 'Healthy Weight',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      recommendation: 'Within healthy weight range ✓',
      range: '18.5 - 24.9'
    }
  } else if (bmiNum >= 25 && bmiNum < 30) {
    return {
      status: 'Overweight',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      recommendation: 'Above healthy weight range',
      range: '18.5 - 24.9'
    }
  } else {
    return {
      status: 'Obese',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      recommendation: 'Significantly above healthy weight range',
      range: '18.5 - 24.9'
    }
  }
}

export default function MedicalForm({ onProfile, initialProfile }) {
  const [age, setAge] = useState(30)
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [gender, setGender] = useState('other')
  const [conditions, setConditions] = useState({
    diabetes: false,
    hypertension: false,
    diabetesMellitus: false,
    ischaemicHeartDisease: false,
    kidneyDiseases: false,
    hypertensiveHeartDisease: false
  })
  const [allergies, setAllergies] = useState('')
  const [medications, setMedications] = useState([])
  const [tempMedication, setTempMedication] = useState({
    name: '',
    concentration: '',
    medium: 'oral-pill',
    dosage: 'custom',
    dosageCustom: '',
    frequency: 'daily'
  })
  const [dietaryRestriction, setDietaryRestriction] = useState('omnivore')
  const [religiousPreference, setReligiousPreference] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const profile = initialProfile || (() => {
      try {
        const raw = localStorage.getItem("medical_profile")
        return raw ? JSON.parse(raw) : null
      } catch (error) {
        return null
      }
    })()

    if (!profile) return

    setAge(profile.age ?? 30)
    setWeight(profile.weight ?? 70)
    setHeight(profile.height ?? 170)
    setGender(profile.gender ?? 'other')

    const existingConditions = Array.isArray(profile.conditions) ? profile.conditions : []
    setConditions(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(key => {
        updated[key] = existingConditions.includes(key)
      })
      return updated
    })

    const allergiesList = Array.isArray(profile.allergies)
      ? profile.allergies
      : typeof profile.allergies === 'string'
        ? profile.allergies.split(',').map(item => item.trim()).filter(Boolean)
        : []
    setAllergies(allergiesList.join(', '))

    setMedications(Array.isArray(profile.medications) ? profile.medications : [])
    setDietaryRestriction(profile.dietaryRestriction ?? 'omnivore')
    setReligiousPreference(profile.religiousPreference ?? '')
  }, [initialProfile])

  async function saveProfile() {
    setLoading(true)
    const profile = {
      age,
      weight,
      height,
      gender,
      conditions: Object.keys(conditions).filter(k => conditions[k]),
      allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
      medications: medications,
      dietaryRestriction,
      religiousPreference
    }
    try {
      const res = await axios.post(`${API_URL}/api/auth/profiles`, profile)
      localStorage.setItem('medical_profile', JSON.stringify(profile))
      if (onProfile) onProfile(profile)
      alert('Profile saved (' + (res.data.profiles||[]).length + ' total)')
    } catch (err) {
      console.error(err)
      alert('Failed to save profile. Are you logged in?')
    } finally { setLoading(false) }
  }

  const addMedication = () => {
    if (!tempMedication.name || !tempMedication.concentration) {
      alert('Please enter medication name and concentration')
      return
    }
    
    const dosageValue = tempMedication.dosage === 'custom' ? tempMedication.dosageCustom : tempMedication.dosage
    if (!dosageValue) {
      alert('Please select or enter a dosage')
      return
    }

    const newMedication = {
      ...tempMedication,
      dosage: dosageValue,
      id: Date.now()
    }
    
    setMedications([...medications, newMedication])
    setTempMedication({
      name: '',
      concentration: '',
      medium: 'oral-pill',
      dosage: 'custom',
      dosageCustom: '',
      frequency: 'daily'
    })
  }

  const removeMedication = (id) => {
    setMedications(medications.filter(med => med.id !== id))
  }

  const handleTempMedicationChange = (field, value) => {
    setTempMedication(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="glass rounded-2xl p-8 border border-white/20 shadow-lg backdrop-blur-sm bg-white/40">
      <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
        <MaterialIcon name="local_hospital" size="28px" />
        Medical Profile
      </h2>
      <p className="text-sm text-slate-600 mb-6">Save your profile to generate daily meal plans from the Home tab.</p>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Age</label>
          <input
            type="number"
            value={age}
            onChange={e => setAge(Number(e.target.value))}
            className="w-full px-4 py-2 border border-slate-300 bg-white/80 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={e => setWeight(Number(e.target.value))}
            className="w-full px-4 py-2 border border-slate-300 bg-white/80 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Height (cm)</label>
          <input
            type="number"
            value={height}
            onChange={e => setHeight(Number(e.target.value))}
            className="w-full px-4 py-2 border border-slate-300 bg-white/80 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
          <select
            value={gender}
            onChange={e => setGender(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 bg-white/80 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>
      </div>

      {/* BMI Calculation Display */}
      {calculateBMI(weight, height) && (
        <div className={`mb-6 p-4 rounded-lg border-2 ${getBMIRecommendation(calculateBMI(weight, height), age, gender).bgColor} ${getBMIRecommendation(calculateBMI(weight, height), age, gender).borderColor}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-800">📊 BMI Calculator</h3>
            <span className={`text-2xl font-bold ${getBMIRecommendation(calculateBMI(weight, height), age, gender).color}`}>
              {calculateBMI(weight, height)}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700">Status:</span>
              <span className={`font-bold ${getBMIRecommendation(calculateBMI(weight, height), age, gender).color}`}>
                {getBMIRecommendation(calculateBMI(weight, height), age, gender).status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700">Healthy Range:</span>
              <span className="text-sm text-slate-900 font-semibold">
                {getBMIRecommendation(calculateBMI(weight, height), age, gender).range}
              </span>
            </div>
            <div className="bg-white/60 p-2 rounded mt-3">
              <p className="text-sm text-slate-700">
                💡 <span className="font-semibold">{getBMIRecommendation(calculateBMI(weight, height), age, gender).recommendation}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-3">Health Conditions</label>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={conditions.diabetes}
              onChange={e => setConditions({...conditions, diabetes: e.target.checked})}
              className="w-4 h-4 text-primary-400 rounded focus:ring-primary-400"
            />
            <span className="ml-3 text-slate-700">Diabetes</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={conditions.hypertension}
              onChange={e => setConditions({...conditions, hypertension: e.target.checked})}
              className="w-4 h-4 text-primary-400 rounded focus:ring-primary-400"
            />
            <span className="ml-3 text-slate-700">Hypertension</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={conditions.diabetesMellitus}
              onChange={e => setConditions({...conditions, diabetesMellitus: e.target.checked})}
              className="w-4 h-4 text-primary-400 rounded focus:ring-primary-400"
            />
            <span className="ml-3 text-slate-700">Diabetes Mellitus</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={conditions.ischaemicHeartDisease}
              onChange={e => setConditions({...conditions, ischaemicHeartDisease: e.target.checked})}
              className="w-4 h-4 text-primary-400 rounded focus:ring-primary-400"
            />
            <span className="ml-3 text-slate-700">Ischaemic Heart Disease</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={conditions.kidneyDiseases}
              onChange={e => setConditions({...conditions, kidneyDiseases: e.target.checked})}
              className="w-4 h-4 text-primary-400 rounded focus:ring-primary-400"
            />
            <span className="ml-3 text-slate-700">Kidney Diseases</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={conditions.hypertensiveHeartDisease}
              onChange={e => setConditions({...conditions, hypertensiveHeartDisease: e.target.checked})}
              className="w-4 h-4 text-primary-400 rounded focus:ring-primary-400"
            />
            <span className="ml-3 text-slate-700">Hypertensive Heart Disease</span>
          </label>
        </div>
      </div>

      {/* Medications Section */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MaterialIcon name="pills" size="24px" />
          Current Medications
        </h3>
        
        {/* Add Medication Form */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-slate-700 mb-4">Add New Medication</p>
          
          {/* Name and Concentration Row */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medication Name</label>
              <input
                type="text"
                value={tempMedication.name}
                onChange={e => handleTempMedicationChange('name', e.target.value)}
                placeholder="e.g., Metformin"
                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Concentration</label>
              <input
                type="text"
                value={tempMedication.concentration}
                onChange={e => handleTempMedicationChange('concentration', e.target.value)}
                placeholder="e.g., 500mg"
                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>

          {/* Medium and Dosage Row */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medium</label>
              <select
                value={tempMedication.medium}
                onChange={e => handleTempMedicationChange('medium', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="oral-pill">Oral - Pill</option>
                <option value="oral-liquid">Oral - Liquid</option>
                <option value="injection">Injection</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage</label>
              <select
                value={tempMedication.dosage}
                onChange={e => handleTempMedicationChange('dosage', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="1-pill">1 Pill</option>
                <option value="2-pills">2 Pills</option>
                <option value="3-pills">3 Pills</option>
                <option value="1-teaspoon">1 Teaspoon</option>
                <option value="1-tablespoon">1 Tablespoon</option>
                <option value="2-tablespoons">2 Tablespoons</option>
                <option value="1ml">1 ml</option>
                <option value="5ml">5 ml</option>
                <option value="10ml">10 ml</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          {/* Custom Dosage Input */}
          {tempMedication.dosage === 'custom' && (
            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Dosage</label>
              <input
                type="text"
                value={tempMedication.dosageCustom}
                onChange={e => handleTempMedicationChange('dosageCustom', e.target.value)}
                placeholder="e.g., 1.5 tablets"
                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          )}

          {/* Frequency */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
            <select
              value={tempMedication.frequency}
              onChange={e => handleTempMedicationChange('frequency', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
              <option value="morning-evening">Morning & Evening</option>
              <option value="daily">Daily</option>
              <option value="twice-daily">Twice Daily</option>
              <option value="three-times-daily">Three Times Daily</option>
              <option value="weekly">Weekly</option>
              <option value="as-needed">As Needed</option>
            </select>
          </div>

          {/* Add Button */}
          <button
            onClick={addMedication}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-400 hover:shadow-lg text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 text-sm"
          >
            + Add Medication
          </button>
        </div>

        {/* Medications List */}
        {medications.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 mb-3">Saved Medications ({medications.length})</p>
            {medications.map(med => (
              <div key={med.id} className="bg-slate-100 border border-slate-300 rounded-lg p-3 flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{med.name} {med.concentration}</p>
                  <p className="text-xs text-slate-600 flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1">
                      <MaterialIcon name="description" size="16px" />
                      {med.medium}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MaterialIcon name="pills" size="16px" />
                      {med.dosage}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MaterialIcon name="schedule" size="16px" />
                      {med.frequency}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => removeMedication(med.id)}
                  className="ml-2 text-red-600 hover:text-red-800 font-bold text-lg"
                >
                  <MaterialIcon name="close" size="20px" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Dietary Restriction</label>
          <select
            value={dietaryRestriction}
            onChange={e => setDietaryRestriction(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 bg-white/80 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition"
          >
            <option value="omnivore">Omnivore</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="pescetarian">Pescetarian</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Religious Preference</label>
          <input
            value={religiousPreference}
            onChange={e => setReligiousPreference(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 bg-white/80 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition"
            placeholder="Halal, Ital, etc."
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Allergies (comma-separated)</label>
        <input
          value={allergies}
          onChange={e => setAllergies(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 bg-white/80 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition"
          placeholder="peanut, shellfish, dairy..."
        />
      </div>

      <div>
        <button
          type="button"
          onClick={saveProfile}
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {loading ? '⏳ Saving...' : '💾 Save Profile'}
        </button>
      </div>
    </div>
  )
}
