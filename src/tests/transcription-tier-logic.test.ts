import { describe, it, expect } from 'vitest'
import { 
  canTranscribeAudio, 
  getTranscriptionLimit, 
  canTranscribeWithinLifetimeLimit,
  TIER_CAPABILITIES
} from '../config/tierCapabilities'

/**
 * Transcription Tier Logic Tests
 * 
 * Strategy A: Transcription is available to ALL tiers
 * - canTranscribeAudio() always returns true (access allowed for all)
 * - Monthly limits are enforced by the edge function, not this function
 * - Each tier has a different monthly quota (free: 2, pro: 10, premium: 20, vip: 25)
 */
describe('Transcription Tier Logic', () => {
  describe('canTranscribeAudio - ALL tiers allowed', () => {
    it('allows transcription for free tier', () => {
      expect(canTranscribeAudio('free')).toBe(true)
      expect(canTranscribeAudio('free', false)).toBe(true)
      expect(canTranscribeAudio('free', true)).toBe(true)
    })

    it('allows transcription for pro tier', () => {
      expect(canTranscribeAudio('pro')).toBe(true)
      expect(canTranscribeAudio('pro', false)).toBe(true)
    })

    it('allows transcription for premium tier', () => {
      expect(canTranscribeAudio('premium')).toBe(true)
      expect(canTranscribeAudio('premium', false)).toBe(true)
    })

    it('allows transcription for vip tier', () => {
      expect(canTranscribeAudio('vip')).toBe(true)
      expect(canTranscribeAudio('vip', false)).toBe(true)
    })
  })

  describe('getTranscriptionLimit - monthly quotas by tier', () => {
    it('returns correct monthly limits for each tier', () => {
      expect(getTranscriptionLimit('free')).toBe(2)
      expect(getTranscriptionLimit('pro')).toBe(10)
      expect(getTranscriptionLimit('premium')).toBe(20)
      expect(getTranscriptionLimit('vip')).toBe(25)
    })
  })

  describe('canTranscribeWithinLifetimeLimit - legacy support', () => {
    it('allows free tier transcriptions (lifetime limit exists but enforced elsewhere)', () => {
      // Free tier has transcriptionsLifetimeLimit: 2 in config
      // This function checks against that limit
      expect(canTranscribeWithinLifetimeLimit('free', 0)).toBe(true)
      expect(canTranscribeWithinLifetimeLimit('free', 1)).toBe(true)
      expect(canTranscribeWithinLifetimeLimit('free', 2)).toBe(false) // At limit
      expect(canTranscribeWithinLifetimeLimit('free', 100)).toBe(false) // Over limit
    })

    it('always allows paid tiers (no lifetime limit)', () => {
      expect(canTranscribeWithinLifetimeLimit('pro', 0)).toBe(true)
      expect(canTranscribeWithinLifetimeLimit('pro', 100)).toBe(true)
      expect(canTranscribeWithinLifetimeLimit('premium', 1000)).toBe(true)
      expect(canTranscribeWithinLifetimeLimit('vip', 10000)).toBe(true)
    })
  })

  describe('TIER_CAPABILITIES configuration', () => {
    it('has correct transcription config for all tiers', () => {
      // All tiers have canTranscribeAudio: true in config
      expect(TIER_CAPABILITIES.free.canTranscribeAudio).toBe(true)
      expect(TIER_CAPABILITIES.pro.canTranscribeAudio).toBe(true)
      expect(TIER_CAPABILITIES.premium.canTranscribeAudio).toBe(true)
      expect(TIER_CAPABILITIES.vip.canTranscribeAudio).toBe(true)
    })

    it('has correct monthly transcription limits', () => {
      expect(TIER_CAPABILITIES.free.transcriptionsPerMonth).toBe(2)
      expect(TIER_CAPABILITIES.pro.transcriptionsPerMonth).toBe(10)
      expect(TIER_CAPABILITIES.premium.transcriptionsPerMonth).toBe(20)
      expect(TIER_CAPABILITIES.vip.transcriptionsPerMonth).toBe(25)
    })

    it('free tier has lifetime limit defined', () => {
      expect(TIER_CAPABILITIES.free.transcriptionsLifetimeLimit).toBe(2)
    })
  })
})
