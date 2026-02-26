require("dotenv").config()
const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const path = require("path")
const axios = require("axios")
const fs = require("fs")
const { generatePlan } = require("./meal_planner")
const samples = require("./data/tt_samples.json")
const authRouter = require("./auth")

const HF_API_TOKEN = process.env.HF_API_TOKEN || ""
const HF_MODEL = process.env.HF_MODEL || ""
const HF_NUTRITION_MODEL = process.env.HF_NUTRITION_MODEL || ""
const HF_MEDS_MODEL = process.env.HF_MEDS_MODEL || ""
const HF_MODELS = (process.env.HF_MODELS || "")
  .split(",")
  .map(model => model.trim())
  .filter(Boolean)

const AI_PROVIDER = (process.env.AI_PROVIDER || "auto").toLowerCase()
const GITHUB_MODELS_API_KEY = process.env.GITHUB_MODELS_API_KEY || process.env.GITHUB_API_KEY || process.env.GITHUB_MODEL_API_KEY || process.env.GITHUB_TOKEN || ""
const GITHUB_MODELS_API_URL = process.env.GITHUB_MODELS_API_URL || "https://models.inference.ai.azure.com/chat/completions"
const GITHUB_MODEL = process.env.GITHUB_MODEL || "gpt-4o-mini"
const GITHUB_NUTRITION_MODEL = process.env.GITHUB_NUTRITION_MODEL || GITHUB_MODEL
const GITHUB_MEDS_MODEL = process.env.GITHUB_MEDS_MODEL || GITHUB_MODEL
const GITHUB_MODELS = (process.env.GITHUB_MODELS || "")
  .split(",")
  .map(model => model.trim())
  .filter(Boolean)

let cachedRouterModels = null
const chatHistoryDir = path.join(__dirname, "data", "chat_history")
const userContextDir = path.join(__dirname, "data", "user_context")

function ensureChatHistoryDir() {
  if (!fs.existsSync(chatHistoryDir)) {
    fs.mkdirSync(chatHistoryDir, { recursive: true })
  }
}

function ensureUserContextDir() {
  if (!fs.existsSync(userContextDir)) {
    fs.mkdirSync(userContextDir, { recursive: true })
  }
}

function safeChatKey(key) {
  return String(key || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .slice(0, 80)
}

function getChatHistoryPath(chatKey) {
  const safeKey = safeChatKey(chatKey)
  if (!safeKey) return null
  return path.join(chatHistoryDir, `${safeKey}.json`)
}

function getUserContextPath(chatKey) {
  const safeKey = safeChatKey(chatKey)
  if (!safeKey) return null
  return path.join(userContextDir, `${safeKey}.json`)
}

function loadChatHistory(chatKey) {
  const filePath = getChatHistoryPath(chatKey)
  if (!filePath || !fs.existsSync(filePath)) return []
  try {
    const raw = fs.readFileSync(filePath, "utf-8")
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch (error) {
    return []
  }
}

function saveChatHistory(chatKey, history) {
  const filePath = getChatHistoryPath(chatKey)
  if (!filePath) return
  ensureChatHistoryDir()
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2))
}

function appendChatHistory(chatKey, entries) {
  if (!chatKey) return
  const existing = loadChatHistory(chatKey)
  const merged = [...existing]

  for (const entry of entries) {
    const content = String(entry?.content || "").trim()
    if (!content) continue
    const role = entry?.role === "user" ? "user" : "assistant"
    const last = merged[merged.length - 1]
    if (last && last.role === role && last.content === content) {
      continue
    }
    merged.push({ role, content, ts: new Date().toISOString() })
  }

  saveChatHistory(chatKey, merged.slice(-40))
}

function loadUserContext(chatKey) {
  const filePath = getUserContextPath(chatKey)
  if (!filePath || !fs.existsSync(filePath)) return {}
  try {
    const raw = fs.readFileSync(filePath, "utf-8")
    const data = JSON.parse(raw)
    return data && typeof data === "object" ? data : {}
  } catch (error) {
    return {}
  }
}

function saveUserContext(chatKey, context) {
  const filePath = getUserContextPath(chatKey)
  if (!filePath) return
  ensureUserContextDir()
  fs.writeFileSync(filePath, JSON.stringify(context, null, 2))
}

