/**
 * Engagement Notification Center
 * Displays warm, magical engagement messages to keep users inspired
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { EngagementGuide, EngagementContext, UserEngagementState } from '../utils/engagementGuide';

interface EngagementNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  trigger: string;
  priority?: 'low' | 'medium' | 'high';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EngagementNotification: React.FC<EngagementNotificationProps> = ({
  isOpen,
  onClose,
  message,
  trigger,
  priority = 'medium',
  action
}) => {
  if (!isOpen) return null;

  const getPriorityStyles = () => {
    switch (priority) {
      case 'high':
        return 'border-accent shadow-lg shadow-accent/20';
      case 'medium':
        return 'border-primary/40 shadow-md shadow-primary/10';
      case 'low':
        return 'border-secondary shadow-sm shadow-secondary/5';
      default:
        return 'border-primary/40';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={`fixed bottom-6 right-6 max-w-md backdrop-blur-md bg-background/95 border rounded-lg p-4 z-50 ${getPriorityStyles()}`}
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm text-foreground/90 leading-relaxed font-medium">{message}</p>
              {action && (
                <Button
                  onClick={action.onClick}
                  variant="ghost"
                  size="sm"
                  className="mt-3 h-8 text-xs text-primary hover:bg-primary/10"
                >
                  {action.label}
                </Button>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-foreground/40 hover:text-foreground/70 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Engagement Notification Center Hook
 * Manages engagement message display and lifecycle
 */
export function useEngagementNotification() {
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    message: string;
    trigger: string;
    priority: 'low' | 'medium' | 'high';
    action?: { label: string; onClick: () => void };
  }>({
    isOpen: false,
    message: '',
    trigger: '',
    priority: 'medium'
  });

  const showNotification = (
    message: string,
    trigger: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    action?: { label: string; onClick: () => void }
  ) => {
    setNotification({
      isOpen: true,
      message,
      trigger,
      priority,
      action
    });

    // Engagement toasts require manual dismissal - no auto-close
    // User must interact with the toast (click button or close)
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    notification,
    showNotification,
    closeNotification,
    NotificationComponent: (
      <EngagementNotification
        isOpen={notification.isOpen}
        onClose={closeNotification}
        message={notification.message}
        trigger={notification.trigger}
        priority={notification.priority}
        action={notification.action}
      />
    )
  };
}

/**
 * Engagement Notification Center Manager
 * Coordinates multi-message sequences and adaptive timing
 */
export class EngagementNotificationManager {
  private notificationQueue: Array<{
    message: string;
    trigger: string;
    priority: 'low' | 'medium' | 'high';
    delay: number;
  }> = [];

  private isProcessing = false;

  /**
   * Queue an engagement message
   */
  queueMessage(
    message: string,
    trigger: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    delayMs: number = 0
  ): void {
    this.notificationQueue.push({
      message,
      trigger,
      priority,
      delay: delayMs
    });
  }

  /**
   * Process queued messages with delays
   */
  async processQueue(callback: (message: string, trigger: string, priority: 'low' | 'medium' | 'high') => void): Promise<void> {
    if (this.isProcessing || this.notificationQueue.length === 0) return;

    this.isProcessing = true;

    for (const item of this.notificationQueue) {
      if (item.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, item.delay));
      }
      callback(item.message, item.trigger, item.priority);
    }

    this.notificationQueue = [];
    this.isProcessing = false;
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.notificationQueue = [];
  }
}
