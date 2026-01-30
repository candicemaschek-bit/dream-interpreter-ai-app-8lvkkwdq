#!/usr/bin/env node

/**
 * Test User Seed Script
 * 
 * Generates SQL INSERT statements for test users with various subscription tiers.
 * 
 * Usage:
 *   npm run seed:users              # Print to console
 *   npm run seed:users:sql          # Save to seed-data.sql file
 *   node scripts/seed-test-users.js > seed-data.sql  # Manual file output
 */

import crypto from 'crypto'

function generateId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function getCurrentTimestamp() {
  return new Date().toISOString()
}

function getSubscriptionEndDate() {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString()
}

const testUsers = [
  {
    id: generateId('user'),
    email: 'test.free@dreamcatcher.local',
    displayName: 'Free User Test',
    password: 'TestPassword123!',
    subscriptionTier: 'free',
    profile: {
      name: 'Free User Test',
      age: 28,
      gender: 'female',
      nightmareProne: 0,
      recurringDreams: 1,
    },
    verified: true,
  },
  {
    id: generateId('user'),
    email: 'test.pro@dreamcatcher.local',
    displayName: 'Pro User Test',
    password: 'TestPassword123!',
    subscriptionTier: 'pro',
    profile: {
      name: 'Pro User Test',
      age: 35,
      gender: 'male',
      nightmareProne: 1,
      recurringDreams: 0,
    },
    verified: true,
  },
  {
    id: generateId('user'),
    email: 'test.premium@dreamcatcher.local',
    displayName: 'Premium User Test',
    password: 'TestPassword123!',
    subscriptionTier: 'premium',
    profile: {
      name: 'Premium User Test',
      age: 42,
      gender: 'both',
      nightmareProne: 1,
      recurringDreams: 1,
    },
    verified: true,
  },
  {
    id: generateId('user'),
    email: 'test.vip@dreamcatcher.local',
    displayName: 'VIP User Test',
    password: 'TestPassword123!',
    subscriptionTier: 'vip',
    profile: {
      name: 'VIP User Test',
      age: 50,
      gender: 'none',
      nightmareProne: 0,
      recurringDreams: 0,
    },
    verified: true,
  },
  {
    id: generateId('user'),
    email: 'test.unverified@dreamcatcher.local',
    displayName: 'Unverified User Test',
    password: 'TestPassword123!',
    subscriptionTier: 'free',
    profile: {
      name: 'Unverified User Test',
      age: 31,
      gender: 'female',
      nightmareProne: 0,
      recurringDreams: 0,
    },
    verified: false,
  },
  {
    id: generateId('user'),
    email: 'admin.test@dreamcatcher.local',
    displayName: 'Admin Test User',
    password: 'AdminPassword123!',
    subscriptionTier: 'vip',
    profile: {
      name: 'Admin Test User',
      age: 45,
      gender: 'male',
      nightmareProne: 0,
      recurringDreams: 0,
    },
    verified: true,
    isAdmin: true,
  },
]