function mergeUserContext(existing, incoming) {
  const merged = { ...existing }

  if (incoming?.userInfo) {
    merged.userInfo = {
      ...merged.userInfo,
      ...incoming.userInfo
    }
  }

  if (!merged.userInfo) {
    merged.userInfo = {}
  }

  if (!merged.userInfo.name && merged.userInfo.email) {
    const emailName = String(merged.userInfo.email).split("@")[0]
    if (emailName) {
      merged.userInfo.name = emailName
    }
  }

  if (incoming?.profile) {
    merged.profile = {
      ...merged.profile,
      ...incoming.profile
    }
  }

  merged.updatedAt = new Date().toISOString()
  return merged
}

function getDisplayName(userInfo) {
  const name = String(userInfo?.name || "").trim()
  if (name) return name
  const email = String(userInfo?.email || "").trim()
  if (!email) return ""
  const raw = email.split("@")[0]
  return raw ? raw.replace(/[._-]+/g, " ").trim() : ""
}

function userAskedForLinks(message) {
  const text = String(message || "").toLowerCase()
  return /(link|links|source|sources|citation|citations|url|urls|reference|references)/.test(text)
}

function shouldUseWebContext(message) {
  const text = String(message || "").toLowerCase()
  return /(latest|current|today|now|news|update|recent|price|cost|open|opening|hours|available|availability|where can i buy|study|research|guideline)/.test(text)
}

function flattenDuckDuckGoTopics(topics = []) {
  const rows = []

  for (const topic of topics) {
    if (topic?.Text) {
      rows.push({
        text: topic.Text,
        url: topic.FirstURL || ""
      })
      continue
    }

    if (Array.isArray(topic?.Topics)) {
      for (const nested of topic.Topics) {
        if (nested?.Text) {
          rows.push({
            text: nested.Text,
            url: nested.FirstURL || ""
          })
        }
      }
    }
  }

  return rows
}

function sanitizeModelReply(text) {
  if (!text) return ""

  let clean = String(text)

  clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
  clean = clean.replace(/^\s*the user is asking[\s\S]*?(\n\n|\n-\s|\n\d+\.\s)/i, "").trim()

  return clean
}

function extractJsonBlock(text) {
  const raw = String(text || "").trim()
  if (!raw) return null

  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const firstBrace = raw.indexOf("{")
  const lastBrace = raw.lastIndexOf("}")
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1).trim()
  }

  return null
}

function normalizeMealPlan(rawPlan) {
  const slots = ["breakfast", "lunch", "dinner"]
  const rawMeals = Array.isArray(rawPlan?.meals) ? rawPlan.meals : []
  const normalizedMeals = []

  for (let index = 0; index < slots.length; index += 1) {
    const fallbackSlot = slots[index]
    const meal = rawMeals[index] || {}
    const slot = slots.includes(String(meal.slot || "").toLowerCase())
      ? String(meal.slot).toLowerCase()
      : fallbackSlot

    const name = String(meal.name || "").trim()
    const ingredients = Array.isArray(meal.ingredients)
      ? meal.ingredients.map(item => String(item || "").trim()).filter(Boolean).slice(0, 8)
      : []
    const notes = Array.isArray(meal.notes)
      ? meal.notes.map(item => String(item || "").trim()).filter(Boolean).slice(0, 4)
      : []

    normalizedMeals.push({
      slot,
      name: name || `${slot[0].toUpperCase()}${slot.slice(1)} suggestion`,
      ingredients,
      notes
    })
  }

  return {
    meals: normalizedMeals,
    meta: {
      source: String(rawPlan?.meta?.source || "ai-mealplan-v1")
    }
  }
}

async function generateAiMealPlan(profile = {}) {
  const conditions = Array.isArray(profile.conditions) ? profile.conditions : []
  const allergies = Array.isArray(profile.allergies) ? profile.allergies : []
  const dietaryRestriction = String(profile.dietaryRestriction || "omnivore")

  const systemPrompt = `You are Diet-Pal's meal planning assistant for Trinidad & Tobago.
Generate a realistic one-day meal plan that is practical, culturally relevant, and health-aware.

Rules:
- Return ONLY valid JSON (no markdown, no explanation).
- Output exactly this shape:
{
  "meals": [
    {"slot":"breakfast","name":"...","ingredients":["..."],"notes":["..."]},
    {"slot":"lunch","name":"...","ingredients":["..."],"notes":["..."]},
    {"slot":"dinner","name":"...","ingredients":["..."],"notes":["..."]}
  ],
  "meta": {"source":"ai-mealplan-v1"}
}
- Keep each meal name short.
- Keep ingredients arrays between 3 and 8 items.
- Keep notes arrays between 1 and 4 items.
- Respect allergies and medical conditions strictly.
- Prefer foods common in Trinidad & Tobago when suitable.`

  const userPrompt = `Create today's meal plan using this profile data:\n${JSON.stringify(profile, null, 2)}\n\nImportant constraints:\n- Conditions: ${conditions.join(", ") || "none"}\n- Allergies: ${allergies.join(", ") || "none"}\n- Dietary preference: ${dietaryRestriction}`

  const aiResult = await generateChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    {
      hfPreferredModels: HF_NUTRITION_MODEL ? [HF_NUTRITION_MODEL] : [],
      githubPreferredModels: GITHUB_NUTRITION_MODEL ? [GITHUB_NUTRITION_MODEL] : [],
      maxTokens: 900
    }
  )

  const jsonBlock = extractJsonBlock(aiResult.text)
  if (!jsonBlock) {
    throw new Error("AI meal plan did not return JSON")
  }

  const parsed = JSON.parse(jsonBlock)
  const normalized = normalizeMealPlan(parsed)
  normalized.meta = {
    ...(normalized.meta || {}),
    model: aiResult.model,
    provider: AI_PROVIDER
  }
  return normalized
}

