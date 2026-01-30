import { useEffect, useState } from 'react'
import { blink } from '../blink/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, BarChart3, Coins } from 'lucide-react'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface TelemetryEvent {
  id: string
  userId: string
  eventType: string
  context: string
  metadata: string
  createdAt: string
}

interface ApiUsageLog {
  id: string
  userId: string
  operationType: string
  modelUsed: string
  tokensUsed: number
  estimatedCostUsd: number
  success: number
  createdAt: string
}

export function AdminAuthTelemetryMonitor() {
  const [events, setEvents] = useState<TelemetryEvent[]>([])
  const [apiLogs, setApiLogs] = useState<ApiUsageLog[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalFailures: 0,
    refreshFailures: 0,
    expirationFailures: 0,
    reauthAttempts: 0,
    reauthSuccesses: 0,
    successRate: 0,
    totalTokens: 0,
    totalCost: 0
  })

  const loadTelemetry = async () => {
    setLoading(true)
    try {
      // Fetch auth telemetry
      const telemetryEvents = await blink.db.authTelemetry.list({
        limit: 100,
        orderBy: { createdAt: 'desc' }
      })
      setEvents(telemetryEvents)

      // Fetch API usage logs
      const usageLogs = await blink.db.apiUsageLogs.list({
        limit: 100,
        orderBy: { createdAt: 'desc' }
      })
      setApiLogs(usageLogs)

      // Calculate stats
      const failures = telemetryEvents.filter((e: any) => e.eventType === 'token_failure')
      const refreshFails = failures.filter((e: any) => {
        try {
          const meta = JSON.parse(e.metadata || '{}')
          return meta.errorType === 'token_refresh_failed'
        } catch { return false }
      }).length

      const expirationFails = failures.filter((e: any) => {
        try {
          const meta = JSON.parse(e.metadata || '{}')
          return meta.errorType === 'auth_expired'
        } catch { return false }
      }).length

      const reauths = telemetryEvents.filter((e: any) => e.eventType === 'reauth_attempt')
      const successes = telemetryEvents.filter((e: any) => e.eventType === 'reauth_success')

      // API Stats
      const totalTokens = usageLogs.reduce((acc, log) => acc + (log.tokensUsed || 0), 0)
      const totalCost = usageLogs.reduce((acc, log) => acc + (log.estimatedCostUsd || 0), 0)

      setStats({
        totalFailures: failures.length,
        refreshFailures: refreshFails,
        expirationFailures: expirationFails,
        reauthAttempts: reauths.length,
        reauthSuccesses: successes.length,
        successRate: reauths.length > 0 
          ? Math.round((successes.length / reauths.length) * 100) 
          : 0,
        totalTokens,
        totalCost
      })
    } catch (error) {
      console.error('Failed to load telemetry:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTelemetry()
  }, [])

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'token_failure':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'reauth_attempt':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'reauth_success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const formatMetadata = (metadata: string) => {
    try {
      const parsed = JSON.parse(metadata || '{}')
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    } catch {
      return metadata
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Token & Auth Telemetry</h2>
          <p className="text-muted-foreground">Monitor system tokens, failures, and flow performance</p>
        </div>
        <Button onClick={loadTelemetry} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Sync Data
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auth Failures</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFailures}</div>
            <p className="text-xs text-muted-foreground">
              {stats.refreshFailures} refresh | {stats.expirationFailures} expire
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reauth Flows</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.reauthSuccesses} of {stats.reauthAttempts} successful
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50/50 dark:bg-purple-950/10 border-purple-100 dark:border-purple-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LLM Tokens</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last 100 operations
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50/50 dark:bg-green-950/10 border-green-100 dark:border-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Cost</CardTitle>
            <Coins className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              Platform processing cost
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="auth" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="auth">Auth Events</TabsTrigger>
          <TabsTrigger value="api">API Usage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="auth" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Auth Events</CardTitle>
              <CardDescription>Real-time monitoring of authentication health</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                      <CheckCircle className="h-8 w-8 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">
                        No telemetry events found. System is healthy.
                      </p>
                    </div>
                  ) : (
                    events.map((event, index) => (
                      <div key={event.id} className="group">
                        <div className="flex items-start gap-4 p-2 rounded-lg transition-colors hover:bg-muted/50">
                          <div className="mt-1">
                            {getEventIcon(event.eventType)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  event.eventType === 'token_failure' ? 'destructive' :
                                  event.eventType === 'reauth_success' ? 'default' :
                                  'secondary'
                                } className="text-[10px] uppercase tracking-wider">
                                  {event.eventType.replace('_', ' ')}
                                </Badge>
                                <span className="text-sm font-semibold text-primary">{event.context}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {new Date(event.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {formatMetadata(event.metadata)}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="font-mono bg-muted px-1 rounded">UID: {event.userId.slice(0, 8)}</span>
                              <span>•</span>
                              <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        {index < events.length - 1 && <Separator className="mt-2" />}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>API Usage Logs</CardTitle>
              <CardDescription>Detailed token consumption and operation costs</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {apiLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                      <BarChart3 className="h-8 w-8 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">
                        No API usage logs found yet.
                      </p>
                    </div>
                  ) : (
                    apiLogs.map((log, index) => (
                      <div key={log.id} className="group">
                        <div className="flex items-start gap-4 p-2 rounded-lg transition-colors hover:bg-muted/50">
                          <div className="mt-1">
                            <BarChart3 className={`h-4 w-4 ${log.success ? 'text-purple-500' : 'text-red-500'}`} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold capitalize">{log.operationType.replace('_', ' ')}</span>
                                <Badge variant="outline" className="text-[10px]">
                                  {log.modelUsed || 'default'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="text-xs font-bold">{log.tokensUsed?.toLocaleString() || 0} tokens</div>
                                  <div className="text-[10px] text-muted-foreground">${log.estimatedCostUsd?.toFixed(4) || '0.0000'}</div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                              <span className="font-mono">UID: {log.userId.slice(0, 8)}</span>
                              <span>•</span>
                              <span>{new Date(log.createdAt).toLocaleString()}</span>
                              {log.success === 0 && (
                                <Badge variant="destructive" className="h-4 text-[9px]">FAILED</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {index < apiLogs.length - 1 && <Separator className="mt-2" />}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
