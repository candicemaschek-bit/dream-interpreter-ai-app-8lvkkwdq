/**
 * Token Telemetry System Tests
 * Verifies telemetry tracking for token failures and reauth flows
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TokenTelemetry, trackTokenFailure } from '@/utils/tokenTelemetry'

describe('Token Telemetry System', () => {
  beforeEach(() => {
    // Clear localStorage and telemetry events before each test
    localStorage.clear()
    TokenTelemetry.clearEvents()
    vi.clearAllMocks()
  })

  describe('Token Failure Tracking', () => {
    it('should track token refresh failures', () => {
      const error = new Error('Token refresh failed')
      TokenTelemetry.trackTokenFailure('token_refresh', error, {
        operation: 'generate-video',
        userId: 'test-user-123'
      })

      const events = TokenTelemetry.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('token_refresh')
      expect(events[0].error).toBe('Token refresh failed')
      expect(events[0].context.operation).toBe('generate-video')
    })

    it('should track auth required errors', () => {
      const error = new Error('Authentication required')
      TokenTelemetry.trackTokenFailure('auth_required', error, {
        endpoint: '/api/video',
        statusCode: 401
      })

      const events = TokenTelemetry.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('auth_required')
      expect(events[0].context.endpoint).toBe('/api/video')
      expect(events[0].context.statusCode).toBe(401)
    })

    it('should track session expired errors', () => {
      TokenTelemetry.trackTokenFailure('session_expired', new Error('Session expired'), {
        lastActivity: Date.now() - 3600000 // 1 hour ago
      })

      const events = TokenTelemetry.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('session_expired')
    })

    it('should track max retries reached', () => {
      TokenTelemetry.trackTokenFailure('max_retries', new Error('Max retries reached'), {
        retryCount: 3,
        operation: 'video-generation'
      })

      const events = TokenTelemetry.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('max_retries')
      expect(events[0].context.retryCount).toBe(3)
    })
  })

  describe('Reauth Tracking', () => {
    it('should track reauth dialog shown', () => {
      TokenTelemetry.trackReauthShown({
        trigger: 'video-generation',
        errorType: 'token_expired'
      })

      const events = TokenTelemetry.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('reauth_shown')
      expect(events[0].context.trigger).toBe('video-generation')
    })

    it('should track reauth success', () => {
      TokenTelemetry.trackReauthSuccess({
        method: 'one-click',
        duration: 1500
      })

      const events = TokenTelemetry.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('reauth_success')
      expect(events[0].context.method).toBe('one-click')
      expect(events[0].context.duration).toBe(1500)
    })

    it('should track reauth dismissal', () => {
      TokenTelemetry.trackReauthDismissed({
        reason: 'user_cancelled'
      })

      const events = TokenTelemetry.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('reauth_dismissed')
      expect(events[0].context.reason).toBe('user_cancelled')
    })
  })

  describe('Retry Tracking', () => {
    it('should track retry success', () => {
      TokenTelemetry.trackRetrySuccess({
        operation: 'video-generation',
        attemptNumber: 2,
        totalDuration: 3000
      })

      const events = TokenTelemetry.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('retry_success')
      expect(events[0].context.attemptNumber).toBe(2)
    })

    it('should track retry failure', () => {
      TokenTelemetry.trackRetryFailure({
        operation: 'video-generation',
        attemptNumber: 3,
        error: 'Still unauthorized'
      })

      const events = TokenTelemetry.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('retry_failure')
      expect(events[0].context.attemptNumber).toBe(3)
    })
  })

  describe('Event Management', () => {
    it('should limit stored events to 1000', () => {
      // Create 1100 events
      for (let i = 0; i < 1100; i++) {
        TokenTelemetry.trackTokenFailure('test', new Error('test'), { index: i })
      }

      const events = TokenTelemetry.getEvents()
      expect(events).toHaveLength(1000)
      // Should keep the most recent events
      expect(events[events.length - 1].context.index).toBe(1099)
    })

    it('should clear all events', () => {
      TokenTelemetry.trackTokenFailure('test', new Error('test'))
      expect(TokenTelemetry.getEvents()).toHaveLength(1)

      TokenTelemetry.clearEvents()
      expect(TokenTelemetry.getEvents()).toHaveLength(0)
    })

    it('should get events by type', () => {
      TokenTelemetry.trackTokenFailure('token_refresh', new Error('test'))
      TokenTelemetry.trackTokenFailure('auth_required', new Error('test'))
      TokenTelemetry.trackReauthSuccess({ method: 'one-click' })

      const refreshEvents = TokenTelemetry.getEventsByType('token_refresh')
      const reauthEvents = TokenTelemetry.getEventsByType('reauth_success')

      expect(refreshEvents).toHaveLength(1)
      expect(reauthEvents).toHaveLength(1)
    })

    it('should get events in time range', () => {
      const now = Date.now()
      const oneHourAgo = now - 3600000

      TokenTelemetry.trackTokenFailure('test', new Error('test'))
      
      const recentEvents = TokenTelemetry.getEventsByTimeRange(oneHourAgo, now + 1000)
      expect(recentEvents).toHaveLength(1)

      const oldEvents = TokenTelemetry.getEventsByTimeRange(oneHourAgo - 10000, oneHourAgo)
      expect(oldEvents).toHaveLength(0)
    })
  })

  describe('Statistics', () => {
    it('should calculate correct statistics', () => {
      // Create some events
      TokenTelemetry.trackTokenFailure('token_refresh', new Error('test'))
      TokenTelemetry.trackTokenFailure('token_refresh', new Error('test'))
      TokenTelemetry.trackReauthShown({ trigger: 'video' })
      TokenTelemetry.trackReauthSuccess({ method: 'one-click' })

      const stats = TokenTelemetry.getStats()

      expect(stats.totalFailures).toBe(2)
      expect(stats.reauthsShown).toBe(1)
      expect(stats.reauthsSuccessful).toBe(1)
      expect(stats.reauthSuccessRate).toBe(100)
    })

    it('should handle zero reauths correctly', () => {
      TokenTelemetry.trackTokenFailure('token_refresh', new Error('test'))

      const stats = TokenTelemetry.getStats()

      expect(stats.totalFailures).toBe(1)
      expect(stats.reauthsShown).toBe(0)
      expect(stats.reauthsSuccessful).toBe(0)
      expect(stats.reauthSuccessRate).toBe(0)
    })

    it('should export events as JSON', () => {
      TokenTelemetry.trackTokenFailure('test', new Error('test'), { foo: 'bar' })
      
      const exported = TokenTelemetry.exportEvents()
      const parsed = JSON.parse(exported)

      expect(parsed).toHaveLength(1)
      expect(parsed[0].type).toBe('test')
      expect(parsed[0].context.foo).toBe('bar')
    })
  })

  describe('Persistence', () => {
    it('should persist events to localStorage', () => {
      TokenTelemetry.trackTokenFailure('test', new Error('test'))

      const stored = localStorage.getItem('token-telemetry-events')
      expect(stored).toBeTruthy()

      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveLength(1)
    })

    it('should load events from localStorage on init', () => {
      // Clear first to reset
      TokenTelemetry.clearEvents()
      
      // Manually add events to localStorage
      const events = [{
        id: 'test-1',
        type: 'token_refresh',
        timestamp: Date.now(),
        error: 'Test error',
        context: {}
      }]
      localStorage.setItem('token-telemetry-events', JSON.stringify(events))

      // Reload from localStorage
      TokenTelemetry.reloadEvents()
      
      // Should have loaded the event from storage
      const loaded = TokenTelemetry.getEvents()
      expect(loaded).toHaveLength(1)
      expect(loaded[0].id).toBe('test-1')
    })
  })
})
