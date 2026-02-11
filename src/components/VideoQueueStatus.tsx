import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Loader2, Play, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { getQueueStatus, getUserVideoLimits, type VideoQueueJob } from '@/utils/videoQueueManager';
import type { SubscriptionTier } from '@/types/subscription';

interface VideoQueueStatusProps {
  userId: string;
  subscriptionTier: SubscriptionTier;
}

export function VideoQueueStatus({ userId, subscriptionTier }: VideoQueueStatusProps) {
  const [queueStatus, setQueueStatus] = useState<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    jobs: VideoQueueJob[];
  } | null>(null);
  
  const [limits, setLimits] = useState<{
    limit: number;
    used: number;
    remaining: number;
    resetDate: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);

  const loadQueueData = useCallback(async () => {
    try {
      const [status, limitsData] = await Promise.all([
        getQueueStatus(userId),
        getUserVideoLimits(userId, subscriptionTier),
      ]);
      
      setQueueStatus(status);
      setLimits(limitsData);
    } catch (error) {
      console.error('Failed to load queue data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, subscriptionTier]);

  useEffect(() => {
    // Delay initial load by 1 second to avoid rate limiting on page load
    const initialDelay = setTimeout(() => {
      loadQueueData();
    }, 1000);
    
    // Refresh every 30 seconds, but only if there are active jobs
    const interval = setInterval(async () => {
      // Check if there are any active jobs (pending or processing)
      if (queueStatus && (queueStatus.pending > 0 || queueStatus.processing > 0)) {
        await loadQueueData();
      }
    }, 30000);
    
    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [loadQueueData, queueStatus]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: VideoQueueJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: VideoQueueJob['status']) => {
    const variants: Record<VideoQueueJob['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      processing: 'default',
      completed: 'secondary',
      failed: 'destructive',
    };
    
    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const usagePercentage = limits ? (limits.used / limits.limit) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Usage Limits Card */}
      {limits && limits.limit > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Video Generation Limits</CardTitle>
            <CardDescription>
              Your monthly video generation usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Used this month</span>
                <span className="font-semibold">
                  {limits.used} / {limits.limit}
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-semibold text-primary">
                {limits.remaining} videos
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Resets on</span>
              <span className="font-semibold">
                {new Date(limits.resetDate).toLocaleDateString()}
              </span>
            </div>

            {limits.remaining === 0 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                    Monthly limit reached
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    Upgrade your plan to generate more videos or wait until {new Date(limits.resetDate).toLocaleDateString()}.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Queue Status Card */}
      {queueStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Video Queue Status</CardTitle>
            <CardDescription>
              Track your video generation jobs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold">{queueStatus.pending}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Processing</p>
                  <p className="text-xl font-bold">{queueStatus.processing}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold">{queueStatus.completed}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-xl font-bold">{queueStatus.failed}</p>
                </div>
              </div>
            </div>

            {/* Recent Jobs */}
            {queueStatus.jobs.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-sm font-semibold">Recent Jobs</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {queueStatus.jobs.slice(0, 10).map((job) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(job.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(job.status)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(job.createdAt).toLocaleString()}
                          </span>
                        </div>
                        
                        <p className="text-sm line-clamp-1">
                          {job.prompt.substring(0, 80)}...
                        </p>
                        
                        {job.status === 'completed' && job.videoUrl && (
                          <Button
                            size="sm"
                            variant="link"
                            className="h-auto p-0 mt-1"
                            onClick={() => window.open(job.videoUrl, '_blank')}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            View Video
                          </Button>
                        )}
                        
                        {job.status === 'failed' && job.errorMessage && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Error: {job.errorMessage}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {queueStatus.jobs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No video generation jobs yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