function escapeSqlString(str) {
  return str.replace(/'/g, "''")
}

function generateSqlInserts() {
  const timestamp = getCurrentTimestamp()
  const subscriptionEndDate = getSubscriptionEndDate()
  let sql = ''

  // Header
  sql += '-- ============================================================================\n'
  sql += '-- DREAM INTERPRETER AI - TEST USER SEED DATA\n'
  sql += '-- ============================================================================\n'
  sql += `-- Generated: ${timestamp}\n`
  sql += '-- Note: All test user emails end with .dreamcatcher.local\n'
  sql += '-- ============================================================================\n\n'

  // Enable foreign keys
  sql += 'PRAGMA foreign_keys = ON;\n\n'

  // Insert users
  sql += '-- ============================================================================\n'
  sql += '-- INSERT TEST USERS\n'
  sql += '-- ============================================================================\n\n'

  testUsers.forEach((user) => {
    sql += `-- User: ${user.displayName} (${user.email})\n`
    sql += `-- Subscription: ${user.subscriptionTier.toUpperCase()}\n`
    sql += `-- Verified: ${user.verified ? 'true' : 'false'}\n`
    sql += `-- Password: ${user.password}\n`
    sql += 'INSERT INTO users (id, email, email_verified, password_hash, display_name, role, created_at, updated_at, last_sign_in)\n'
    sql += 'VALUES (\n'
    sql += `  '${user.id}',\n`
    sql += `  '${escapeSqlString(user.email)}',\n`
    sql += `  ${user.verified ? 1 : 0},\n`
    sql += `  '${hashPassword(user.password)}',\n`
    sql += `  '${escapeSqlString(user.displayName)}',\n`
    sql += `  '${user.isAdmin ? 'admin' : 'user'}',\n`
    sql += `  '${timestamp}',\n`
    sql += `  '${timestamp}',\n`
    sql += `  '${timestamp}'\n`
    sql += ');\n\n'
  })

  // Insert user profiles
  sql += '-- ============================================================================\n'
  sql += '-- INSERT USER PROFILES\n'
  sql += '-- ============================================================================\n\n'

  testUsers.forEach((user) => {
    const profileId = generateId('profile')
    sql += `-- Profile for: ${user.displayName}\n`
    sql += 'INSERT INTO user_profiles (\n'
    sql += '  id, user_id, name, age, gender, nightmare_prone, recurring_dreams,\n'
    sql += '  onboarding_completed, subscription_tier, created_at, updated_at,\n'
    sql += '  dreams_analyzed_lifetime, account_status\n'
    sql += ')\n'
    sql += 'VALUES (\n'
    sql += `  '${profileId}',\n`
    sql += `  '${user.id}',\n`
    sql += `  '${escapeSqlString(user.profile.name)}',\n`
    sql += `  ${user.profile.age},\n`
    sql += `  '${user.profile.gender}',\n`
    sql += `  ${user.profile.nightmareProne},\n`
    sql += `  ${user.profile.recurringDreams},\n`
    sql += `  1,\n`
    sql += `  '${user.subscriptionTier}',\n`
    sql += `  '${timestamp}',\n`
    sql += `  '${timestamp}',\n`
    sql += `  0,\n`
    sql += `  'active'\n`
    sql += ');\n\n'
  })

  // Insert subscriptions for paid tiers only
  sql += '-- ============================================================================\n'
  sql += '-- INSERT SUBSCRIPTIONS (PAID TIERS ONLY)\n'
  sql += '-- ============================================================================\n\n'

  testUsers.forEach((user) => {
    if (user.subscriptionTier !== 'free') {
      const subscriptionId = generateId('sub')
      sql += `-- Subscription for: ${user.displayName} (${user.subscriptionTier})\n`
      sql += 'INSERT INTO subscriptions (\n'
      sql += '  id, user_id, tier, billing_cycle, start_date, end_date,\n'
      sql += '  auto_renew, is_active, created_at, updated_at\n'
      sql += ')\n'
      sql += 'VALUES (\n'
      sql += `  '${subscriptionId}',\n`
      sql += `  '${user.id}',\n`
      sql += `  '${user.subscriptionTier}',\n`
      sql += `  'monthly',\n`
      sql += `  '${timestamp}',\n`
      sql += `  '${subscriptionEndDate}',\n`
      sql += `  1,\n`
      sql += `  1,\n`
      sql += `  '${timestamp}',\n`
      sql += `  '${timestamp}'\n`
      sql += ');\n\n'
    }
  })

  // Insert gamification profiles
  sql += '-- ============================================================================\n'
  sql += '-- INSERT GAMIFICATION PROFILES\n'
  sql += '-- ============================================================================\n\n'

  testUsers.forEach((user) => {
    const gamificationId = generateId('gamification')
    const referralCode = `REF${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    sql += `-- Gamification for: ${user.displayName}\n`
    sql += 'INSERT INTO gamification_profiles (\n'
    sql += '  id, user_id, dream_coins, level, total_xp, current_streak,\n'
    sql += '  best_streak, badges, referral_code, created_at, updated_at\n'
    sql += ')\n'
    sql += 'VALUES (\n'
    sql += `  '${gamificationId}',\n`
    sql += `  '${user.id}',\n`
    sql += `  100,\n`
    sql += `  1,\n`
    sql += `  0,\n`
    sql += `  0,\n`
    sql += `  0,\n`
    sql += `  '[]',\n`
    sql += `  '${referralCode}',\n`
    sql += `  '${timestamp}',\n`
    sql += `  '${timestamp}'\n`
    sql += ');\n\n'
  })

  // Footer
  sql += '-- ============================================================================\n'
  sql += '-- SEED DATA COMPLETE\n'
  sql += '-- ============================================================================\n'
  sql += `-- Total Users: ${testUsers.length}\n`
  sql += `-- Paid Subscriptions: ${testUsers.filter((u) => u.subscriptionTier !== 'free').length}\n`
  sql += '-- Test Credentials:\n'
  testUsers.forEach((user) => {
    sql += `--   ${user.email} / ${user.password}\n`
  })
  sql += '\n'

  return sql
}

// Main execution
const sql = generateSqlInserts()
console.log(sql)
