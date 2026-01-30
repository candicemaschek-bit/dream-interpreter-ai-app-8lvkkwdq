/**
 * Moderation System Database Migration
 * Creates tables for community reporting, moderation actions, and audit trail
 * 
 * Run this migration to initialize the moderation system
 */

-- 1. Community Reports Table
-- Stores user reports of inappropriate content with anonymized reporter IDs
CREATE TABLE IF NOT EXISTS community_reports (
  id TEXT PRIMARY KEY,
  dream_id TEXT NOT NULL,
  reporter_id_hash TEXT NOT NULL,      -- SHA-256 hash of reporter's user ID (anonymized)
  report_reason TEXT NOT NULL,         -- 'explicit', 'harassment', 'spam', 'illegal', 'misinformation', 'other'
  report_details TEXT,                 -- Optional user-provided details
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'reviewed', 'dismissed', 'actioned'
  severity_auto INTEGER DEFAULT 0,     -- Auto-assessed severity: 0-3 based on content flags
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT,                    -- Admin user ID who reviewed
  FOREIGN KEY (dream_id) REFERENCES community_dreams(id),
  CHECK (report_reason IN ('explicit', 'harassment', 'spam', 'illegal', 'misinformation', 'other')),
  CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  CHECK (severity_auto BETWEEN 0 AND 3)
);

-- Create index for faster report lookups
CREATE INDEX IF NOT EXISTS idx_community_reports_dream_id ON community_reports(dream_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status);
CREATE INDEX IF NOT EXISTS idx_community_reports_created_at ON community_reports(created_at);

-- 2. Moderation Actions Table
-- Audit trail of all moderation decisions taken by admins
CREATE TABLE IF NOT EXISTS moderation_actions (
  id TEXT PRIMARY KEY,
  dream_id TEXT NOT NULL,
  action_type TEXT NOT NULL,           -- 'hide', 'remove', 'warn_author', 'dismiss_report'
  action_reason TEXT NOT NULL,         -- Human-readable reason for action
  moderator_id TEXT NOT NULL,          -- Admin user ID who took action
  report_ids TEXT NOT NULL,            -- JSON array of report IDs that triggered this action
  author_notified INTEGER DEFAULT 0,   -- 0 = false, 1 = true
  created_at TEXT NOT NULL,
  FOREIGN KEY (dream_id) REFERENCES community_dreams(id),
  CHECK (action_type IN ('hide', 'remove', 'warn_author', 'dismiss_report')),
  CHECK (author_notified IN (0, 1))
);

-- Create index for audit trail lookups
CREATE INDEX IF NOT EXISTS idx_moderation_actions_dream_id ON moderation_actions(dream_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator_id ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created_at ON moderation_actions(created_at);

-- 3. Update community_dreams table to add moderation fields
-- (Run these ALTER TABLE statements if the columns don't already exist)

ALTER TABLE community_dreams ADD COLUMN status TEXT DEFAULT 'active';
-- Possible values: 'active', 'hidden', 'removed', 'under_review'

ALTER TABLE community_dreams ADD COLUMN report_count INTEGER DEFAULT 0;

-- Create index for status lookups (for filtering)
CREATE INDEX IF NOT EXISTS idx_community_dreams_status ON community_dreams(status);
CREATE INDEX IF NOT EXISTS idx_community_dreams_report_count ON community_dreams(report_count);

/**
 * Summary of Changes:
 * 
 * NEW TABLES:
 * - community_reports: Stores user-submitted reports with anonymized reporter IDs
 * - moderation_actions: Audit trail of all admin moderation decisions
 * 
 * UPDATED TABLES:
 * - community_dreams: Added 'status' and 'report_count' fields
 * 
 * ANONYMITY PROTECTION:
 * - Reporter user IDs are stored as SHA-256 hashes (irreversible)
 * - No way to reverse the hash and discover reporter identity
 * - Admin panel shows hash only, never the real user ID
 * 
 * AUDIT TRAIL:
 * - Every moderation action is logged with timestamp and reason
 * - Moderation decisions are tied to which reports triggered them
 * - Can be exported for compliance audits
 */
