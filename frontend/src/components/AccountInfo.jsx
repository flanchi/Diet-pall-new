import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from '../config'
import MaterialIcon from '../utils/MaterialIcon'
import MedicalForm from './MedicalForm'

export default function AccountInfo({ user, profile, onProfile }) {
  const [emergencyContact, setEmergencyContact] = useState({
    name: '',
    relationship: '',
    phone: ''
  })
  const [emergencySaved, setEmergencySaved] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load emergency contact from backend on mount or when user changes
  useEffect(() => {
    if (user) {
      loadEmergencyContact()
    }
  }, [user])

  const loadEmergencyContact = async () => {
    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) return
      
      const res = await axios.get(`${API_URL}/api/auth/emergency-contact`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.data.emergencyContact && Object.keys(res.data.emergencyContact).length > 0) {
        setEmergencyContact(res.data.emergencyContact)
      }
    } catch (err) {
      console.error('Error loading emergency contact:', err)
    }
  }
  if (!user) return (
    <div className="glass rounded-2xl shadow-lg p-6 border border-white/20 backdrop-blur-sm bg-white/40">
      <div className="flex items-center gap-2">
        <MaterialIcon name="account_circle" size="24px" />
        <h3 className="text-xl font-semibold text-slate-800">Account</h3>
      </div>
      <p className="text-sm text-slate-600 mt-2">Not logged in.</p>
    </div>
  )

  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target
    setEmergencyContact(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveEmergencyContact = async () => {
    if (!emergencyContact.name || !emergencyContact.relationship || !emergencyContact.phone) {
      alert('Please fill in all emergency contact fields')
      return
    }
    
    // Validate Trinidad and Tobago phone format (starts with +1 868 or 0 followed by 7-10 digits)
    // use RegExp constructor and explicit semicolons to avoid any parser issues during build
    const phoneRegex = new RegExp('^(\\+?1\\s?868|0)?[\\s\\-]?[0-9]{3}[\\s\\-]?[0-9]{4}$');
    if (!phoneRegex.test(emergencyContact.phone.replace(/\s/g, ''))) {
      alert('Please enter a valid Trinidad and Tobago phone number (e.g., +1 868 123 4567 or 0123 4567)')
      return
    }
    
    setLoading(true)
    try {
      const token = localStorage.getItem('jwt_token')
      await axios.post(`${API_URL}/api/auth/emergency-contact`, emergencyContact, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      setEmergencySaved(true)
      setTimeout(() => setEmergencySaved(false), 3000)
    } catch (err) {
      console.error('Error saving emergency contact:', err)
      alert(err?.response?.data?.error || 'Failed to save emergency contact')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Account Information Card - Collapsible */}
      {(() => {
        const [collapsed, setCollapsed] = React.useState(false);
        return (
          <div className="glass rounded-2xl shadow-lg p-6 border border-white/20 backdrop-blur-sm bg-white/40 relative">
            <button
              className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-primary-100 text-primary-700 rounded-full p-1 text-base font-semibold shadow transition"
              onClick={() => setCollapsed((c) => !c)}
            >
              <MaterialIcon name={collapsed ? "expand_more" : "expand_less"} size="20px" />
            </button>
            {/* title always visible */}
            <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <MaterialIcon name="account_circle" size="28px" />
              Account Information
            </h3>
            {!collapsed && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-300">
                  <span className="text-slate-700 font-semibold">Name</span>
                  <span className="text-slate-800 font-semibold">{user.name || '—'}</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-300">
                  <span className="text-slate-700 font-semibold">Email</span>
                  <span className="text-slate-800 font-semibold">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700 font-semibold">Account Status</span>
                  <span className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-3 py-1 rounded-full text-sm font-semibold">Active</span>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Emergency Contact Section */}
      {(() => {
        const [emCollapsed, setEmCollapsed] = React.useState(false);
        return (
          <div className="glass rounded-2xl shadow-lg p-6 border border-white/20 backdrop-blur-sm bg-white/40 relative">
            <button
              className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-primary-100 text-primary-700 rounded-full p-1 text-base font-semibold shadow transition"
              onClick={() => setEmCollapsed(c => !c)}
            >
              <MaterialIcon name={emCollapsed ? "expand_more" : "expand_less"} size="20px" />
            </button>
            {/* header always shown */}
            <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <MaterialIcon name="emergency_share" size="28px" />
              Emergency Contact
            </h3>
            {!emCollapsed && (
              <>
                <p className="text-slate-600 text-sm mb-4">Add an emergency contact for your safety</p>
                <div className="space-y-4">
                  {/* Emergency Contact Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={emergencyContact.name}
                      onChange={handleEmergencyContactChange}
                      placeholder="Emergency contact's full name"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition duration-300"
                    />
                  </div>

                  {/* Relationship */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Relationship</label>
                    <select
                      name="relationship"
                      value={emergencyContact.relationship}
                      onChange={handleEmergencyContactChange}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition duration-300"
                    >
                      <option value="">Select relationship</option>
                      <option value="parent">Parent</option>
                      <option value="sibling">Sibling</option>
                      <option value="spouse">Spouse</option>
                      <option value="child">Child</option>
                      <option value="friend">Friend</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Phone Number (Trinidad & Tobago)</label>
                    <input
                      type="tel"
                      name="phone"
                      value={emergencyContact.phone}
                      onChange={handleEmergencyContactChange}
                      placeholder="+1 868 123 4567"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition duration-300"
                    />
                    <p className="text-xs text-slate-500 mt-1">Format: +1 868 123 4567 or 0123 4567</p>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleSaveEmergencyContact}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:shadow-glow-primary text-white font-bold py-3 px-4 rounded-full transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-wide text-sm flex items-center justify-center gap-2"
                    >
                      <MaterialIcon name="save" size="20px" />
                      {loading ? 'Saving...' : 'Save Emergency Contact'}
                    </button>
                  </div>

                  {/* Success Message */}
                  {emergencySaved && (
                    <div className="bg-green-100 border-2 border-green-500 text-green-700 px-4 py-3 rounded-lg text-sm font-semibold flex items-center gap-2">
                      <MaterialIcon name="check_circle" size="20px" />
                      Emergency contact saved successfully!
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* Medical Profile Section */}
      <div>
        <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MaterialIcon name="local_hospital" size="28px" />
          Medical Profile
        </h3>
        <p className="text-slate-600 text-sm mb-4">Update your health information to receive personalized meal plans.</p>
        <MedicalForm onProfile={onProfile} initialProfile={profile} />
      </div>
    </div>
  )
}