function isNameQuestion(message) {
  const text = String(message || "").toLowerCase()
  return /(what\s+is\s+my\s+name|my\s+name\s*\?|tell\s+me\s+my\s+name|do\s+you\s+know\s+my\s+name)/.test(text)
}

function buildLocalFallbackReply({ message, displayName, conditions = [], allergies = [], dietaryRestriction }) {
  const greeting = displayName ? `${displayName}, ` : ""
  const conditionText = Array.isArray(conditions) && conditions.length > 0
    ? `I kept your conditions in mind: ${conditions.join(", ")}.`
    : ""
  const allergyText = Array.isArray(allergies) && allergies.length > 0
    ? `I also avoided allergy triggers you listed: ${allergies.join(", ")}.`
    : ""
  const dietText = dietaryRestriction && dietaryRestriction !== "omnivore"
    ? `Diet preference noted: ${dietaryRestriction}.`
    : ""

  const messageText = String(message || "").toLowerCase()
  const isMealQuestion = /(meal|breakfast|lunch|dinner|snack|recipe|food|eat)/.test(messageText)

  if (isMealQuestion) {
    return `${greeting}here are quick options while AI service reconnects:\n\n- **Breakfast:** callaloo + boiled egg + a small piece of provision\n- **Lunch:** grilled fish, stewed lentils, and salad\n- **Dinner:** baked chicken with steamed vegetables and dasheen\n\n${conditionText} ${allergyText} ${dietText}`.trim()
  }

  return `${greeting}I can still help with practical guidance right now, even though live AI generation is temporarily unavailable. ${conditionText} ${allergyText} ${dietText}\n\nAsk me for a **meal plan**, **food swaps**, or **Trinidad-style healthy meal ideas** and I’ll provide immediate suggestions.`.trim()
}

function resolveAgents(message) {
  const text = String(message || "").toLowerCase()

  const nutritionKeywords = [
    "nutrition", "diet", "food", "meal", "meals", "recipe", "recipes",
    "calorie", "calories", "protein", "carb", "carbs", "fat", "fats",
    "sugar", "fiber", "vegetable", "vegetables", "fruit", "fruits",
    "breakfast", "lunch", "dinner", "snack", "snacks", "cooking",
    "ingredient", "ingredients", "restaurant", "groceries"
  ]

  const medsKeywords = [
    "med", "meds", "medication", "medications", "medicine", "drug", "drugs",
    "dose", "dosage", "side effect", "side effects", "interaction", "interactions",
    "prescription", "refill", "insulin", "metformin", "statin", "bp", "blood pressure"
  ]

  const useNutrition = nutritionKeywords.some(keyword => text.includes(keyword))
  const useMeds = medsKeywords.some(keyword => text.includes(keyword))

  return {
    useNutrition: useNutrition || (!useNutrition && !useMeds),
    useMeds
  }
}

async function fetchWikipediaContext(query) {
  try {
    const searchRes = await axios.get("https://en.wikipedia.org/w/api.php", {
      params: {
        action: "query",
        list: "search",
        srsearch: query,
        format: "json",
        srlimit: 3
      },
      timeout: 12000
    })

    const hits = searchRes.data?.query?.search || []
    if (hits.length === 0) return { text: "", sources: [] }

    const items = []
    for (const hit of hits.slice(0, 3)) {
      const title = hit.title
      const summaryRes = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
        timeout: 12000
      })

      const extract = summaryRes.data?.extract || ""
      const url = summaryRes.data?.content_urls?.desktop?.page || ""
      if (extract) {
        items.push({ text: `${title}: ${extract}`, url })
      }
    }

    const contextText = items
      .map((item, index) => `${index + 1}. ${item.text}`)
      .join("\n")

    return {
      text: contextText,
      sources: items
    }
  } catch (error) {
    return { text: "", sources: [], error: error.message }
  }
}

