import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Loader2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { blink } from '@/blink/client';
import { getQueueStatus, type VideoQueueJob } from '@/utils/videoQueueManager';

interface VideoGenerationNotificationsProps {
  userId: string;
  onVideoComplete?: (jobId: string, videoUrl: string) => void;
}

interface NotificationState {
  id: string;
  jobId: string;
  status: VideoQueueJob['status'];
  prompt: string;
  videoUrl?: string;
  errorMessage?: string;
  dismissed: boolean;
}

export function VideoGenerationNotifications({ 
  userId, 
  onVideoComplete 
}: VideoGenerationNotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());

  const checkForUpdates = useCallback(async () => {
    try {
      const status = await getQueueStatus(userId);
      
      // Filter jobs that are still processing or recently completed/failed
      const activeJobs = [
        ...status.jobs.filter(j => j.status === 'pending' || j.status === 'processing'),
        ...status.jobs.filter(j => {
          const completedAt = new Date(j.completedAt || j.updatedAt);
          const timeSinceCompletion = Date.now() - completedAt.getTime();
          return (j.status === 'completed' || j.status === 'failed') && timeSinceCompletion < 300000; // 5 minutes
        }),
      ];

      setNotifications(prevNotifications => {
        const newNotifications: NotificationState[] = [];
        
        activeJobs.forEach(job => {
          const existingNotification = prevNotifications.find(n => n.jobId === job.id);
          
          // Check if status changed
          const statusChanged = existingNotification && existingNotification.status !== job.status;
          
          // Create or update notification
          newNotifications.push({
            id: existingNotification?.id || `notif_${job.id}`,
            jobId: job.id,
            status: job.status,
            prompt: job.prompt,
            videoUrl: job.videoUrl,
            errorMessage: job.errorMessage,
            dismissed: existingNotification?.dismissed || false,
          });
          
          // Trigger completion callback if status changed to completed
          if (statusChanged && job.status === 'completed' && job.videoUrl && onVideoComplete) {
            onVideoComplete(job.id, job.videoUrl);
          }
        });
        
        // Keep dismissed notifications for a bit longer
        prevNotifications.forEach(prevNotif => {
          if (prevNotif.dismissed && !newNotifications.find(n => n.id === prevNotif.id)) {
            const timeSinceDismissal = Date.now() - lastCheckTime.getTime();
            if (timeSinceDismissal < 60000) { // Keep for 1 minute after dismissal
              newNotifications.push(prevNotif);
            }
          }
        });
        
        return newNotifications;
      });
      
      setLastCheckTime(new Date());
    } catch (error) {
      console.error('Failed to check video generation status:', error);
    }
  }, [userId, onVideoComplete, lastCheckTime]);

  useEffect(() => {
    // Delay initial check by 2 seconds to avoid rate limiting on page load
    const initialDelay = setTimeout(() => {
      checkForUpdates();
    }, 2000);
    
    // Poll every 30 seconds, but only if there are active notifications
    const interval = setInterval(async () => {
      // Only poll if there are visible (non-dismissed) notifications with active status
      const hasActiveJobs = notifications.some(
        n => !n.dismissed && (n.status === 'pending' || n.status === 'processing')
      );
      
      if (hasActiveJobs) {
        await checkForUpdates();
      }
    }, 30000);
    
    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [checkForUpdates, notifications]);

  const handleDismiss = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, dismissed: true } : n
      )
    );
  };

  const handleViewVideo = (videoUrl: string) => {
    window.open(videoUrl, '_blank');
  };

  const visibleNotifications = notifications.filter(n => !n.dismissed);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-md">
      <AnimatePresence>
        {visibleNotifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-background border border-border rounded-lg shadow-lg p-4 w-full"
          >
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {notification.status === 'pending' && (
                  <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                )}
                {notification.status === 'processing' && (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                )}
                {notification.status === 'completed' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {notification.status === 'failed' && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-sm">
                    {notification.status === 'pending' && 'Video Queued'}
                    {notification.status === 'processing' && 'Generating Video'}
                    {notification.status === 'completed' && 'Video Ready!'}
                    {notification.status === 'failed' && 'Video Generation Failed'}
                  </h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => handleDismiss(notification.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {notification.prompt.length > 80
                    ? `${notification.prompt.substring(0, 80)}...`
                    : notification.prompt}
                </p>

                {/* Status-specific content */}
                {notification.status === 'pending' && (
                  <p className="text-xs text-muted-foreground">
                    Your video is in the queue and will be processed soon.
                  </p>
                )}

                {notification.status === 'processing' && (
                  <div className="space-y-2">
                    <Progress value={50} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Generating frames and composing video...
                    </p>
                  </div>
                )}

                {notification.status === 'completed' && notification.videoUrl && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleViewVideo(notification.videoUrl!)}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    View Video
                  </Button>
                )}

                {notification.status === 'failed' && notification.errorMessage && (
                  <div className="space-y-2">
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {notification.errorMessage}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Please try again or contact support if the issue persists.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
