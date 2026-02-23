const fs = require('fs')
const path = require('path')

const USERS_FILE = path.join(__dirname, 'data', 'users.json')
const USERS_DIR = path.join(__dirname, 'data', 'users')

// Ensure users directory exists
if (!fs.existsSync(USERS_DIR)) {
  fs.mkdirSync(USERS_DIR, { recursive: true })
}

try {
  // Read old users.json
  const raw = fs.readFileSync(USERS_FILE, 'utf8')
  const users = JSON.parse(raw || '[]')

  // Create individual user files
  let migratedCount = 0
  for (const user of users) {
    const userFile = path.join(USERS_DIR, `${user.id}.json`)
    fs.writeFileSync(userFile, JSON.stringify(user, null, 2))
    migratedCount++
  }

  console.log(`✓ Migration complete! Migrated ${migratedCount} users to individual files.`)
} catch (e) {
  console.error('Migration error:', e.message)
}
