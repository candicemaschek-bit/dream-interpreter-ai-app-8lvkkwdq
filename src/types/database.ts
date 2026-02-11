export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          age: number
          gender: string
          nightmare_prone: boolean
          recurring_dreams: boolean
          onboarding_completed: boolean
          created_at: string
          updated_at: string
          subscription_tier: string
          dreams_analyzed_this_month: number
          last_reset_date: string | null
          dreams_analyzed_lifetime: number
          referral_bonus_dreams: number
          device_fingerprint: string | null
          signup_ip: string | null
          normalized_email: string | null
          account_status: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          age: number
          gender: string
          nightmare_prone?: boolean
          recurring_dreams?: boolean
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
          subscription_tier?: string
          dreams_analyzed_this_month?: number
          last_reset_date?: string | null
          dreams_analyzed_lifetime?: number
          referral_bonus_dreams?: number
          device_fingerprint?: string | null
          signup_ip?: string | null
          normalized_email?: string | null
          account_status?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          age?: number
          gender?: string
          nightmare_prone?: boolean
          recurring_dreams?: boolean
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
          subscription_tier?: string
          dreams_analyzed_this_month?: number
          last_reset_date?: string | null
          dreams_analyzed_lifetime?: number
          referral_bonus_dreams?: number
          device_fingerprint?: string | null
          signup_ip?: string | null
          normalized_email?: string | null
          account_status?: string
        }
      }
      dreams: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          input_type: string
          image_url: string | null
          symbols_data: string | null
          interpretation: string | null
          video_url: string | null
          created_at: string
          updated_at: string
          tags: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          input_type: string
          image_url?: string | null
          symbols_data?: string | null
          interpretation?: string | null
          video_url?: string | null
          created_at?: string
          updated_at?: string
          tags?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          input_type?: string
          image_url?: string | null
          symbols_data?: string | null
          interpretation?: string | null
          video_url?: string | null
          created_at?: string
          updated_at?: string
          tags?: string | null
        }
      }
      dream_symbols_v2: {
        Row: {
          id: string
          user_id: string
          symbol: string
          archetype_category: string | null
          jungian_meaning: string | null
          personal_meaning: string | null
          occurrence_count: number
          contexts: string | null
          emotional_valence: number | null
          first_seen: string
          last_seen: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          archetype_category?: string | null
          jungian_meaning?: string | null
          personal_meaning?: string | null
          occurrence_count?: number
          contexts?: string | null
          emotional_valence?: number | null
          first_seen?: string
          last_seen?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          archetype_category?: string | null
          jungian_meaning?: string | null
          personal_meaning?: string | null
          occurrence_count?: number
          contexts?: string | null
          emotional_valence?: number | null
          first_seen?: string
          last_seen?: string
          created_at?: string
          updated_at?: string
        }
      }
      dream_entities: {
        Row: {
          id: string
          user_id: string
          entity_type: string
          entity_name: string
          normalized_name: string | null
          archetype: string | null
          occurrence_count: number
          first_seen: string
          last_seen: string
          dream_ids: string | null
          emotional_context: string | null
          metadata: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entity_type: string
          entity_name: string
          normalized_name?: string | null
          archetype?: string | null
          occurrence_count?: number
          first_seen?: string
          last_seen?: string
          dream_ids?: string | null
          emotional_context?: string | null
          metadata?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          entity_type?: string
          entity_name?: string
          normalized_name?: string | null
          archetype?: string | null
          occurrence_count?: number
          first_seen?: string
          last_seen?: string
          dream_ids?: string | null
          emotional_context?: string | null
          metadata?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      dream_emotions: {
        Row: {
          id: string
          user_id: string
          dream_id: string
          emotion: string
          intensity: number
          valence: number
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          dream_id: string
          emotion: string
          intensity?: number
          valence?: number
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          dream_id?: string
          emotion?: string
          intensity?: number
          valence?: number
          date?: string
          created_at?: string
        }
      }
      dream_motifs: {
        Row: {
          id: string
          user_id: string
          motif_type: string
          occurrence_count: number
          intensity_avg: number
          resolution_pattern: string | null
          dream_ids: string | null
          first_seen: string
          last_seen: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          motif_type: string
          occurrence_count?: number
          intensity_avg?: number
          resolution_pattern?: string | null
          dream_ids?: string | null
          first_seen?: string
          last_seen?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          motif_type?: string
          occurrence_count?: number
          intensity_avg?: number
          resolution_pattern?: string | null
          dream_ids?: string | null
          first_seen?: string
          last_seen?: string
          created_at?: string
          updated_at?: string
        }
      }
      pattern_insights: {
        Row: {
          id: string
          user_id: string
          insight_type: string
          title: string
          description: string
          confidence: number
          supporting_dreams: string | null
          generated_at: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          insight_type: string
          title: string
          description: string
          confidence?: number
          supporting_dreams?: string | null
          generated_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          insight_type?: string
          title?: string
          description?: string
          confidence?: number
          supporting_dreams?: string | null
          generated_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_privacy_settings: {
        Row: {
          id: string
          user_id: string
          pattern_tracking_consent: boolean
          pattern_tracking_consent_date: string | null
          sensitive_content_filter: boolean
          redact_trauma: boolean
          redact_sexuality: boolean
          redact_violence: boolean
          redact_fears: boolean
          allow_cloud_analysis: boolean
          consent_version: string
          created_at: string
          updated_at: string
          onboarding_privacy_reviewed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          pattern_tracking_consent?: boolean
          pattern_tracking_consent_date?: string | null
          sensitive_content_filter?: boolean
          redact_trauma?: boolean
          redact_sexuality?: boolean
          redact_violence?: boolean
          redact_fears?: boolean
          allow_cloud_analysis?: boolean
          consent_version?: string
          created_at?: string
          updated_at?: string
          onboarding_privacy_reviewed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          pattern_tracking_consent?: boolean
          pattern_tracking_consent_date?: string | null
          sensitive_content_filter?: boolean
          redact_trauma?: boolean
          redact_sexuality?: boolean
          redact_violence?: boolean
          redact_fears?: boolean
          allow_cloud_analysis?: boolean
          consent_version?: string
          created_at?: string
          updated_at?: string
          onboarding_privacy_reviewed_at?: string | null
        }
      }
      video_generation_queue: {
        Row: {
          id: string
          user_id: string
          dream_id: string | null
          status: string
          priority: number
          image_url: string
          prompt: string
          subscription_tier: string
          duration_seconds: number
          video_url: string | null
          frames_generated: number
          error_message: string | null
          webhook_url: string | null
          webhook_sent: boolean
          retry_count: number
          created_at: string
          started_at: string | null
          completed_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          dream_id?: string | null
          status?: string
          priority?: number
          image_url: string
          prompt: string
          subscription_tier: string
          duration_seconds: number
          video_url?: string | null
          frames_generated?: number
          error_message?: string | null
          webhook_url?: string | null
          webhook_sent?: boolean
          retry_count?: number
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          dream_id?: string | null
          status?: string
          priority?: number
          image_url?: string
          prompt?: string
          subscription_tier?: string
          duration_seconds?: number
          video_url?: string | null
          frames_generated?: number
          error_message?: string | null
          webhook_url?: string | null
          webhook_sent?: boolean
          retry_count?: number
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
          updated_at?: string
        }
      }
      gamification_profiles: {
        Row: {
          id: string
          user_id: string
          dream_coins: number
          level: number
          total_xp: number
          current_streak: number
          best_streak: number
          last_activity_date: string | null
          badges: string | null
          referral_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          dream_coins?: number
          level?: number
          total_xp?: number
          current_streak?: number
          best_streak?: number
          last_activity_date?: string | null
          badges?: string | null
          referral_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          dream_coins?: number
          level?: number
          total_xp?: number
          current_streak?: number
          best_streak?: number
          last_activity_date?: string | null
          badges?: string | null
          referral_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      add_on_purchases: {
        Row: {
          id: string
          user_id: string
          add_on_id: string
          amount_usd: number
          quantity: number
          is_recurring: boolean
          status: string
          transaction_id: string | null
          payment_method: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          add_on_id: string
          amount_usd: number
          quantity?: number
          is_recurring?: boolean
          status?: string
          transaction_id?: string | null
          payment_method?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          add_on_id?: string
          amount_usd?: number
          quantity?: number
          is_recurring?: boolean
          status?: string
          transaction_id?: string | null
          payment_method?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}