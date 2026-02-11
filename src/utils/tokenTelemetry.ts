/**
 * Token Telemetry System
 * Tracks token failures, reauth flows, and retry attempts for debugging
 */

const STORAGE_KEY = 'token-telemetry-events';
const MAX_EVENTS = 1000;

export interface TelemetryEvent {
  id: string;
  type: string;
  timestamp: number;
  error?: string;
  context: Record<string, unknown>;
}

export interface TelemetryStats {
  totalFailures: number;
  reauthsShown: number;
  reauthsSuccessful: number;
  reauthSuccessRate: number;
}

class TokenTelemetryService {
  private events: TelemetryEvent[] = [];

  constructor() {
    this.loadEvents();
  }

  /**
   * Track a token failure event
   */
  trackTokenFailure(type: string, error: Error, context: Record<string, unknown> = {}): void {
    const event: TelemetryEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      error: error.message,
      context,
    };

    this.addEvent(event);
  }

  /**
   * Track when reauth dialog is shown
   */
  trackReauthShown(context: Record<string, unknown> = {}): void {
    const event: TelemetryEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'reauth_shown',
      timestamp: Date.now(),
      context,
    };

    this.addEvent(event);
  }

  /**
   * Track successful reauth
   */
  trackReauthSuccess(context: Record<string, unknown> = {}): void {
    const event: TelemetryEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'reauth_success',
      timestamp: Date.now(),
      context,
    };

    this.addEvent(event);
  }

  /**
   * Track reauth dismissal
   */
  trackReauthDismissed(context: Record<string, unknown> = {}): void {
    const event: TelemetryEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'reauth_dismissed',
      timestamp: Date.now(),
      context,
    };

    this.addEvent(event);
  }

  /**
   * Track successful retry
   */
  trackRetrySuccess(context: Record<string, unknown> = {}): void {
    const event: TelemetryEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'retry_success',
      timestamp: Date.now(),
      context,
    };

    this.addEvent(event);
  }

  /**
   * Track failed retry
   */
  trackRetryFailure(context: Record<string, unknown> = {}): void {
    const event: TelemetryEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'retry_failure',
      timestamp: Date.now(),
      context,
    };

    this.addEvent(event);
  }

  /**
   * Add an event to the store
   */
  private addEvent(event: TelemetryEvent): void {
    this.events.push(event);

    // Keep only the last MAX_EVENTS
    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(-MAX_EVENTS);
    }

    this.persistEvents();
  }

  /**
   * Get all events
   */
  getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  /**
   * Get events by type
   */
  getEventsByType(type: string): TelemetryEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  /**
   * Get events in time range
   */
  getEventsByTimeRange(startTime: number, endTime: number): TelemetryEvent[] {
    return this.events.filter((e) => e.timestamp >= startTime && e.timestamp <= endTime);
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = [];
    this.persistEvents();
  }

  /**
   * Get telemetry statistics
   */
  getStats(): TelemetryStats {
    const totalFailures = this.events.filter((e) =>
      e.type === 'token_refresh' || e.type === 'auth_required' || e.type === 'session_expired' || e.type === 'max_retries'
    ).length;

    const reauthsShown = this.getEventsByType('reauth_shown').length;
    const reauthsSuccessful = this.getEventsByType('reauth_success').length;
    const reauthSuccessRate = reauthsShown > 0 ? (reauthsSuccessful / reauthsShown) * 100 : 0;

    return {
      totalFailures,
      reauthsShown,
      reauthsSuccessful,
      reauthSuccessRate,
    };
  }

  /**
   * Export events as JSON
   */
  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Persist events to localStorage
   */
  private persistEvents(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to persist telemetry events:', error);
    }
  }

  /**
   * Load events from localStorage
   */
  private loadEvents(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load telemetry events:', error);
      this.events = [];
    }
  }

  /**
   * Reload events from localStorage (for testing)
   */
  reloadEvents(): void {
    this.loadEvents();
  }
}

// Singleton instance
export const TokenTelemetry = new TokenTelemetryService();

/**
 * Helper function to track token failures
 */
export function trackTokenFailure(type: string, error: Error, context: Record<string, unknown> = {}): void {
  TokenTelemetry.trackTokenFailure(type, error, context);
}
