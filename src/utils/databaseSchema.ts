/**
 * Database Schema Definitions
 * All table creation SQL statements for automatic migration
 */

export const DATABASE_SCHEMA = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
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
    )
  `,

  user_profiles: `
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
      account_status TEXT DEFAULT 'active'
    )
  `,

  dreams: `
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
      tags TEXT
    )
  `,

  dream_themes: `
    CREATE TABLE IF NOT EXISTS dream_themes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      theme TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      last_occurred TEXT NOT NULL
    )
  `,

  dream_worlds: `
    CREATE TABLE IF NOT EXISTS dream_worlds (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      dream_ids TEXT NOT NULL,
      video_url TEXT,
      thumbnail_url TEXT,
      duration_seconds INTEGER,
      generated_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  api_usage_logs: `
    CREATE TABLE IF NOT EXISTS api_usage_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      operation_type TEXT NOT NULL,
      model_used TEXT,
      tokens_used INTEGER DEFAULT 0,
      estimated_cost_usd REAL DEFAULT 0.0,
      input_size INTEGER,
      output_size INTEGER,
      success INTEGER DEFAULT 1,
      error_message TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL
    )
  `,

  monthly_usage_summary: `
    CREATE TABLE IF NOT EXISTS monthly_usage_summary (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      year_month TEXT NOT NULL,
      total_operations INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      total_cost_usd REAL DEFAULT 0.0,
      image_generations INTEGER DEFAULT 0,
      ai_interpretations INTEGER DEFAULT 0,
      video_generations INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL
    )
  `,

  referrals: `
    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      referrer_user_id TEXT NOT NULL,
      referral_code TEXT NOT NULL,
      referred_user_id TEXT,
      referred_email TEXT,
      signup_completed INTEGER DEFAULT 0,
      bonus_granted INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      completed_at TEXT
    )
  `,

  email_verification_tokens: `
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      lookup_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `,

  magic_link_tokens: `
    CREATE TABLE IF NOT EXISTS magic_link_tokens (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      lookup_hash TEXT NOT NULL,
      redirect_url TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `,

  password_reset_tokens: `
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      lookup_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `,

  reflect_ai_credits: `
    CREATE TABLE IF NOT EXISTS reflect_ai_credits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subscription_tier TEXT NOT NULL,
      credits_total INTEGER NOT NULL,
      credits_used INTEGER DEFAULT 0,
      credits_remaining INTEGER NOT NULL,
      reset_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  reflection_sessions: `
    CREATE TABLE IF NOT EXISTS reflection_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      dream_id TEXT,
      session_type TEXT NOT NULL,
      credits_consumed INTEGER DEFAULT 0,
      message_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  reflection_messages: `
    CREATE TABLE IF NOT EXISTS reflection_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      token_count INTEGER DEFAULT 0,
      emotional_tags TEXT,
      referenced_dreams TEXT,
      created_at TEXT NOT NULL
    )
  `,

  dream_symbols_v2: `
    CREATE TABLE IF NOT EXISTS dream_symbols_v2 (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      archetype_category TEXT,
      jungian_meaning TEXT,
      personal_meaning TEXT,
      occurrence_count INTEGER DEFAULT 1,
      contexts TEXT,
      emotional_valence REAL,
      first_seen TEXT NOT NULL,
      last_seen TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  dream_entities: `
    CREATE TABLE IF NOT EXISTS dream_entities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_name TEXT NOT NULL,
      normalized_name TEXT,
      archetype TEXT,
      occurrence_count INTEGER DEFAULT 1,
      first_seen TEXT NOT NULL,
      last_seen TEXT NOT NULL,
      dream_ids TEXT,
      emotional_context TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  dream_emotions: `
    CREATE TABLE IF NOT EXISTS dream_emotions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      dream_id TEXT NOT NULL,
      emotion TEXT NOT NULL,
      intensity REAL DEFAULT 0.5,
      valence REAL DEFAULT 0,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `,

  dream_motifs: `
    CREATE TABLE IF NOT EXISTS dream_motifs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      motif_type TEXT NOT NULL,
      occurrence_count INTEGER DEFAULT 1,
      intensity_avg REAL DEFAULT 0,
      resolution_pattern TEXT,
      dream_ids TEXT,
      first_seen TEXT NOT NULL,
      last_seen TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  pattern_insights: `
    CREATE TABLE IF NOT EXISTS pattern_insights (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      insight_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      confidence REAL DEFAULT 0,
      supporting_dreams TEXT,
      generated_at TEXT NOT NULL,
      expires_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  user_privacy_settings: `
    CREATE TABLE IF NOT EXISTS user_privacy_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      pattern_tracking_consent INTEGER DEFAULT 0,
      pattern_tracking_consent_date TEXT,
      sensitive_content_filter INTEGER DEFAULT 1,
      redact_trauma INTEGER DEFAULT 0,
      redact_sexuality INTEGER DEFAULT 0,
      redact_violence INTEGER DEFAULT 0,
      redact_fears INTEGER DEFAULT 0,
      allow_cloud_analysis INTEGER DEFAULT 1,
      consent_version TEXT DEFAULT '1.0',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      onboarding_privacy_reviewed_at TEXT
    )
  `,

  dream_content_flags: `
    CREATE TABLE IF NOT EXISTS dream_content_flags (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      dream_id TEXT NOT NULL,
      has_trauma INTEGER DEFAULT 0,
      has_sexuality INTEGER DEFAULT 0,
      has_violence INTEGER DEFAULT 0,
      has_fears INTEGER DEFAULT 0,
      severity_score REAL DEFAULT 0,
      classified_locally INTEGER DEFAULT 1,
      user_approved_analysis INTEGER DEFAULT 0,
      redaction_applied TEXT,
      created_at TEXT NOT NULL
    )
  `,

  video_generation_queue: `
    CREATE TABLE IF NOT EXISTS video_generation_queue (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      dream_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      priority INTEGER DEFAULT 0,
      image_url TEXT NOT NULL,
      prompt TEXT NOT NULL,
      subscription_tier TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      video_url TEXT,
      frames_generated INTEGER DEFAULT 0,
      error_message TEXT,
      webhook_url TEXT,
      webhook_sent INTEGER DEFAULT 0,
      retry_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      started_at TEXT,
      completed_at TEXT,
      updated_at TEXT NOT NULL
    )
  `,

  video_generation_limits: `
    CREATE TABLE IF NOT EXISTS video_generation_limits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subscription_tier TEXT NOT NULL,
      videos_generated_this_month INTEGER DEFAULT 0,
      last_reset_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  admin_tasks: `
    CREATE TABLE IF NOT EXISTS admin_tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      due_date TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      tags TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      promoted_from_feature_id TEXT,
      user_id TEXT
    )
  `,

  feature_requests: `
    CREATE TABLE IF NOT EXISTS feature_requests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      requested_by TEXT NOT NULL,
      requested_by_type TEXT NOT NULL,
      target_release TEXT,
      estimated_hours INTEGER,
      notes TEXT,
      technical_details TEXT,
      dependencies TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      assigned_to TEXT,
      votes INTEGER DEFAULT 0
    )
  `,

  community_dreams: `
    CREATE TABLE IF NOT EXISTS community_dreams (
      id TEXT PRIMARY KEY,
      dream_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      interpretation TEXT,
      image_url TEXT,
      territory TEXT NOT NULL DEFAULT 'general',
      like_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      is_anonymous INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      report_count INTEGER DEFAULT 0
    )
  `,

  community_reports: `
    CREATE TABLE IF NOT EXISTS community_reports (
      id TEXT PRIMARY KEY,
      dream_id TEXT NOT NULL,
      reporter_id_hash TEXT NOT NULL,
      report_reason TEXT NOT NULL,
      report_details TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      severity_auto INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      reviewed_at TEXT,
      reviewed_by TEXT,
      user_id TEXT
    )
  `,

  moderation_actions: `
    CREATE TABLE IF NOT EXISTS moderation_actions (
      id TEXT PRIMARY KEY,
      dream_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      action_reason TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      report_ids TEXT NOT NULL,
      author_notified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `,

  gamification_profiles: `
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
      updated_at TEXT NOT NULL
    )
  `,

  coin_transactions: `
    CREATE TABLE IF NOT EXISTS coin_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL
    )
  `,

  rewards_catalog: `
    CREATE TABLE IF NOT EXISTS rewards_catalog (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      cost_dc INTEGER NOT NULL,
      type TEXT NOT NULL,
      category TEXT,
      details TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    )
  `,

  user_rewards: `
    CREATE TABLE IF NOT EXISTS user_rewards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      reward_id TEXT NOT NULL,
      redeemed_at TEXT NOT NULL
    )
  `,

  leaderboard_entries: `
    CREATE TABLE IF NOT EXISTS leaderboard_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      rank INTEGER,
      updated_at TEXT NOT NULL
    )
  `,

  add_on_purchases: `
    CREATE TABLE IF NOT EXISTS add_on_purchases (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      add_on_id TEXT NOT NULL,
      amount_usd REAL NOT NULL,
      quantity INTEGER DEFAULT 1,
      is_recurring INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completed',
      transaction_id TEXT,
      payment_method TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  add_on_analytics: `
    CREATE TABLE IF NOT EXISTS add_on_analytics (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      add_on_id TEXT NOT NULL,
      purchase_count INTEGER DEFAULT 1,
      total_revenue_usd REAL DEFAULT 0.0,
      last_purchase_date TEXT,
      repeat_customer INTEGER DEFAULT 0,
      customer_lifetime_value_usd REAL DEFAULT 0.0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,

  auth_telemetry: `
    CREATE TABLE IF NOT EXISTS auth_telemetry (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      context TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,

  global_settings: `
    CREATE TABLE IF NOT EXISTS global_settings (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      user_id TEXT
    )
  `,

  email_templates: `
    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      body_html TEXT NOT NULL,
      body_text TEXT,
      category TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      user_id TEXT
    )
  `,

  early_access_list: `
    CREATE TABLE IF NOT EXISTS early_access_list (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      tier TEXT NOT NULL,
      user_id TEXT,
      created_at TEXT NOT NULL,
      invited_at TEXT,
      invitation_sent INTEGER DEFAULT 0,
      notes TEXT
    )
  `,

  launch_offer_users: `
    CREATE TABLE IF NOT EXISTS launch_offer_users (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      signup_number INTEGER NOT NULL,
      offer_activated INTEGER DEFAULT 1,
      transcriptions_used INTEGER DEFAULT 0,
      images_generated INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `
}

/**
 * Get all table names from the schema
 */
export function getAllTableNames(): string[] {
  return Object.keys(DATABASE_SCHEMA)
}

/**
 * Get CREATE TABLE SQL for a specific table
 */
export function getTableSchema(tableName: string): string | undefined {
  return DATABASE_SCHEMA[tableName as keyof typeof DATABASE_SCHEMA]
}
