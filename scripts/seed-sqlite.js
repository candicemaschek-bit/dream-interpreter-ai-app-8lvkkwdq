#!/usr/bin/env node

/**
 * Local SQLite Seed Script
 * 
 * Seeds a local SQLite database file with test users for tier testing.
 * Uses better-sqlite3 for Node.js-based SQLite operations.
 * 
 * Usage:
 *   npm run seed:sqlite
 *   npm run seed:sqlite -- --db-path=./custom-test.db
 * 
 * Requirements:
 *   npm install better-sqlite3 --save-dev
 */

import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Get directory paths
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Parse command line arguments
const args = process.argv.slice(2)
const dbPathArg = args.find(arg => arg.startsWith('--db-path='))
const dbPath = dbPathArg 
  ? dbPathArg.split('=')[1] 
  : join(rootDir, 'test-users.db')

console.log('🗄️  Local SQLite Seed Script')
console.log('=' .repeat(60))
console.log(`📁 Database Path: ${dbPath}`)
console.log('=' .repeat(60))

try {
  // Create/open SQLite database
  const db = new Database(dbPath)
  
  console.log('✅ Database connection established')
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON')
  
  // Create tables (SQLite schema)
  console.log('\n📦 Creating database schema...')
  
  const schema = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER DEFAULT 0,
      password_hash TEXT,
      display_name TEXT,
      avatar_url TEXT,
      phone TEXT,
      phone_verified INTEGER DEFAULT 0,
      role TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_sign_in TEXT NOT NULL
    );
    
    -- User profiles table
    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      nightmare_prone INTEGER DEFAULT 0,
      recurring_dreams INTEGER DEFAULT 0,
      onboarding_completed INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      subscription_tier TEXT DEFAULT 'free',
      dreams_analyzed_this_month INTEGER DEFAULT 0,
      last_reset_date TEXT,
      dreams_analyzed_lifetime INTEGER DEFAULT 0,
      referral_bonus_dreams INTEGER DEFAULT 0,
      device_fingerprint TEXT,
      signup_ip TEXT,
      normalized_email TEXT,
      account_status TEXT DEFAULT 'active',
      nightmare_details TEXT,
      recurring_dream_details TEXT,
      tts_generations_this_month INTEGER DEFAULT 0,
      tts_cost_this_month_usd REAL DEFAULT 0.0,
      tts_last_reset_date TEXT,
      date_of_birth TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    -- Subscriptions table
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tier TEXT NOT NULL,
      billing_cycle TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      auto_renew INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    -- Gamification profiles table
    CREATE TABLE IF NOT EXISTS gamification_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      dream_coins INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      total_xp INTEGER DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      last_activity_date TEXT,
      badges TEXT,
      referral_code TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    -- Dreams table
    CREATE TABLE IF NOT EXISTS dreams (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      input_type TEXT NOT NULL,
      image_url TEXT,
      symbols_data TEXT,
      interpretation TEXT,
      video_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      tags TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `
  
  // Execute schema creation
  db.exec(schema)
  console.log('✅ Schema created successfully')
  
  // Clear existing test data
  console.log('\n🧹 Clearing existing test data...')
  db.exec(`
    DELETE FROM gamification_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@dreamcatcher.local');
    DELETE FROM subscriptions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@dreamcatcher.local');
    DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@dreamcatcher.local');
    DELETE FROM dreams WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@dreamcatcher.local');
    DELETE FROM users WHERE email LIKE '%@dreamcatcher.local';
  `)
  console.log('✅ Old test data cleared')
  
  // Load and execute seed SQL
  console.log('\n🌱 Loading seed data...')
  const seedSqlPath = join(rootDir, 'seed-data.sql')
  const seedSql = readFileSync(seedSqlPath, 'utf-8')
  
  // Split into individual statements and execute
  // Remove comments but keep INSERT statements
  const cleanedSql = seedSql
    .split('\n')
    .filter(line => {
      const trimmed = line.trim()
      return trimmed.length > 0 && !trimmed.startsWith('--')
    })
    .join('\n')
  
  const statements = cleanedSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s !== 'PRAGMA foreign_keys = ON')
  
  console.log(`📝 Executing ${statements.length} SQL statements...`)
  
  let successCount = 0
  let errorCount = 0
  
  statements.forEach((statement, index) => {
    try {
      if (statement.trim().length > 0) {
        db.exec(statement)
        successCount++
      }
    } catch (error) {
      errorCount++
      console.error(`❌ Error in statement ${index + 1}:`, error.message)
    }
  })
  
  console.log(`✅ Successfully executed ${successCount} statements`)
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} statements failed`)
  }
  
  // Verify seeded data
  console.log('\n📊 Verifying seeded data...')
  
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE email LIKE ?').get('%@dreamcatcher.local').count
  const profileCount = db.prepare('SELECT COUNT(*) as count FROM user_profiles').get().count
  const subscriptionCount = db.prepare('SELECT COUNT(*) as count FROM subscriptions').get().count
  const gamificationCount = db.prepare('SELECT COUNT(*) as count FROM gamification_profiles').get().count
  
  console.log(`   👥 Test Users: ${userCount}`)
  console.log(`   📋 Profiles: ${profileCount}`)
  console.log(`   💳 Subscriptions: ${subscriptionCount}`)
  console.log(`   🎮 Gamification Profiles: ${gamificationCount}`)
  
  // List all test users with their tiers
  console.log('\n📝 Test User Summary:')
  console.log('=' .repeat(60))
  
  const users = db.prepare(`
    SELECT 
      u.email,
      u.display_name,
      u.email_verified,
      u.role,
      p.subscription_tier
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE u.email LIKE '%@dreamcatcher.local'
    ORDER BY p.subscription_tier DESC, u.email
  `).all()
  
  users.forEach(user => {
    const tierEmoji = {
      'vip': '💎',
      'premium': '⭐',
      'pro': '🚀',
      'free': '🆓'
    }[user.subscription_tier] || '❓'
    
    const verified = user.email_verified ? '✅' : '❌'
    const roleLabel = user.role === 'admin' ? ' [ADMIN]' : ''
    
    console.log(`${tierEmoji} ${user.subscription_tier.toUpperCase().padEnd(8)} ${verified} ${user.email}${roleLabel}`)
  })
  
  console.log('\n' + '=' .repeat(60))
  console.log('✅ Database seeding completed successfully!')
  console.log('=' .repeat(60))
  console.log('\n📚 Test Credentials:')
  console.log('   Email: test.free@dreamcatcher.local')
  console.log('   Password: TestPassword123!')
  console.log('')
  console.log('   Email: test.pro@dreamcatcher.local')
  console.log('   Password: TestPassword123!')
  console.log('')
  console.log('   Email: test.premium@dreamcatcher.local')
  console.log('   Password: TestPassword123!')
  console.log('')
  console.log('   Email: test.vip@dreamcatcher.local')
  console.log('   Password: TestPassword123!')
  console.log('')
  console.log('   Email: admin.test@dreamcatcher.local')
  console.log('   Password: AdminPassword123!')
  console.log('\n💡 Tip: Connect to this database in your app by setting:')
  console.log(`   DATABASE_URL=file:${dbPath}`)
  
  // Close database
  db.close()
  
} catch (error) {
  console.error('\n❌ Fatal error:', error.message)
  console.error(error.stack)
  process.exit(1)
}
