import React, { useState, useRef, useEffect } from "react"
import axios from "axios"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { API_URL } from "../config"
import MaterialIcon from "../utils/MaterialIcon"

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

    // Add user message
    const userMsg = createMessage("user", message)
    const history = buildHistory(messages)
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Get AI response from backend
    const aiResponse = await generateAIResponse(message, history)
    const aiMsg = createMessage("ai", aiResponse)
    setMessages(prev => [...prev, aiMsg])
    if (typeof onAiMessage === "function") {
      onAiMessage({ text: aiResponse, wasMinimized: minimizedRef.current })
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
