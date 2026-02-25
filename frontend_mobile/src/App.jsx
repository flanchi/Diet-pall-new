import React, { useState, useEffect, useRef } from "react"
import axios from "axios"
import { API_URL } from "./config"
import MaterialIcon from "./utils/MaterialIcon"
import MapView from "./components/MapView"
import AuthForm from "./components/AuthForm"
import MealPlanDisplay from "./components/MealPlanDisplay"
import Hero from "./components/Hero"
import AccountInfo from "./components/AccountInfo"
import MealHistory from "./components/MealHistory"
import FavoriteMeals from "./components/FavoriteMeals"
import RestaurantsList from "./components/RestaurantsList"
import FavoriteRestaurants from "./components/FavoriteRestaurants"
import AIChat from "./components/AIChat"
import MedicalBiomarkers from "./components/MedicalBiomarkers"
import BiomarkerAlerts from "./components/BiomarkerAlerts"
import MedicationTracker from "./components/MedicationTracker"
import Settings from "./components/Settings"
import Subscription from "./components/Subscription"

export default function App() {
  const [mealPlan, setMealPlan] = useState(null)
  const [user, setUser] = useState(null)
  const [medicalProfile, setMedicalProfile] = useState(null)
  const [recipeQuery, setRecipeQuery] = useState(null)
  const [mealPlanLoading, setMealPlanLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isChatWidgetOpen, setIsChatWidgetOpen] = useState(false)
  const [isChatWidgetMinimized, setIsChatWidgetMinimized] = useState(false)
  const [chatUnreadCount, setChatUnreadCount] = useState(0)
  const [settings, setSettings] = useState({
    appearance: { theme: "system", textSize: "md", reduceMotion: false },
    ai: { responseLength: "normal", tone: "friendly", includeSources: false, multiAgent: true },
    units: { weight: "kg", height: "cm", glucose: "mg/dL" },
    notifications: { mealReminders: false, medicationReminders: false, biomarkerReminders: false, reminderTime: "08:00" },
    maps: { usePreciseLocation: true, searchRadius: 5 }
  })

  useEffect(() => {
    // Clear any old login state on initial load
    // User must login fresh each time
  }, [])

  useEffect(() => {
    // Scroll to top when user logs in
    if (isLoggedIn) {
      window.scrollTo(0, 0)
    }
  }, [isLoggedIn])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("app_settings")
      if (raw) {
        const parsed = JSON.parse(raw)
        setSettings(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.error("Failed to load settings", error)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("app_settings", JSON.stringify(settings))

    const root = document.documentElement
    root.classList.remove("theme-light", "theme-dark", "text-size-sm", "text-size-md", "text-size-lg", "reduce-motion")

    if (settings.appearance.theme === "light") root.classList.add("theme-light")
    if (settings.appearance.theme === "dark") root.classList.add("theme-dark")

    const sizeClass = `text-size-${settings.appearance.textSize}`
    root.classList.add(sizeClass)

    if (settings.appearance.reduceMotion) root.classList.add("reduce-motion")
  }, [settings])

  const [tab, setTab] = useState("home")
  const [isNavOpen, setIsNavOpen] = useState(false)
  const tabRef = useRef(tab)
  const isChatWidgetOpenRef = useRef(isChatWidgetOpen)
  const navMenuRef = useRef(null)
  const userMenuRef = useRef(null)

  useEffect(() => {
    tabRef.current = tab
  }, [tab])

  useEffect(() => {
    isChatWidgetOpenRef.current = isChatWidgetOpen
  }, [isChatWidgetOpen])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (navMenuRef.current && !navMenuRef.current.contains(event.target)) {
        setIsNavOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [])

  const playChatNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) return

      const context = new AudioContextClass()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const now = context.currentTime

      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(880, now)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)

      oscillator.connect(gain)
      gain.connect(context.destination)

      oscillator.start(now)
      oscillator.stop(now + 0.22)
      oscillator.onended = () => {
        context.close()
      }
    } catch (error) {
      console.error("Chat notification sound failed", error)
    }
  }

  const handleWidgetAiMessage = (event) => {
    if (tabRef.current !== "ai" && isChatWidgetOpenRef.current && event?.wasMinimized) {
      setChatUnreadCount((prev) => prev + 1)
      playChatNotificationSound()
    }
  }

  const handleToggleChatWidgetMinimize = () => {
    setIsChatWidgetMinimized((prev) => {
      const next = !prev
      if (!next) {
        setChatUnreadCount(0)
      }
      return next
    })
  }

  const handleGetRecipe = (mealName) => {
    setRecipeQuery(mealName)
    setTab("ai")
  }

  const handleGetMealPlan = async () => {
    const stored = localStorage.getItem("medical_profile")
    let profile = medicalProfile

    if (!profile && stored) {
      try {
        profile = JSON.parse(stored)
      } catch (e) {
        console.error("Failed to parse saved medical profile", e)
      }
    }

    if (!profile) {
      alert("Please save your medical profile in the Account tab first.")
      setTab("account")
      return
    }

    setMealPlanLoading(true)
    try {
      const res = await axios.post(`${API_URL}/api/mealplan`, profile)
      setMealPlan(res.data)
      setMedicalProfile(profile)
      try {
        const raw = localStorage.getItem("meal_history")
        const arr = raw ? JSON.parse(raw) : []
        arr.unshift({ ...res.data, createdAt: new Date().toISOString() })
        localStorage.setItem("meal_history", JSON.stringify(arr.slice(0, 50)))
      } catch (e) {
        console.error("failed to save history", e)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to fetch meal plan from backend")
    } finally {
      setMealPlanLoading(false)
    }
  }

  const handleLogin = (userData) => {
    setUser(userData)
    setIsLoggedIn(true)
    loadLatestProfile(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem("jwt_token")
    delete axios.defaults.headers.common["Authorization"]
    setUser(null)
    setMedicalProfile(null)
    setIsLoggedIn(false)
    setTab("home")
    setIsUserMenuOpen(false)
  }

  const clearChatMemory = async () => {
    try {
      const chatKey = user?.email ? `user:${user.email}` : null
      if (!chatKey) return
      await axios.post(`${API_URL}/api/chat/clear`, { chatKey })
      alert("Chat history cleared")
    } catch (error) {
      console.error("Failed to clear chat memory", error)
      alert("Failed to clear chat history")
    }
  }

  const clearLocalProfile = () => {
    localStorage.removeItem("medical_profile")
    setMedicalProfile(null)
    alert("Saved profile cleared")
  }

  const loadLatestProfile = async (userData) => {
    try {
      const token = localStorage.getItem("jwt_token")
      if (!token) return

      const res = await axios.get(`${API_URL}/api/auth/profiles`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const profiles = res.data?.profiles || []
      if (profiles.length === 0) return

      const latest = profiles
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0]

      if (latest?.profile) {
        setMedicalProfile(latest.profile)
        localStorage.setItem("medical_profile", JSON.stringify(latest.profile))
      }
    } catch (error) {
      console.error("Failed to load latest profile", error)
    }
  }

  // Show login page if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-100 via-white to-secondary-100 flex items-center justify-center p-4 sm:p-6 mobile-safe-content">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <MaterialIcon name="restaurant" size="56px" filled={true} />
              <h1 className="text-4xl font-bold gradient-text">Diet-Pal</h1>
            </div>
            <p className="text-slate-600 text-lg">Your Personal Nutrition Companion</p>
          </div>
          <div className="animate-slide-up">
            <AuthForm onAuth={handleLogin} />
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    ["home", "home", "Home"],
    ["ai", "smart_toy", "AI Advisor"],
    ["restaurants", "restaurant", "Restaurants"],
    ["history", "history", "History"],
    ["favorites", "favorite", "Favorites"],
    ["account", "account_circle", "Account"],
    ["subscription", "workspace_premium", "Subscription"],
    ["settings", "settings", "Settings"],
    ["fav-rest", "bookmark", "Saved"]
  ]

  const quickTabs = [
    ["home", "home", "Home"],
    ["account", "account_circle", "Account"],
    ["favorites", "favorite", "Favorites"]
  ]

  // Main app after login
  return (
    <div className="app-root min-h-screen bg-transparent">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-primary-50/80 backdrop-blur-md shadow-card border-b border-primary-100 animate-slide-up mobile-safe-top">
        <div className="w-full px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Navigation Menu (three lines) */}
          <div ref={navMenuRef} className="relative">
            <button
              onClick={() => setIsNavOpen((open) => !open)}
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 neu-pill font-semibold text-slate-700 text-xs sm:text-sm hover:border-primary-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all duration-300"
              aria-expanded={isNavOpen}
              aria-label="Open navigation menu"
            >
              <span className="flex flex-col gap-1">
                <span className="block w-6 h-0.5 bg-slate-700"></span>
                <span className="block w-6 h-0.5 bg-slate-700"></span>
                <span className="block w-6 h-0.5 bg-slate-700"></span>
              </span>
              <span>Menu</span>
            </button>

            {isNavOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-slate-100/95 backdrop-blur-sm shadow-lg border border-slate-200 z-50 overflow-hidden">
                <div className="py-2">
                  {tabs.map(([key, icon, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setTab(key)
                        setIsNavOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-semibold transition flex items-center gap-2 ${tab === key ? "text-primary-700 bg-primary-50" : "text-slate-700 hover:bg-slate-100"}`}
                    >
                      <MaterialIcon name={icon} size="20px" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center: Logo/Title */}
          <button
            onClick={() => setTab("home")}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/50 transition"
            aria-label="Go to home"
          >
            <MaterialIcon name="restaurant" size="32px" filled={true} />
            <h1 className="text-xl font-bold gradient-text">Diet-Pal</h1>
          </button>

          {/* Right: User Profile */}
          <div ref={userMenuRef} className="flex items-center gap-2 sm:gap-3 relative">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(open => !open)}
                  className="flex items-center gap-2 sm:gap-3 neu-pill px-2.5 sm:px-4 py-2 hover:border-primary-300 transition"
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md">
                    {user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-slate-900">{user.name || "User"}</p>
                    <p className="text-xs text-slate-600">{user.email}</p>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-100/95 backdrop-blur-sm shadow-lg border border-slate-200 z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        setTab("subscription")
                        setIsUserMenuOpen(false)
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <MaterialIcon name="workspace_premium" size="18px" />
                      Subscription
                    </button>
                    <button
                      onClick={() => {
                        setTab("settings")
                        setIsUserMenuOpen(false)
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <MaterialIcon name="settings" size="18px" />
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setTab("home")
                        setIsUserMenuOpen(false)
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <MaterialIcon name="help" size="18px" />
                      Help
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <MaterialIcon name="logout" size="18px" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 text-xl">
                  
                </div>
                <span className="hidden sm:block text-sm font-semibold text-slate-600">Not logged in</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-3 sm:p-5 lg:p-8 mobile-safe-content">
        <Hero />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in" style={{animationDelay: "0.2s"}}>
            {tab === "home" && (
              <>
                <BiomarkerAlerts user={user} />

                <MedicalBiomarkers user={user} />

                <MedicationTracker user={user} medicalProfile={medicalProfile} />

                <div className="glass rounded-2.5xl p-6 border border-white/20 shadow-lg backdrop-blur-sm bg-white/40">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <MaterialIcon name="lunch_dining" size="28px" />
                        Today's Meal Plan
                      </h3>
                      <p className="text-sm text-slate-600">Uses your saved medical profile from the Account tab.</p>
                    </div>
                    <button
                      onClick={handleGetMealPlan}
                      disabled={mealPlanLoading}
                      className="bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white font-bold py-2.5 px-5 rounded-lg transition disabled:opacity-50 shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      {mealPlanLoading ? (
                        <>
                          <MaterialIcon name="schedule" size="20px" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <MaterialIcon name="auto_awesome" size="20px" />
                          Get Meal Plan
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {mealPlan && <MealPlanDisplay mealPlan={mealPlan} onGetRecipe={handleGetRecipe} />}
                {!mealPlan && (
                  <div className="glass rounded-2.5xl p-6 border border-white/20 shadow-lg backdrop-blur-sm bg-white/40 text-center">
                    <p className="text-lg text-slate-700">👉 Save your medical profile in <strong>Account</strong>, then click <strong>Get Meal Plan</strong> here.</p>
                  </div>
                )}
              </>
            )}

            {tab === "account" && (
              <AccountInfo
                user={user}
                profile={medicalProfile}
                onProfile={(profile) => setMedicalProfile(profile)}
              />
            )}
            {tab === "subscription" && <Subscription />}
            {tab === "settings" && (
              <Settings
                settings={settings}
                onChange={setSettings}
                onClearChatMemory={clearChatMemory}
                onClearLocalProfile={clearLocalProfile}
              />
            )}
            {tab === "history" && <MealHistory />}
            {tab === "favorites" && <FavoriteMeals />}
            {tab === "ai" && (
              <AIChat
                user={user}
                medicalProfile={medicalProfile}
                initialQuery={recipeQuery}
                settings={settings}
              />
            )}
            {tab === "restaurants" && <RestaurantsList settings={settings} />}
            {tab === "fav-rest" && <FavoriteRestaurants />}
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="lg:col-span-1 space-y-6 animate-fade-in" style={{animationDelay: "0.3s"}}>
            {tab === "home" && <MapView settings={settings} />}
            {tab === "ai" && <MapView settings={settings} />}
            {tab === "restaurants" && <MapView settings={settings} />}
            
            {/* Helpful tip box for other tabs */}
            {!["home", "ai", "restaurants"].includes(tab) && (
              <div className="glass rounded-2.5xl p-6 border-l-4 border-primary-500 text-center">
                <p className="text-sm text-slate-600">
                   Use the navigation to explore different features of Diet-Pal.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/20 text-center text-sm text-slate-600 animate-fade-in" style={{animationDelay: "0.4s"}}>
          <p> Your Personal Nutrition Companion for Trinidad & Tobago</p>
          <p className="mt-2 text-xs">Built with  for healthier living</p>
        </footer>
      </div>

      <div className="fixed left-0 right-0 z-40 px-3 sm:px-6 mobile-safe-shortcuts">
        <div className="bg-primary-50/75 backdrop-blur-md border border-primary-100 rounded-2xl p-1.5 shadow-card flex items-center gap-1.5 overflow-x-auto">
          {quickTabs.map(([key, icon, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 min-w-[96px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 ${tab === key ? "bg-primary-100/90 text-primary-700 shadow-sm" : "text-slate-700 hover:bg-primary-50/80"}`}
            >
              <MaterialIcon name={icon} size="18px" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab !== "ai" && (
        <>
          {isChatWidgetOpen && !isChatWidgetMinimized && (
            <div className={`fixed z-50 w-[360px] max-w-[calc(100vw-1.5rem)] sm:max-w-[calc(100vw-2rem)] transition-all duration-200 mobile-safe-floating-above-shortcuts ${isChatWidgetMinimized ? "h-[72px]" : "h-[460px] sm:h-[520px] max-h-[68vh]"}`}>
              <AIChat
                user={user}
                medicalProfile={medicalProfile}
                initialQuery={recipeQuery}
                settings={settings}
                mode="widget"
                minimized={isChatWidgetMinimized}
                unreadCount={chatUnreadCount}
                onAiMessage={handleWidgetAiMessage}
                onToggleMinimize={handleToggleChatWidgetMinimize}
              />
            </div>
          )}

          {(!isChatWidgetOpen || isChatWidgetMinimized) && (
            <button
              onClick={() => {
                setIsChatWidgetOpen(true)
                setIsChatWidgetMinimized(false)
                setChatUnreadCount(0)
              }}
              className="fixed z-50 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 shadow-card border border-primary-300 font-bold flex items-center justify-center ring-2 ring-primary-100 mobile-safe-floating-above-shortcuts"
              aria-label="Open AI chat widget"
            >
              <MaterialIcon name="chat" size="24px" />
              {chatUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                </span>
              )}
            </button>
          )}
        </>
      )}
    </div>
  )
}
