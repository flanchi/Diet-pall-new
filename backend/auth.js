const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')

const USERS_DIR = path.join(__dirname, 'data', 'users')
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret'

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
    const files = fs.readdirSync(USERS_DIR)
    for (const username of files) {
      const userPath = path.join(USERS_DIR, username)
      if (fs.statSync(userPath).isDirectory()) {
        const user = readUser(username)
        if (user && user.email === email) {
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
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })

  if (readUserByEmail(email)) return res.status(400).json({ error: 'email already registered' })

  // Use email as username (or sanitize for folder name)
  const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '')
  
  // Check if username folder already exists
  const userDir = path.join(USERS_DIR, username)
  if (fs.existsSync(userDir)) return res.status(400).json({ error: 'username already exists' })

  const passwordHash = bcrypt.hashSync(password, 10)
  const user = { 
    id: uuidv4(), 
    email, 
    username,
    name: name || '', 
    passwordHash 
  }
  writeUser(user)

  const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: { id: user.id, email: user.email, username: user.username, name: user.name } })
})

router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })

  const user = readUserByEmail(email)
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
