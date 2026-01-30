-- ============================================================================
-- DREAM INTERPRETER AI - TEST USER SEED DATA
-- ============================================================================
-- Generated: 2025-11-28T01:55:23.629Z
-- Note: All test user emails end with .dreamcatcher.local
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- INSERT TEST USERS
-- ============================================================================

-- User: Free User Test (test.free@dreamcatcher.local)
-- Subscription: FREE
-- Verified: true
-- Password: TestPassword123!
INSERT INTO users (id, email, email_verified, password_hash, display_name, role, created_at, updated_at, last_sign_in)
VALUES (
  'user_2aa7a8e66ce97bcd',
  'test.free@dreamcatcher.local',
  1,
  'ffc121a2210958bf74e5a874668f3d978d24b6a8241496ccff3c0ea245e4f126',
  'Free User Test',
  'user',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z'
);

-- User: Pro User Test (test.pro@dreamcatcher.local)
-- Subscription: PRO
-- Verified: true
-- Password: TestPassword123!
INSERT INTO users (id, email, email_verified, password_hash, display_name, role, created_at, updated_at, last_sign_in)
VALUES (
  'user_20f683cbe475b68a',
  'test.pro@dreamcatcher.local',
  1,
  'ffc121a2210958bf74e5a874668f3d978d24b6a8241496ccff3c0ea245e4f126',
  'Pro User Test',
  'user',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z'
);

-- User: Premium User Test (test.premium@dreamcatcher.local)
-- Subscription: PREMIUM
-- Verified: true
-- Password: TestPassword123!
INSERT INTO users (id, email, email_verified, password_hash, display_name, role, created_at, updated_at, last_sign_in)
VALUES (
  'user_7e78e77ca1c10876',
  'test.premium@dreamcatcher.local',
  1,
  'ffc121a2210958bf74e5a874668f3d978d24b6a8241496ccff3c0ea245e4f126',
  'Premium User Test',
  'user',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z'
);

-- User: VIP User Test (test.vip@dreamcatcher.local)
-- Subscription: VIP
-- Verified: true
-- Password: TestPassword123!
INSERT INTO users (id, email, email_verified, password_hash, display_name, role, created_at, updated_at, last_sign_in)
VALUES (
  'user_858f622f34d05d76',
  'test.vip@dreamcatcher.local',
  1,
  'ffc121a2210958bf74e5a874668f3d978d24b6a8241496ccff3c0ea245e4f126',
  'VIP User Test',
  'user',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z'
);

-- User: Unverified User Test (test.unverified@dreamcatcher.local)
-- Subscription: FREE
-- Verified: false
-- Password: TestPassword123!
INSERT INTO users (id, email, email_verified, password_hash, display_name, role, created_at, updated_at, last_sign_in)
VALUES (
  'user_d5cb8fa2d842ae02',
  'test.unverified@dreamcatcher.local',
  0,
  'ffc121a2210958bf74e5a874668f3d978d24b6a8241496ccff3c0ea245e4f126',
  'Unverified User Test',
  'user',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z'
);

-- User: Admin Test User (admin.test@dreamcatcher.local)
-- Subscription: VIP
-- Verified: true
-- Password: AdminPassword123!
INSERT INTO users (id, email, email_verified, password_hash, display_name, role, created_at, updated_at, last_sign_in)
VALUES (
  'user_effa1d6a4f546c11',
  'admin.test@dreamcatcher.local',
  1,
  '83fcd3f7129b081faeb043dc07262e63fea599da4be6869a7a1780f7084a15b4',
  'Admin Test User',
  'admin',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z'
);

-- ============================================================================
-- INSERT USER PROFILES
-- ============================================================================

-- Profile for: Free User Test
INSERT INTO user_profiles (
  id, user_id, name, age, gender, nightmare_prone, recurring_dreams,
  onboarding_completed, subscription_tier, created_at, updated_at,
  dreams_analyzed_lifetime, account_status
)
VALUES (
  'profile_f14512b34a8f31b6',
  'user_2aa7a8e66ce97bcd',
  'Free User Test',
  28,
  'female',
  0,
  1,
  1,
  'free',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z',
  0,
  'active'
);

