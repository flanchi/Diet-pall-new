import React, { useState } from "react"
import axios from "axios"
import { API_URL } from '../config'
import MaterialIcon from '../utils/MaterialIcon'

function setToken(token) {
  if (token) {
    localStorage.setItem("jwt_token", token)
    axios.defaults.headers.common["Authorization"] = "Bearer " + token
  } else {
    localStorage.removeItem("jwt_token")
    delete axios.defaults.headers.common["Authorization"]
  }
}

export default function AuthForm({ onAuth }) {
  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = `${API_URL}/api/auth/${mode}`
      const body = mode === "register" ? { email, password, name } : { email, password }
      console.log('Attempting auth at:', url)
      console.log('API_URL:', API_URL)
      const res = await axios.post(url, body, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      })
      const { token, user } = res.data
      setToken(token)
      onAuth(user)
      setEmail("")
      setPassword("")
      setName("")
    } catch (err) {
      console.error('Auth error:', err)
      console.error('Error response:', err?.response)
      console.error('Error status:', err?.response?.status)
      console.error('Error data:', err?.response?.data)
      alert(err?.response?.data?.error || "Auth failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-slide-up glass rounded-2.5xl shadow-card p-8 border border-white/20 card-hover backdrop-blur-sm">    
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-3xl font-bold gradient-text">
            {mode === "login" ? (
              "Welcome Back"
            ) : (
              <>
                <MaterialIcon name="star" size="32px" />
                Join Now
              </>
            )}
          </h3>
          <p className="text-slate-200">
            {mode === "login" 
              ? "Sign in to access your personalized nutrition guide"
              : "Create your account to get started with healthy eating"
            }
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition duration-300"
                placeholder="Your name"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition duration-300"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition duration-300"
              placeholder=""
            />
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:shadow-glow-primary text-white font-bold py-3 px-4 rounded-full transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-wide text-sm"
            >
              {loading ? " Processing..." : mode === "login" ? " Login" : " Register"}
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-full transition-all duration-300 uppercase tracking-wide text-sm"
            >
              {mode === "login" ? " New?" : " Have account?"}
            </button>
          </div>
        </form>

        {/* Features list */}
        <div className="pt-4 border-t border-slate-200 space-y-2 text-sm">
          <p className="font-semibold text-slate-700">After login, you'll access:</p>
          <ul className="space-y-1 text-slate-600">
            <li> Personalized meal plans</li>
            <li> AI health advisor</li>
            <li> Recipe recommendations</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
