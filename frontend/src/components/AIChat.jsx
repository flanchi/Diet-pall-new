import React, { useState, useRef, useEffect } from "react"
import axios from "axios"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { API_URL } from "../config"
import MaterialIcon from "../utils/MaterialIcon"

// Helper functions to add items to favorites (called by AI)
function addMealToFavorites(meal) {
  try {
    const raw = localStorage.getItem("favorite_meals")
    const meals = raw ? JSON.parse(raw) : []
    
    // Check for duplicates
    const exists = meals.some(m => m.name === meal.name)
    if (exists) {
      return { success: false, message: "Meal already in favorites" }
    }

    meals.push({
      name: meal.name,
      ingredients: meal.ingredients || [],
      notes: meal.notes || [],
      addedAt: new Date().toISOString()
    })

    localStorage.setItem("favorite_meals", JSON.stringify(meals))
    return { success: true, message: `Added "${meal.name}" to favorite meals` }
  } catch (error) {
    console.error("Error adding meal to favorites:", error)
    return { success: false, message: "Failed to add meal to favorites" }
  }
}

function addRestaurantToFavorites(restaurant) {
  try {
    const raw = localStorage.getItem("favorite_restaurants")
    const restaurants = raw ? JSON.parse(raw) : []
    
    // Check for duplicates
    const exists = restaurants.some(r => r.name === restaurant.name)
    if (exists) {
      return { success: false, message: "Restaurant already in favorites" }
    }

    restaurants.push({
      name: restaurant.name,
      tags: restaurant.tags || [],
      distance_km: restaurant.distance_km || null,
      addedAt: new Date().toISOString()
    })

    localStorage.setItem("favorite_restaurants", JSON.stringify(restaurants))
    return { success: true, message: `Added "${restaurant.name}" to favorite restaurants` }
  } catch (error) {
    console.error("Error adding restaurant to favorites:", error)
    return { success: false, message: "Failed to add restaurant to favorites" }
  }
}

function addIngredientsToShoppingList(ingredients) {
  try {
    if (!ingredients || !Array.isArray(ingredients)) {
      return { success: false, message: "Invalid ingredients format" }
    }

    const raw = localStorage.getItem("shopping_list")
    const shoppingList = raw ? JSON.parse(raw) : []
    
    let addedCount = 0
    for (const ing of ingredients) {
      const ingName = typeof ing === "string" ? ing : (ing.name || ing)
      if (!ingName) continue
      
      // Check for duplicates (case-insensitive)
      const exists = shoppingList.some(item => 
        item.name.toLowerCase() === ingName.toLowerCase()
      )
      if (!exists) {
        shoppingList.push({
          name: ingName,
          checked: false,
          addedAt: new Date().toISOString()
        })
        addedCount++
      }
    }

    localStorage.setItem("shopping_list", JSON.stringify(shoppingList))
    return { success: true, message: `Added ${addedCount} ingredient(s) to shopping list` }
  } catch (error) {
    console.error("Error adding ingredients to shopping list:", error)
    return { success: false, message: "Failed to add ingredients to shopping list" }
  }
}

