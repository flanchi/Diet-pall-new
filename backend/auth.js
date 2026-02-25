const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')

const USERS_DIR = path.join(__dirname, 'data', 'users')
const RESET_TOKENS_FILE = path.join(__dirname, 'data', 'reset_tokens.json')
const nodemailer = require('nodemailer')
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret'

function normalizeEmail(email) {
  if (!email) return '';
  return String(email).trim().toLowerCase();
  function loadResetTokens() {
    if (fs.existsSync(RESET_TOKENS_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(RESET_TOKENS_FILE, 'utf8'))
      } catch (e) { return {} }
    }
    return {}
  }

  function saveResetTokens(tokens) {
    fs.writeFileSync(RESET_TOKENS_FILE, JSON.stringify(tokens, null, 2))
  }

  function generateResetToken() {
    return uuidv4().replace(/-/g, '')
  }

  function sendResetEmail(email, token) {
    // Configure nodemailer transport (update with your SMTP details)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`
    const mailOptions = {
      from: process.env.SMTP_FROM || 'no-reply@dietpall.com',
      to: email,
      subject: 'DietPall Password Reset',
      text: `Reset your password: ${resetUrl}`,
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`
    }
    return transporter.sendMail(mailOptions)
  }
  return String(email || '').trim().toLowerCase()
}

function makeInternalUsername() {
  return `user_${uuidv4().replace(/-/g, '')}`
}

// Ensure users directory exists
if (!fs.existsSync(USERS_DIR)) {
  fs.mkdirSync(USERS_DIR, { recursive: true })
}

// Create user folder structure
function ensureUserFolders(username) {
  const userDir = path.join(USERS_DIR, username)
  const profilesDir = path.join(userDir, 'profiles')
  
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true })
  }
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true })
  }
  
  return { userDir, profilesDir }
}

// Parse user info file
function parseUserFile(content) {
  const lines = content.split('\n')
  const user = {}
  
  for (const line of lines) {
    if (line.startsWith('ID: ')) user.id = line.substring(4).trim()
    else if (line.startsWith('Email: ')) user.email = line.substring(7).trim()
    else if (line.startsWith('Username: ')) user.username = line.substring(10).trim()
    else if (line.startsWith('Name: ')) user.name = line.substring(6).trim()
    else if (line.startsWith('PasswordHash: ')) user.passwordHash = line.substring(14).trim()
    else if (line.startsWith('CreatedAt: ')) user.createdAt = line.substring(11).trim()
  }
  
  return user
}

// Format user info file
function formatUserFile(user) {
  return `ID: ${user.id}
Email: ${user.email}
Username: ${user.username}
Name: ${user.name}
PasswordHash: ${user.passwordHash}
CreatedAt: ${user.createdAt || new Date().toISOString()}`
}

// Read emergency contact
function readEmergencyContact(username) {
  try {
    const { userDir } = ensureUserFolders(username)
    const emergencyFile = path.join(userDir, 'emergency-contact.json')
    if (fs.existsSync(emergencyFile)) {
      return JSON.parse(fs.readFileSync(emergencyFile, 'utf8'))
    }
    return {}
  } catch (e) { 
    return {} 
  }
}

// Write emergency contact
function writeEmergencyContact(username, emergencyContact) {
  const { userDir } = ensureUserFolders(username)
  const emergencyFile = path.join(userDir, 'emergency-contact.json')
  fs.writeFileSync(emergencyFile, JSON.stringify(emergencyContact, null, 2))
}

// Read all profiles for a user
function readUserProfiles(username) {
  try {
    const { profilesDir } = ensureUserFolders(username)
    const files = fs.readdirSync(profilesDir)
    const profiles = []
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const profileFile = path.join(profilesDir, file)
        const data = JSON.parse(fs.readFileSync(profileFile, 'utf8'))
        profiles.push(data)
      }
    }
    
    return profiles
  } catch (e) { 
    return [] 
  }
}

// Save a single profile
function saveUserProfile(username, profileData) {
  const { profilesDir } = ensureUserFolders(username)
  const profileId = uuidv4()
  const profileFile = path.join(profilesDir, `${profileId}.json`)
  const profileObj = {
    id: profileId,
    createdAt: new Date().toISOString(),
    profile: profileData
  }
  fs.writeFileSync(profileFile, JSON.stringify(profileObj, null, 2))
  return profileObj
}

// Read user by username
function readUser(username) {
  try {
    const { userDir } = ensureUserFolders(username)
    const userFile = path.join(userDir, 'user.txt')
    if (fs.existsSync(userFile)) {
      const raw = fs.readFileSync(userFile, 'utf8')
      return parseUserFile(raw)
    }
    return null
  } catch (e) { 
    return null 
  }
}

// Read user by email
function readUserByEmail(email) {
  try {
    const normalizedEmail = normalizeEmail(email)
    if (!normalizedEmail) return null

    const files = fs.readdirSync(USERS_DIR)
    for (const username of files) {
      const userPath = path.join(USERS_DIR, username)
      if (fs.statSync(userPath).isDirectory()) {
        const user = readUser(username)
        if (user && normalizeEmail(user.email) === normalizedEmail) {
          return user
        }
      }
    }
    return null
  } catch (e) { 
    return null 
  }
}

// Write user info
function writeUser(user) {
  const { userDir } = ensureUserFolders(user.username)
  const userFile = path.join(userDir, 'user.txt')
  fs.writeFileSync(userFile, formatUserFile(user))
}

router.post('/register', (req, res) => {
  const { email, password, name } = req.body || {}
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail || !password) return res.status(400).json({ error: 'email and password required' })

  if (readUserByEmail(normalizedEmail)) return res.status(400).json({ error: 'email already registered' })

  // Internal storage key is unique and independent from display name/email prefix
  let username = makeInternalUsername()
  while (fs.existsSync(path.join(USERS_DIR, username))) {
    username = makeInternalUsername()
  }

  const passwordHash = bcrypt.hashSync(password, 10)
  const user = { 
    id: uuidv4(), 
    email: normalizedEmail,
    username,
    name: String(name || '').trim(), 
    passwordHash 
  }
  writeUser(user)

  const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: { id: user.id, email: user.email, username: user.username, name: user.name } })
})

router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail || !password) return res.status(400).json({ error: 'email and password required' })

  const user = readUserByEmail(normalizedEmail)
  if (!user) return res.status(400).json({ error: 'invalid credentials' })

  const ok = bcrypt.compareSync(password, user.passwordHash)
  if (!ok) return res.status(400).json({ error: 'invalid credentials' })

  const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: { id: user.id, email: user.email, username: user.username, name: user.name } })
})

function verifyToken(req, res, next) {
  const header = req.headers.authorization || ''
  const parts = header.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'missing token' })
  const token = parts[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' })
  }
}

// Protected profile save/get endpoints
router.get('/profiles', verifyToken, (req, res) => {
  const user = readUserByEmail(req.user.email)
  if (!user) return res.status(404).json({ error: 'user not found' })
  
  const profiles = readUserProfiles(user.username)
  res.json({ profiles })
})

router.post('/profiles', verifyToken, (req, res) => {
  const profile = req.body
  const user = readUserByEmail(req.user.email)
  if (!user) return res.status(404).json({ error: 'user not found' })
  
  const savedProfile = saveUserProfile(user.username, profile)
  const profiles = readUserProfiles(user.username)
  res.json({ profiles })
})

// Emergency Contact endpoints
router.get('/emergency-contact', verifyToken, (req, res) => {
  const user = readUserByEmail(req.user.email)
  if (!user) return res.status(404).json({ error: 'user not found' })
  
  const emergencyContact = readEmergencyContact(user.username)
  res.json({ emergencyContact })
})

router.post('/emergency-contact', verifyToken, (req, res) => {
  const emergencyContact = req.body
  const user = readUserByEmail(req.user.email)
  if (!user) return res.status(404).json({ error: 'user not found' })
  
  // Validate required fields
  if (!emergencyContact.name || !emergencyContact.relationship || !emergencyContact.phone) {
    return res.status(400).json({ error: 'name, relationship, and phone are required' })
  }
  
  writeEmergencyContact(user.username, emergencyContact)
  res.json({ emergencyContact })
})

module.exports = router
// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {}
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) return res.status(400).json({ error: 'email required' })
  const user = readUserByEmail(normalizedEmail)
  if (!user) return res.status(400).json({ error: 'user not found' })
  const tokens = loadResetTokens()
  // Remove old tokens for this user
  for (const t in tokens) {
    if (tokens[t].email === normalizedEmail) delete tokens[t]
  }
  const token = generateResetToken()
  tokens[token] = {
    email: normalizedEmail,
    createdAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 // 1 hour
  }
  saveResetTokens(tokens)
  try {
    await sendResetEmail(normalizedEmail, token)
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to send email' })
  }
})

// Reset password endpoint
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body || {}
  if (!token || !password) return res.status(400).json({ error: 'token and password required' })
  const tokens = loadResetTokens()
  const entry = tokens[token]
  if (!entry) return res.status(400).json({ error: 'invalid or expired token' })
  if (Date.now() > entry.expiresAt) {
    delete tokens[token]
    saveResetTokens(tokens)
    return res.status(400).json({ error: 'token expired' })
  }
  const user = readUserByEmail(entry.email)
  if (!user) return res.status(400).json({ error: 'user not found' })
  user.passwordHash = bcrypt.hashSync(password, 10)
  writeUser(user)
  delete tokens[token]
  saveResetTokens(tokens)
  res.json({ success: true })
})