async function fetchWebContext(query) {
  try {
    const response = await axios.get("https://api.duckduckgo.com/", {
      params: {
        q: query,
        format: "json",
        no_html: 1,
        no_redirect: 1,
        skip_disambig: 1
      },
      timeout: 12000
    })

    const data = response.data || {}
    const items = []

    if (data.Answer) {
      items.push({ text: String(data.Answer), url: data.AnswerURL || "" })
    }

    if (data.AbstractText) {
      items.push({ text: String(data.AbstractText), url: data.AbstractURL || "" })
    }

    const related = flattenDuckDuckGoTopics(data.RelatedTopics || [])
    for (const row of related.slice(0, 5)) {
      items.push(row)
    }

    const cleaned = items
      .map(item => ({
        text: String(item.text || "").trim(),
        url: String(item.url || "").trim()
      }))
      .filter(item => item.text.length > 0)
      .slice(0, 6)

    if (cleaned.length === 0) {
      return await fetchWikipediaContext(query)
    }

    const contextText = cleaned
      .map((item, index) => `${index + 1}. ${item.text}`)
      .join("\n")

    return {
      text: contextText,
      sources: cleaned
    }
  } catch (error) {
    return await fetchWikipediaContext(query)
  }
}

function extractAssistantText(data) {
  const message = data?.choices?.[0]?.message
  const content = message?.content

  if (typeof content === "string" && content.trim()) {
    return content.trim()
  }

  if (Array.isArray(content)) {
    const parts = content
      .map(part => {
        if (typeof part === "string") return part
        if (typeof part?.text === "string") return part.text
        if (typeof part?.content === "string") return part.content
        return ""
      })
      .filter(Boolean)

    if (parts.length > 0) {
      return parts.join("\n").trim()
    }
  }

  return ""
}

async function getRouterModels() {
  if (cachedRouterModels) return cachedRouterModels

  try {
    const response = await axios.get("https://router.huggingface.co/v1/models", {
      headers: {
        Authorization: `Bearer ${HF_API_TOKEN}`
      },
      timeout: 30000
    })

    const data = response.data?.data || []
    const ids = data
      .filter(model => model?.architecture?.output_modalities?.includes("text"))
      .map(model => model.id)
      .filter(Boolean)

    cachedRouterModels = ids
    return ids
  } catch (error) {
    console.warn("Unable to fetch Hugging Face router model list. Falling back to configured models only.")
    cachedRouterModels = []
    return []
  }
}

async function generateChatWithHuggingFace(messages, preferredModels = [], options = {}) {
  if (!HF_API_TOKEN) {
    const error = new Error("Missing Hugging Face API token. Set HF_API_TOKEN in backend/.env")
    error.statusCode = 500
    throw error
  }

  const discoveredModels = await getRouterModels()

  const preferred = Array.isArray(preferredModels)
    ? preferredModels.map(model => String(model || "").trim()).filter(Boolean)
    : []

  const modelsToTry = [
    ...preferred,
    ...(HF_MODELS.length > 0 ? HF_MODELS : []),
    ...(HF_MODEL ? [HF_MODEL] : []),
    ...discoveredModels.slice(0, 20)
  ].filter((model, index, arr) => arr.indexOf(model) === index)

  if (modelsToTry.length === 0) {
    const error = new Error("No Hugging Face router models available for this token")
    error.statusCode = 500
    throw error
  }

  let lastError = null

  for (const model of modelsToTry) {
    const endpoint = process.env.HF_API_URL || "https://router.huggingface.co/v1/chat/completions"

    try {
      const response = await axios.post(
        endpoint,
        {
          model,
          messages,
          temperature: 0.7,
          max_tokens: options.maxTokens || 700
        },
        {
          headers: {
            Authorization: `Bearer ${HF_API_TOKEN}`,
            "Content-Type": "application/json"
          },
          timeout: 45000
        }
      )

      const data = response.data
      const text = extractAssistantText(data)
      const cleanedText = sanitizeModelReply(text)

      if (!cleanedText || !cleanedText.trim()) {
        throw new Error("Hugging Face returned an empty response")
      }

      return {
        text: cleanedText.trim(),
        model
      }
    } catch (error) {
      lastError = error
      const statusCode = error?.response?.status
      const details = error?.response?.data || error.message

      if (statusCode === 401 || statusCode === 403) {
        continue
      }

      if (statusCode === 429) {
        const quotaError = new Error("Hugging Face rate limit reached. Please retry shortly.")
        quotaError.statusCode = 429
        quotaError.details = details
        throw quotaError
      }

      if (statusCode === 402) {
        const billingError = new Error("Hugging Face billing/credits issue (402).")
        billingError.statusCode = 402
        billingError.details = details
        throw billingError
      }

      if (statusCode === 503) {
        const warmupError = new Error("Hugging Face model is loading. Retry in a few seconds.")
        warmupError.statusCode = 503
        warmupError.details = details
        throw warmupError
      }

      if (statusCode === 404 || statusCode === 400) {
        const detailsText = typeof details === "string" ? details : JSON.stringify(details)
        const isModelUnsupported = detailsText.includes("model_not_supported") || detailsText.includes("not supported")
        if (isModelUnsupported || statusCode === 404) {
          continue
        }
        continue
      }

      const message = String(error?.message || "").toLowerCase()
      if (message.includes("empty response")) {
        continue
      }

      throw error
    }
  }

  throw lastError || new Error("No compatible Hugging Face model was available")
}