export default function AIChat({ user, medicalProfile, initialQuery, settings, mode = "full", minimized = false, unreadCount = 0, onToggleMinimize, onAiMessage }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: " Hello! I'm your AI Health Advisor. I can help you with nutrition tips, meal recommendations, and dietary advice based on your health profile. What would you like to know?"
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const nextMessageId = useRef(2)
  const chatKeyRef = useRef("")
  const minimizedRef = useRef(minimized)

  useEffect(() => {
    minimizedRef.current = minimized
  }, [minimized])

  useEffect(() => {
    if (chatKeyRef.current) return

    if (user?.email) {
      chatKeyRef.current = `user:${user.email}`
      return
    }

    let guestId = localStorage.getItem("guest_chat_id")
    if (!guestId) {
      if (window.crypto?.randomUUID) {
        guestId = window.crypto.randomUUID()
      } else {
        guestId = `guest_${Date.now()}_${Math.floor(Math.random() * 100000)}`
      }
      localStorage.setItem("guest_chat_id", guestId)
    }
    chatKeyRef.current = `guest:${guestId}`
  }, [user])

  const createMessage = (sender, text) => ({
    id: nextMessageId.current++,
    sender,
    text
  })

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-submit initial recipe query
  useEffect(() => {
    if (initialQuery && !loading) {
      setInput(initialQuery)
      handleSendWithMessage(initialQuery)
    }
  }, [initialQuery])

  function buildHistory(existingMessages) {
    const history = (existingMessages || [])
      .filter(msg => msg?.text)
      .map(msg => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text
      }))

    return history.slice(-12)
  }

  function loadLocalProfile() {
    try {
      const raw = localStorage.getItem("medical_profile")
      return raw ? JSON.parse(raw) : null
    } catch (error) {
      return null
    }
  }

  // Parse user message to detect requests for adding items to favorites
  function detectAddToFavorites(message) {
    const text = message.toLowerCase().trim()
    
    // Check for adding meal to favorites
    const mealPatterns = [
      /add.*(meal|breakfast|lunch|dinner|snack|recipe).*(to\s+)?favorites?/i,
      /(save|bookmark).*(meal|breakfast|lunch|dinner|snack|recipe)/i,
      /(meal|breakfast|lunch|dinner|snack|recipe).*(to\s+)?favorites?/i
    ]
    
    // Check for adding restaurant to favorites
    const restaurantPatterns = [
      /add.*(restaurant|cafe|food\s*place|eatery).*(to\s+)?favorites?/i,
      /(save|bookmark).*(restaurant|cafe|food\s*place|eatery)/i,
      /(restaurant|cafe|food\s*place|eatery).*(to\s+)?favorites?/i
    ]
    
    // Check for adding ingredients to shopping list
    const ingredientPatterns = [
      /add.*(ingredient|items?).*(to\s+)?(shopping\s*list|grocery)/i,
      /(put|add).*(shopping\s*list|grocery)/i,
      /(ingredient|items?).*(to\s+)?(shopping\s*list|grocery)/i
    ]

    // Check for meal patterns
    for (const pattern of mealPatterns) {
      if (pattern.test(text)) return "add_meal"
    }

    // Check for restaurant patterns
    for (const pattern of restaurantPatterns) {
      if (pattern.test(text)) return "add_restaurant"
    }

    // Check for ingredient patterns
    for (const pattern of ingredientPatterns) {
      if (pattern.test(text)) return "add_ingredients"
    }

    return null
  }

  // Extract meal info from message context
  function extractMealFromContext(msgs) {
    for (let i = msgs.length - 1; i >= 0; i--) {
      const msg = msgs[i]
      if (msg.sender === "ai" && msg.text) {
        const mealMatch = msg.text.match(/[-*]?\s*\*\*(?:Breakfast|Lunch|Dinner|Snack):?\s*\*\*?\s*([^\n*]+)/i)
        if (mealMatch) {
          return { name: mealMatch[1].trim() }
        }
      }
    }
    return null
  }

  // Extract restaurant info from message context
  function extractRestaurantFromContext(msgs) {
    for (let i = msgs.length - 1; i >= 0; i--) {
      const msg = msgs[i]
      if (msg.sender === "ai" && msg.text) {
        const restMatch = msg.text.match(/(?:restaurant|cafe|eatery)[:\s]+([^\n]+)/i)
        if (restMatch) {
          return { name: restMatch[1].trim(), tags: [] }
        }
      }
    }
    return null
  }

  // Call backend /api/chat endpoint
  async function generateAIResponse(userMessage, history) {
    try {
      const profile = medicalProfile || loadLocalProfile()
      const userInfo = user
        ? { name: user.name || "", email: user.email || "" }
        : null

      const response = await axios.post(`${API_URL}/api/chat`, {
        message: userMessage,
        chatKey: chatKeyRef.current,
        history,
        userInfo,
        profile,
        settings,
        conditions: profile?.conditions || [],
        allergies: profile?.allergies || [],
        dietaryRestriction: profile?.dietaryRestriction || "omnivore"
      })

      return response.data?.reply || "Sorry, I couldn't process that request."
    } catch (error) {
      console.error("Chat API Error:", error)
      const apiMessage = error?.response?.data?.error
      if (apiMessage) return apiMessage
      return "Sorry, I encountered an error. Make sure the backend is running."
    }
  }

