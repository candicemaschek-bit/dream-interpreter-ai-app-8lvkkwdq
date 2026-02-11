import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Video,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { blink } from '@/blink/client';
import { retryJob, type VideoQueueJob } from '@/utils/videoQueueManager';
import { getCostBreakdownByTier } from '../../functions/audioMuxing';

export function AdminVideoQueueMonitor() {
  const [queueData, setQueueData] = useState<{
    pending: VideoQueueJob[];
    processing: VideoQueueJob[];
    completed: VideoQueueJob[];
    failed: VideoQueueJob[];
  }>({
    pending: [],
    processing: [],
    completed: [],
    failed: [],
  });

  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadQueueData = useCallback(async () => {
    try {
      // Fetch all queue jobs
      const allJobs = await blink.db.videoGenerationQueue.list({
        orderBy: { createdAt: 'desc' },
        limit: 100,
      });

      const typedJobs = allJobs as VideoQueueJob[];

      setQueueData({
        pending: typedJobs.filter(j => j.status === 'pending'),
        processing: typedJobs.filter(j => j.status === 'processing'),
        completed: typedJobs.filter(j => j.status === 'completed'),
        failed: typedJobs.filter(j => j.status === 'failed'),
      });
    } catch (error) {
      console.error('Failed to load queue data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueueData();

    if (autoRefresh) {
      // Refresh every 15 seconds, but only if there are active jobs
      const interval = setInterval(() => {
        const activeJobs = queueData.pending.length + queueData.processing.length;
        if (activeJobs > 0) {
          loadQueueData();
        }
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [loadQueueData, autoRefresh, queueData]);

  const handleRetry = async (jobId: string) => {
    setRetrying(jobId);
    try {
      const result = await retryJob(jobId);
      if (result.success) {
        await loadQueueData();
      } else {
        alert(`Retry failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Retry failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRetrying(null);
    }
  };

  const handleTriggerProcessor = async () => {
    try {
      // Call the cron trigger endpoint
      const response = await fetch(
        'https://dream-interpreter-ai-app-8lvkkwdq.functions.blink.new/queue-cron-trigger',
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        alert('Queue processor triggered successfully');
        await loadQueueData();
      } else {
        alert('Failed to trigger queue processor');
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const totalJobs = Object.values(queueData).flat().length;
  const costBreakdown = getCostBreakdownByTier();

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

  const getPriorityBadge = (priority: number) => {
    if (priority >= 100) return <Badge variant="destructive">VIP</Badge>;
    if (priority >= 50) return <Badge variant="default">Premium</Badge>;
    if (priority >= 25) return <Badge>Pro</Badge>;
    return <Badge variant="outline">Free</Badge>;
  };

  const renderJobCard = (job: VideoQueueJob) => (
    <motion.div
      key={job.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 bg-secondary/50 rounded-lg space-y-3"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getStatusIcon(job.status)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {getStatusBadge(job.status)}
              {getPriorityBadge(job.priority)}
              <span className="text-xs text-muted-foreground">
                {job.durationSeconds}s
              </span>
            </div>
            <p className="text-sm line-clamp-2 mb-1">{job.prompt}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Created: {new Date(job.createdAt).toLocaleString()}</span>
              {job.startedAt && (
                <span>Started: {new Date(job.startedAt).toLocaleTimeString()}</span>
              )}
              {job.completedAt && (
                <span>Completed: {new Date(job.completedAt).toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        </div>

        {job.status === 'failed' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRetry(job.id)}
            disabled={retrying === job.id || job.retryCount >= 3}
          >
            {retrying === job.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry {job.retryCount > 0 && `(${job.retryCount})`}
              </>
            )}
          </Button>
        )}

        {job.status === 'completed' && job.videoUrl && (
          <Button
            size="sm"
            variant="link"
            onClick={() => window.open(job.videoUrl, '_blank')}
          >
            <Play className="w-4 h-4 mr-2" />
            View
          </Button>
        )}
      </div>

      {job.errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{job.errorMessage}</AlertDescription>
        </Alert>
      )}

      {job.framesGenerated > 0 && (
        <div className="text-xs text-muted-foreground">
          Frames generated: {job.framesGenerated}
        </div>
      )}
    </motion.div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Video Queue Monitor</h2>
          <p className="text-muted-foreground">
            Real-time monitoring and management of video generation queue
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={loadQueueData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleTriggerProcessor}>
            <Video className="w-4 h-4 mr-2" />
            Trigger Processor
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div className="text-3xl font-bold">{queueData.pending.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <div className="text-3xl font-bold">{queueData.processing.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div className="text-3xl font-bold">{queueData.failed.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Cost Analysis by Tier
          </CardTitle>
          <CardDescription>
            Estimated costs for video generation per subscription tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Premium Tier</span>
                <Badge>6 seconds</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost per video:</span>
                  <span className="font-mono">${costBreakdown.premium.costPerVideo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly limit:</span>
                  <span>{costBreakdown.premium.monthlyLimit} videos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost per month:</span>
                  <span className="font-mono font-semibold">
                    ${costBreakdown.premium.costPerMonth}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">VIP Tier</span>
                <Badge variant="destructive">45 seconds</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost per video:</span>
                  <span className="font-mono">${costBreakdown.vip.costPerVideo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly limit:</span>
                  <span>{costBreakdown.vip.monthlyLimit} videos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost per month:</span>
                  <span className="font-mono font-semibold">
                    ${costBreakdown.vip.costPerMonth}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending ({queueData.pending.length})
          </TabsTrigger>
          <TabsTrigger value="processing">
            Processing ({queueData.processing.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({queueData.completed.length})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Failed ({queueData.failed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          <AnimatePresence>
            {queueData.pending.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                  No pending jobs
                </CardContent>
              </Card>
            ) : (
              queueData.pending.map(renderJobCard)
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4 mt-4">
          <AnimatePresence>
            {queueData.processing.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                  No jobs currently processing
                </CardContent>
              </Card>
            ) : (
              queueData.processing.map(renderJobCard)
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          <AnimatePresence>
            {queueData.completed.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                  No completed jobs yet
                </CardContent>
              </Card>
            ) : (
              queueData.completed.slice(0, 20).map(renderJobCard)
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4 mt-4">
          <AnimatePresence>
            {queueData.failed.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 text-green-500 mr-2" />
                  No failed jobs - great!
                </CardContent>
              </Card>
            ) : (
              queueData.failed.map(renderJobCard)
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}