async function generateChatWithGitHubModels(messages, preferredModels = [], options = {}) {
  if (!GITHUB_MODELS_API_KEY) {
    const error = new Error("Missing GitHub Models API key. Set GITHUB_MODELS_API_KEY in backend/.env")
    error.statusCode = 500
    throw error
  }

  const preferred = Array.isArray(preferredModels)
    ? preferredModels.map(model => String(model || "").trim()).filter(Boolean)
    : []

  const modelsToTry = [
    ...preferred,
    ...GITHUB_MODELS,
    ...(GITHUB_MODEL ? [GITHUB_MODEL] : [])
  ].filter((model, index, arr) => arr.indexOf(model) === index)

  if (modelsToTry.length === 0) {
    const error = new Error("No GitHub models configured. Set GITHUB_MODEL or GITHUB_MODELS.")
    error.statusCode = 500
    throw error
  }

  let lastError = null

  for (const model of modelsToTry) {
    try {
      const response = await axios.post(
        GITHUB_MODELS_API_URL,
        {
          model,
          messages,
          temperature: 0.7,
          max_tokens: options.maxTokens || 700
        },
        {
          headers: {
            Authorization: `Bearer ${GITHUB_MODELS_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 45000
        }
      )

      const data = response.data
      const text = extractAssistantText(data)
      const cleanedText = sanitizeModelReply(text)

      if (!cleanedText || !cleanedText.trim()) {
        throw new Error("GitHub Models returned an empty response")
      }

      return {
        text: cleanedText.trim(),
        model
      }
    } catch (error) {
      lastError = error
      const statusCode = error?.response?.status

      if (statusCode === 401 || statusCode === 403 || statusCode === 404) {
        continue
      }

      if (statusCode === 429) {
        const quotaError = new Error("GitHub Models rate limit reached. Please retry shortly.")
        quotaError.statusCode = 429
        quotaError.details = error?.response?.data || error.message
        throw quotaError
      }

      if (statusCode === 402) {
        const billingError = new Error("GitHub Models billing/credits issue (402).")
        billingError.statusCode = 402
        billingError.details = error?.response?.data || error.message
        throw billingError
      }

      const message = String(error?.message || "").toLowerCase()
      if (message.includes("empty response")) {
        continue
      }

      throw error
    }
  }

  throw lastError || new Error("No compatible GitHub model was available")
}

async function generateChat(messages, options = {}) {
  const {
    hfPreferredModels = [],
    githubPreferredModels = [],
    maxTokens = 700
  } = options

  const provider = AI_PROVIDER

  if (provider === "huggingface" || provider === "hf") {
    return generateChatWithHuggingFace(messages, hfPreferredModels, { maxTokens })
  }

  if (provider === "github") {
    return generateChatWithGitHubModels(messages, githubPreferredModels, { maxTokens })
  }

  // auto fallback: try GitHub first if configured, then Hugging Face
  if (GITHUB_MODELS_API_KEY) {
    try {
      return await generateChatWithGitHubModels(messages, githubPreferredModels, { maxTokens })
    } catch (error) {
      console.warn("GitHub Models failed, falling back to Hugging Face:", error.message)
    }
  }

  return generateChatWithHuggingFace(messages, hfPreferredModels, { maxTokens })
}

const app = express()
app.use(cors({
  origin: true, // Allow all origins (production and dev)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}))
app.use(bodyParser.json())

function haversineDistance(lat1, lon1, lat2, lon2) {
  function toRad(x) { return x * Math.PI / 180 }
  const R = 6371 // km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

app.post("/api/mealplan", async (req, res) => {
  const profile = req.body || {}
  try {
    const plan = await generateAiMealPlan(profile)
    res.json(plan)
  } catch (err) {
    console.error("AI meal plan generation failed, using rules fallback:", err.message)
    try {
      const fallbackPlan = generatePlan(profile)
      res.json({
        ...fallbackPlan,
        meta: {
          ...(fallbackPlan.meta || {}),
          source: "simple-rules-fallback"
        }
      })
    } catch (fallbackError) {
      res.status(500).json({ error: "Failed to generate plan" })
    }
  }
})

// GET /api/nearby?lat=10.66&lng=-61.51&type=restaurants&radius=10
app.get("/api/nearby", (req, res) => {
  const lat = parseFloat(req.query.lat)
  const lng = parseFloat(req.query.lng)
  const radius = parseFloat(req.query.radius || "10") // km
  const type = req.query.type || "restaurants"

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: "lat and lng query params required" })
  }

  const pool = (type === "ingredients") ? samples.ingredients : samples.restaurants
  const nearby = pool
    .map(item => ({
      ...item,
      distance_km: haversineDistance(lat, lng, item.lat, item.lng)
    }))
    .filter(item => item.distance_km <= radius)
    .sort((a,b) => a.distance_km - b.distance_km)

  res.json({ results: nearby })
})

// POST /api/chat - AI-powered response using Hugging Face
app.post("/api/chat", async (req, res) => {
  try {
    const { message, conditions, allergies, dietaryRestriction, history, chatKey, userInfo, profile, settings } = req.body

    if (!message) {
      return res.status(400).json({ error: "message required" })
    }

    const storedContext = chatKey ? loadUserContext(chatKey) : {}
    const mergedContext = mergeUserContext(storedContext, { userInfo, profile })
    if (chatKey && (userInfo || profile)) {
      saveUserContext(chatKey, mergedContext)
    }

    const profileContext = mergedContext.profile || {}
    const accountContext = mergedContext.userInfo || {}

    // Build context for the AI based on user profile
    let contextParts = []
    const displayName = getDisplayName(accountContext)
    if (displayName) {
      contextParts.push(`Name: ${displayName}`)
    }
    if (accountContext.email) {
      contextParts.push(`Email: ${accountContext.email}`)
    }
    if (conditions && conditions.length > 0) {
      contextParts.push(`Medical conditions: ${conditions.join(", ")}`)
    }
    if (allergies && allergies.length > 0) {
      contextParts.push(`Allergies: ${allergies.join(", ")}`)
    }
    if (dietaryRestriction && dietaryRestriction !== "omnivore") {
      contextParts.push(`Dietary preference: ${dietaryRestriction}`)
    }
    if (profileContext.age) {
      contextParts.push(`Age: ${profileContext.age}`)
    }
    if (profileContext.weight) {
      contextParts.push(`Weight: ${profileContext.weight} kg`)
    }
    if (profileContext.height) {
      contextParts.push(`Height: ${profileContext.height} cm`)
    }
    if (profileContext.gender) {
      contextParts.push(`Gender: ${profileContext.gender}`)
    }
    if (Array.isArray(profileContext.medications) && profileContext.medications.length > 0) {
      const medsText = profileContext.medications
        .map(med => `${med.name || "Medication"} ${med.concentration || ""} ${med.dosage || ""} (${med.frequency || ""})`.trim())
        .join("; ")
      contextParts.push(`Current medications: ${medsText}`)
    }
    if (settings?.units?.weight) {
      contextParts.push(`Preferred weight unit: ${settings.units.weight}`)
    }
    if (settings?.units?.height) {
      contextParts.push(`Preferred height unit: ${settings.units.height}`)
    }
    if (settings?.units?.glucose) {
      contextParts.push(`Preferred glucose unit: ${settings.units.glucose}`)
    }

    const fileHistory = chatKey ? loadChatHistory(chatKey) : []
    const normalizedHistory = Array.isArray(history)
      ? history
          .map(item => ({
            role: item?.role === "user" ? "user" : "assistant",
            content: String(item?.content || "").trim()
          }))
          .filter(item => item.content.length > 0)
      : []

    const mergedHistory = [...fileHistory, ...normalizedHistory]
      .filter(item => item?.content)
      .slice(-16)

    const userContext = contextParts.length > 0 ? `\n\nUser Profile:\n${contextParts.join("\n")}` : ""
    const linksRequested = userAskedForLinks(message)

    let webContextText = ""
    let webSources = []

    if (shouldUseWebContext(message)) {
      const webResult = await fetchWebContext(message)
      webContextText = webResult.text || ""
      webSources = webResult.sources || []
    }

    const internetContextBlock = webContextText
      ? `\n\nInternet Context (recent web snippets):\n${webContextText}\n\nUse this context when it helps, but keep your answer natural and practical.`
      : ""

    const includeSources = settings?.ai?.includeSources === true
    const linksRule = (linksRequested || includeSources)
      ? `Include a short "Sources" section with up to 3 relevant URLs.`
      : `Do NOT include links or URLs unless the user explicitly asks for them.`

    const responseLength = settings?.ai?.responseLength || "normal"
    const tone = settings?.ai?.tone || "friendly"
    const lengthInstruction = responseLength === "short"
      ? "Keep it very brief (3-5 sentences)."
      : responseLength === "detailed"
        ? "Provide a fuller answer (8-14 sentences) with bullets where helpful."
        : "Keep it concise but useful (usually 5-10 sentences unless asked for more)."

    // Create a system prompt for Hugging Face model with Trinidad & Tobago context
    const systemPrompt = `You are Diet-Pal's friendly AI Health Advisor for Trinidad & Tobago.
  Speak in a warm, natural, conversational tone (not robotic), like a supportive coach.
  Tone preference: ${tone}.
  Give practical, personalized advice using local foods and realistic options.

  Important style rules:
  - Do NOT explain your chain-of-thought or reasoning process.
  - Do NOT say things like "the user is asking".
  - Answer directly and clearly.
  - Do NOT start with greetings like "Hi" or "Hello".
  - If the user's name is known, address them by name occasionally (not every sentence).
  - Use Markdown with short sections, bullets, and tables when helpful.
  - Avoid a single long paragraph; keep paragraphs to 1-3 sentences.
  - ${lengthInstruction}
  - If the user asks a question, answer it; do not say there was no question.
  - Always answer the latest user question and stay on that topic unless asked to switch.
  - If the user asks for more options, provide 3-6 additional options on the same topic.
  - End with a complete sentence (do not cut off mid-thought).
  - Use chat history and the user profile for continuity; if the user mentions a condition (e.g., diabetes), keep it in mind.
  - If helpful, end with 1 short follow-up question.
  - When suggesting meals, include concrete examples (portion ideas, swaps, simple prep tips).
  - ${linksRule}
  - If no internet context is provided and the question needs real-time facts, briefly say you don't have live web access in this chat.
  - IMPORTANT: When users ask to save/add meals or restaurants to favorites, DO tell them that their request has been processed. The app CAN save meals and restaurants to a favorites list - you don't need to say you can't do this. Simply acknowledge their request positively.

${userContext}
${internetContextBlock}

Guidelines:
- Focus on Trinidad & Tobago foods and cuisine (callaloo, dasheen, provisions, pelau, etc.)
- Consider the user's medical conditions and dietary restrictions
- Suggest local, accessible ingredients and meals
- Be encouraging and supportive
  - Keep responses concise but informative
- Include practical tips when relevant`

    const trimmedMessage = String(message || "").trim()
    const lastHistory = mergedHistory[mergedHistory.length - 1]
    const shouldAppendUser = !lastHistory || lastHistory.role !== "user" || lastHistory.content !== trimmedMessage
    const baseMessages = [
      ...mergedHistory,
      ...(shouldAppendUser ? [{ role: "user", content: trimmedMessage }] : [])
    ]

    const routing = resolveAgents(trimmedMessage)
    const useMultiAgent = settings?.ai?.multiAgent !== false
    const agentReplies = []
    const maxTokensByLength = responseLength === "short" ? 380 : responseLength === "detailed" ? 780 : 600

    if (useMultiAgent && routing.useNutrition) {
      try {
        const nutritionPrompt = `${systemPrompt}\n\nAgent Focus: Nutrition and meal guidance.`
        const nutritionMessages = [
          { role: "system", content: nutritionPrompt },
          ...baseMessages
        ]
        const nutritionResult = await generateChat(nutritionMessages, {
          hfPreferredModels: HF_NUTRITION_MODEL ? [HF_NUTRITION_MODEL] : [],
          githubPreferredModels: GITHUB_NUTRITION_MODEL ? [GITHUB_NUTRITION_MODEL] : [],
          maxTokens: maxTokensByLength
        })
        agentReplies.push({ label: "Nutrition", text: sanitizeModelReply(nutritionResult.text), model: nutritionResult.model })
      } catch (error) {
        console.error("Nutrition agent failed:", error.message)
      }
    }

    if (useMultiAgent && routing.useMeds) {
      try {
        const medsPrompt = `${systemPrompt}\n\nAgent Focus: Medications and medical safety. Avoid dosing instructions; suggest discussing with a clinician when needed.`
        const medsMessages = [
          { role: "system", content: medsPrompt },
          ...baseMessages
        ]
        const medsResult = await generateChat(medsMessages, {
          hfPreferredModels: HF_MEDS_MODEL ? [HF_MEDS_MODEL] : [],
          githubPreferredModels: GITHUB_MEDS_MODEL ? [GITHUB_MEDS_MODEL] : [],
          maxTokens: maxTokensByLength
        })
        agentReplies.push({ label: "Medical", text: sanitizeModelReply(medsResult.text), model: medsResult.model })
      } catch (error) {
        console.error("Medical agent failed:", error.message)
      }
    }

    if (!useMultiAgent) {
      const singleMessages = [
        { role: "system", content: systemPrompt },
        ...baseMessages
      ]
      const singleResult = await generateChat(singleMessages, {
        hfPreferredModels: [],
        githubPreferredModels: GITHUB_MODEL ? [GITHUB_MODEL] : [],
        maxTokens: maxTokensByLength
      })
      agentReplies.push({ label: "Advisor", text: sanitizeModelReply(singleResult.text), model: singleResult.model })
    }

    if (agentReplies.length === 0) {
      try {
        const fallbackMessages = [
          { role: "system", content: systemPrompt },
          ...baseMessages
        ]
        const fallbackResult = await generateChat(fallbackMessages, {
          hfPreferredModels: [],
          githubPreferredModels: GITHUB_MODEL ? [GITHUB_MODEL] : [],
          maxTokens: maxTokensByLength
        })
        agentReplies.push({ label: "Advisor", text: sanitizeModelReply(fallbackResult.text), model: fallbackResult.model })
      } catch (fallbackError) {
        const localReply = buildLocalFallbackReply({
          message: trimmedMessage,
          displayName,
          conditions,
          allergies,
          dietaryRestriction
        })
        agentReplies.push({ label: "Advisor", text: localReply, model: "local-fallback" })
      }
    }

    const aiMessage = agentReplies.length === 1
      ? agentReplies[0].text
      : agentReplies.map(reply => `### ${reply.label}\n${reply.text}`).join("\n\n")

    if (chatKey) {
      appendChatHistory(chatKey, [
        { role: "user", content: trimmedMessage },
        { role: "assistant", content: aiMessage }
      ])
    }

    res.json({
      reply: aiMessage,
      model: agentReplies.map(reply => reply.model).join(", "),
      usedWebContext: webContextText.length > 0,
      sourcesAvailable: webSources.length
    })
  } catch (error) {
    console.error("Chat Error:", error.message)

    const statusCode = error?.statusCode || error?.response?.status || 500
    const details = error?.details || error?.response?.data || error?.message || "Unknown error"

    if (statusCode === 429) {
      return res.status(429).json({
        error: "AI service rate limit reached. Please wait and try again.",
        details
      })
    }

    if (statusCode === 401) {
      return res.status(401).json({
        error: "AI provider authentication failed. Check HF_API_TOKEN.",
        details
      })
    }

    if (statusCode === 402) {
      return res.status(402).json({
        error: "AI provider billing/credits issue (HF 402).",
        details
      })
    }

    if (statusCode === 503) {
      return res.status(503).json({
        error: "AI model is warming up. Please retry in a few seconds.",
        details
      })
    }

    res.status(500).json({
      error: "Failed to generate response",
      details
    })
  }
})

app.post("/api/chat/clear", (req, res) => {
  try {
    const { chatKey } = req.body || {}
    if (!chatKey) {
      return res.status(400).json({ error: "chatKey required" })
    }

    const historyPath = getChatHistoryPath(chatKey)
    const contextPath = getUserContextPath(chatKey)

    if (historyPath && fs.existsSync(historyPath)) {
      fs.unlinkSync(historyPath)
    }
    if (contextPath && fs.existsSync(contextPath)) {
      fs.unlinkSync(contextPath)
    }

    return res.json({ cleared: true })
  } catch (error) {
    return res.status(500).json({ error: "Failed to clear chat memory" })
  }
})

// Note: Favorites are stored in frontend localStorage
// The AI chat component handles adding items to favorites directly
// These endpoints are placeholder for potential future backend persistence

app.use("/api/auth", authRouter)

const PORT = process.env.PORT || 4000
const HOST = process.env.HOST || '0.0.0.0' // Listen on all interfaces
app.listen(PORT, HOST, () => console.log(`Backend listening on ${HOST}:${PORT}`))