async function handleSendWithMessage(message) {
    if (!message.trim()) return

    // Check if user wants to add something to favorites
    const addRequest = detectAddToFavorites(message)
    let actionResult = null

    // Add user message
    const userMsg = createMessage("user", message)
    const history = buildHistory(messages)
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Get AI response from backend
    const aiResponse = await generateAIResponse(message, history)
    
    // If user requested to add something to favorites, process it
    if (addRequest === "add_meal") {
      const meal = extractMealFromContext([...messages, userMsg])
      if (meal) {
        actionResult = addMealToFavorites(meal)
      } else {
        actionResult = { success: false, message: "Could not find a meal to add. Please specify which meal you'd like to add." }
      }
    } else if (addRequest === "add_restaurant") {
      const restaurant = extractRestaurantFromContext([...messages, userMsg])
      if (restaurant) {
        actionResult = addRestaurantToFavorites(restaurant)
      } else {
        actionResult = { success: false, message: "Could not find a restaurant to add." }
      }
    } else if (addRequest === "add_ingredients") {
      // Try to extract ingredients from the message
      const ingredientMatch = message.match(/(?:ingredients?|items?|for)\s*:?\s*([^\n?]+)/i)
      if (ingredientMatch) {
        const ingredients = ingredientMatch[1].split(/[,;]/).map(i => i.trim()).filter(i => i.length > 0)
        if (ingredients.length > 0) {
          actionResult = addIngredientsToShoppingList(ingredients)
        }
      }
      if (!actionResult) {
        actionResult = { success: false, message: "Could not extract ingredients. Please specify which ingredients to add." }
      }
    }

    // Append action result to AI response if applicable
    let finalResponse = aiResponse
    if (actionResult) {
      const actionMessage = actionResult.success 
        ? `✅ ${actionResult.message}`
        : `⚠️ ${actionResult.message}`
      finalResponse = `${aiResponse}\n\n${actionMessage}`
    }

    const aiMsg = createMessage("ai", finalResponse)
    setMessages(prev => [...prev, aiMsg])
    if (typeof onAiMessage === "function") {
      onAiMessage({ text: finalResponse, wasMinimized: minimizedRef.current })
    }
    setLoading(false)
  }

  async function handleSend() {
    if (!input.trim()) return
    handleSendWithMessage(input)
    setInput("")
  }

  const isWidget = mode === "widget"
  const showCompactWidget = isWidget && minimized

  if (showCompactWidget) {
    return (
      <button
        onClick={onToggleMinimize}
        className={`h-full w-full text-left px-4 py-3 shadow-lg transition border-2 rounded-2xl hover:-translate-y-0.5 ${unreadCount > 0 ? "bg-gradient-to-r from-primary-50 via-white to-secondary-50 border-primary-300 hover:border-primary-400" : "bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200 hover:border-primary-300"}`}
        aria-label="Restore AI chat widget"
      >
        <div className="flex items-center justify-between gap-3 h-full">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-sm">
              <MaterialIcon name="smart_toy" size="18px" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">AI Health Advisor</p>
              <p className={`text-xs truncate ${unreadCount > 0 ? "text-primary-700" : "text-slate-700"}`}>
                {unreadCount > 0 ? `You have ${unreadCount} new response${unreadCount > 1 ? "s" : ""}` : "Chat minimized • Click anywhere to restore"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className={`bg-white border border-primary-100 shadow-xl flex flex-col overflow-hidden ${isWidget ? "h-full rounded-2xl" : "h-[75vh] min-h-[600px] rounded-lg"}`}>
      <div className={`bg-gradient-to-r from-primary-600 to-secondary-600 text-white flex items-center justify-between ${isWidget ? "px-4 py-3" : "px-6 py-4"}`}>
        <div className="flex items-center gap-2">
          <MaterialIcon name="smart_toy" size={isWidget ? "22px" : "26px"} />
          <h3 className={`${isWidget ? "text-lg" : "text-2xl"} font-bold`}> AI Health Advisor</h3>
        </div>
        {isWidget && (
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleMinimize}
              className="text-white/90 hover:text-white p-1"
              aria-label="Minimize AI chat widget"
            >
              −
            </button>
          </div>
        )}
      </div>

      <div className={`${isWidget ? "p-4" : "p-6"} flex flex-col flex-1 min-h-0`}>

      {/* Status bar */}
      {!showCompactWidget && (
        <div className={`p-3 bg-blue-50 rounded-lg text-sm ${isWidget ? "mb-3" : "mb-4"}`}>
        {user ? (
          <>
            <strong>Logged in as:</strong> {user.email}
            {medicalProfile?.conditions?.length > 0 && (
              <div className="text-xs text-gray-700 mt-1">
                <strong>Conditions:</strong> {medicalProfile.conditions.join(", ")}
              </div>
            )}
            {medicalProfile?.allergies?.length > 0 && (
              <div className="text-xs text-gray-700">
                <strong>Allergies:</strong> {medicalProfile.allergies.join(", ")}
              </div>
            )}
          </>
        ) : (
          <span className="text-gray-600">Login to personalize advice</span>
        )}
        </div>
      )}

      {/* Chat messages */}
      {!showCompactWidget && (
        <div className={`flex-1 overflow-y-auto bg-gray-50 rounded p-4 space-y-3 min-h-0 ${isWidget ? "mb-3" : "mb-4"}`}>
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2 rounded-lg ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-none shadow-sm"
                  : "bg-white border border-gray-200 rounded-bl-none"
              } break-words`}
            >
              {msg.sender === "ai" ? (
                <div className="chat-markdown overflow-x-auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg rounded-bl-none px-4 py-2">
              <span className="text-sm text-gray-600">AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      {!showCompactWidget && (
        <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === "Enter" && handleSend()}
          placeholder="Ask about nutrition, meals, allergies, recipes..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 shadow-sm flex items-center gap-2"
        >
          <MaterialIcon name="send" size="18px" />
          Send
        </button>
        </div>
      )}

      {/* Tips */}
      {!isWidget && (
        <div className="mt-3 text-xs text-gray-600">
          <strong> Try asking:</strong> "What should I eat?", "I have diabetes", "Recipe ideas", "Nearby restaurants"
        </div>
      )}
      </div>
    </div>
  )
}