-- Profile for: Pro User Test
INSERT INTO user_profiles (
  id, user_id, name, age, gender, nightmare_prone, recurring_dreams,
  onboarding_completed, subscription_tier, created_at, updated_at,
  dreams_analyzed_lifetime, account_status
)
VALUES (
  'profile_a5e676aca4b4e89e',
  'user_20f683cbe475b68a',
  'Pro User Test',
  35,
  'male',
  1,
  0,
  1,
  'pro',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z',
  0,
  'active'
);

-- Profile for: Premium User Test
INSERT INTO user_profiles (
  id, user_id, name, age, gender, nightmare_prone, recurring_dreams,
  onboarding_completed, subscription_tier, created_at, updated_at,
  dreams_analyzed_lifetime, account_status
)
VALUES (
  'profile_6f6bf384f8598bf8',
  'user_7e78e77ca1c10876',
  'Premium User Test',
  42,
  'both',
  1,
  1,
  1,
  'premium',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z',
  0,
  'active'
);

-- Profile for: VIP User Test
INSERT INTO user_profiles (
  id, user_id, name, age, gender, nightmare_prone, recurring_dreams,
  onboarding_completed, subscription_tier, created_at, updated_at,
  dreams_analyzed_lifetime, account_status
)
VALUES (
  'profile_39f359124f2443a0',
  'user_858f622f34d05d76',
  'VIP User Test',
  50,
  'none',
  0,
  0,
  1,
  'vip',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z',
  0,
  'active'
);

-- Profile for: Unverified User Test
INSERT INTO user_profiles (
  id, user_id, name, age, gender, nightmare_prone, recurring_dreams,
  onboarding_completed, subscription_tier, created_at, updated_at,
  dreams_analyzed_lifetime, account_status
)
VALUES (
  'profile_e0744264f917db9a',
  'user_d5cb8fa2d842ae02',
  'Unverified User Test',
  31,
  'female',
  0,
  0,
  1,
  'free',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z',
  0,
  'active'
);

-- Profile for: Admin Test User
INSERT INTO user_profiles (
  id, user_id, name, age, gender, nightmare_prone, recurring_dreams,
  onboarding_completed, subscription_tier, created_at, updated_at,
  dreams_analyzed_lifetime, account_status
)
VALUES (
  'profile_45b294199fe460cd',
  'user_effa1d6a4f546c11',
  'Admin Test User',
  45,
  'male',
  0,
  0,
  1,
  'vip',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z',
  0,
  'active'
);

-- ============================================================================
-- INSERT SUBSCRIPTIONS (PAID TIERS ONLY)
-- ============================================================================

-- Subscription for: Pro User Test (pro)
INSERT INTO subscriptions (
  id, user_id, tier, billing_cycle, start_date, end_date,
  auto_renew, is_active, created_at, updated_at
)
VALUES (
  'sub_715862d03539c429',
  'user_20f683cbe475b68a',
  'pro',
  'monthly',
  '2025-11-28T01:55:23.629Z',
  '2025-12-28T01:55:23.630Z',
  1,
  1,
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z'
);

-- Subscription for: Premium User Test (premium)
INSERT INTO subscriptions (
  id, user_id, tier, billing_cycle, start_date, end_date,
  auto_renew, is_active, created_at, updated_at
)
VALUES (
  'sub_4e53df45b30a1afa',
  'user_7e78e77ca1c10876',
  'premium',
  'monthly',
  '2025-11-28T01:55:23.629Z',
  '2025-12-28T01:55:23.630Z',
  1,
  1,
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z'
);

-- Subscription for: VIP User Test (vip)
INSERT INTO subscriptions (
  id, user_id, tier, billing_cycle, start_date, end_date,
  auto_renew, is_active, created_at, updated_at
)
VALUES (
  'sub_1ae2541f70005600',
  'user_858f622f34d05d76',
  'vip',
  'monthly',
  '2025-11-28T01:55:23.629Z',
  '2025-12-28T01:55:23.630Z',
  1,
  1,
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z'
);

-- Subscription for: Admin Test User (vip)
INSERT INTO subscriptions (
  id, user_id, tier, billing_cycle, start_date, end_date,
  auto_renew, is_active, created_at, updated_at
)
VALUES (
  'sub_6b9ba5b5df49b628',
  'user_effa1d6a4f546c11',
  'vip',
  'monthly',
  '2025-11-28T01:55:23.629Z',
  '2025-12-28T01:55:23.630Z',
  1,
  1,
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z'
);

-- ============================================================================
-- INSERT GAMIFICATION PROFILES
-- ============================================================================

-- Gamification for: Free User Test
INSERT INTO gamification_profiles (
  id, user_id, dream_coins, level, total_xp, current_streak,
  best_streak, badges, referral_code, created_at, updated_at
)
VALUES (
  'gamification_b4a6c163b2e5feb7',
  'user_2aa7a8e66ce97bcd',
  100,
  1,
  0,
  0,
  0,
  '[]',
  'REF105BE17A',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z'
);

-- Gamification for: Pro User Test
INSERT INTO gamification_profiles (
  id, user_id, dream_coins, level, total_xp, current_streak,
  best_streak, badges, referral_code, created_at, updated_at
)
VALUES (
  'gamification_b36196a7cd9aa6c4',
  'user_20f683cbe475b68a',
  100,
  1,
  0,
  0,
  0,
  '[]',
  'REF59C3FB27',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z'
);

-- Gamification for: Premium User Test
INSERT INTO gamification_profiles (
  id, user_id, dream_coins, level, total_xp, current_streak,
  best_streak, badges, referral_code, created_at, updated_at
)
VALUES (
  'gamification_bcfb533f1ce72209',
  'user_7e78e77ca1c10876',
  100,
  1,
  0,
  0,
  0,
  '[]',
  'REF748E657C',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z'
);

-- Gamification for: VIP User Test
INSERT INTO gamification_profiles (
  id, user_id, dream_coins, level, total_xp, current_streak,
  best_streak, badges, referral_code, created_at, updated_at
)
VALUES (
  'gamification_1cc0bd08c759180a',
  'user_858f622f34d05d76',
  100,
  1,
  0,
  0,
  0,
  '[]',
  'REF40B22666',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z'
);

-- Gamification for: Unverified User Test
INSERT INTO gamification_profiles (
  id, user_id, dream_coins, level, total_xp, current_streak,
  best_streak, badges, referral_code, created_at, updated_at
)
VALUES (
  'gamification_ae9e424f1d603ecf',
  'user_d5cb8fa2d842ae02',
  100,
  1,
  0,
  0,
  0,
  '[]',
  'REF73B564CD',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z'
);

-- Gamification for: Admin Test User
INSERT INTO gamification_profiles (
  id, user_id, dream_coins, level, total_xp, current_streak,
  best_streak, badges, referral_code, created_at, updated_at
)
VALUES (
  'gamification_e535e68fed78b420',
  'user_effa1d6a4f546c11',
  100,
  1,
  0,
  0,
  0,
  '[]',
  'REF7E585E94',
  '2025-11-28T01:55:23.629Z',
  '2025-11-28T01:55:23.629Z'
);

-- ============================================================================
-- SEED DATA COMPLETE
-- ============================================================================
-- Total Users: 6
-- Paid Subscriptions: 4
-- Test Credentials:
--   test.free@dreamcatcher.local / TestPassword123!
--   test.pro@dreamcatcher.local / TestPassword123!
--   test.premium@dreamcatcher.local / TestPassword123!
--   test.vip@dreamcatcher.local / TestPassword123!
--   test.unverified@dreamcatcher.local / TestPassword123!
--   admin.test@dreamcatcher.local / AdminPassword123!


