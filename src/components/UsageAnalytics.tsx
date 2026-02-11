/**
 * Usage Analytics Dashboard Component
 * Displays token/cost tracking and sustainability metrics
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Image as ImageIcon, 
  Video, 
  Sparkles,
  AlertCircle,
  Calendar,
  Loader2
} from 'lucide-react'
import { blink } from '../blink/client'
import {
  getUserMonthlyUsage,
  getUserUsageLogs,
  calculateProjectedMonthlyCost,
  getCostBreakdown,
  type MonthlySummary,
  type UsageLogEntry
} from '../utils/costTracking'

export function UsageAnalytics() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null)
  const [usageLogs, setUsageLogs] = useState<UsageLogEntry[]>([])
  const [projection, setProjection] = useState<{
    currentCost: number
    projectedCost: number
    daysElapsed: number
    daysInMonth: number
  } | null>(null)
  const [costBreakdown, setCostBreakdown] = useState<{
    imageGeneration: number
    aiInterpretation: number
    videoGeneration: number
    total: number
  } | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const user = await blink.auth.me()
      setUserId(user.id)

      // Load all analytics data in parallel
      const [summary, logs, proj, breakdown] = await Promise.all([
        getUserMonthlyUsage(user.id),
        getUserUsageLogs(user.id, { limit: 50 }),
        calculateProjectedMonthlyCost(user.id),
        getCostBreakdown(user.id)
      ])

      setMonthlySummary(summary)
      setUsageLogs(logs)
      setProjection(proj)
      setCostBreakdown(breakdown)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const currentCost = monthlySummary?.totalCostUsd || 0
  const projectedCost = projection?.projectedCost || 0
  const isOverBudget = projectedCost > 5.0 // $5 monthly budget threshold

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Usage Analytics</h2>
        <p className="text-muted-foreground mt-1">
          Monitor your API usage and cost tracking for Blink credits
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Current Month Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              {monthlySummary?.totalOperations || 0} operations
            </p>
            <Progress 
              value={(currentCost / 10) * 100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        {/* Projected Monthly Cost */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${projectedCost.toFixed(4)}
              {isOverBudget && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Over Budget
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {projection?.daysElapsed || 0} of {projection?.daysInMonth || 30} days
            </p>
          </CardContent>
        </Card>

        {/* This Month Operations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlySummary?.totalOperations || 0}
            </div>
            <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
              <span>{monthlySummary?.imageGenerations || 0} images</span>
              <span>•</span>
              <span>{monthlySummary?.aiInterpretations || 0} AI</span>
              <span>•</span>
              <span>{monthlySummary?.videoGenerations || 0} videos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown Alert */}
      {isOverBudget && (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Budget Warning</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your projected monthly cost (${projectedCost.toFixed(2)}) exceeds the recommended budget of $5.00. 
              Consider optimizing usage or upgrading your Blink plan.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detailed Breakdown */}
      <Tabs defaultValue="breakdown" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="logs">Usage Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost by Operation Type</CardTitle>
              <CardDescription>
                Breakdown of costs across different API operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Generation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Image Generation</span>
                  </div>
                  <span className="text-sm font-bold">
                    ${(costBreakdown?.imageGeneration || 0).toFixed(4)}
                  </span>
                </div>
                <Progress 
                  value={((costBreakdown?.imageGeneration || 0) / currentCost) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {monthlySummary?.imageGenerations || 0} images × $0.004/image avg
                </p>
              </div>

              {/* AI Interpretation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">AI Interpretation</span>
                  </div>
                  <span className="text-sm font-bold">
                    ${(costBreakdown?.aiInterpretation || 0).toFixed(4)}
                  </span>
                </div>
                <Progress 
                  value={((costBreakdown?.aiInterpretation || 0) / currentCost) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {monthlySummary?.aiInterpretations || 0} interpretations
                </p>
              </div>

              {/* Video Generation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Video Generation</span>
                  </div>
                  <span className="text-sm font-bold">
                    ${(costBreakdown?.videoGeneration || 0).toFixed(4)}
                  </span>
                </div>
                <Progress 
                  value={((costBreakdown?.videoGeneration || 0) / currentCost) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {monthlySummary?.videoGenerations || 0} videos × ~$0.45/video avg
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sustainability Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Sustainability Analysis</CardTitle>
              <CardDescription>
                Evaluating if current usage is sustainable at scale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Current Monthly Cost:</span>
                  <span className="font-bold">${currentCost.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Projected Monthly Cost:</span>
                  <span className="font-bold">${projectedCost.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Cost per Dream Analysis:</span>
                  <span className="font-bold">
                    ${monthlySummary?.totalOperations 
                      ? (currentCost / Math.max(monthlySummary.totalOperations / 4, 1)).toFixed(4)
                      : '0.0000'
                    }
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <p className="text-sm font-semibold">Scaling Projections:</p>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>100 users/month:</span>
                    <span className="font-medium">
                      ~${(projectedCost * 100).toFixed(2)}/month
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>1,000 users/month:</span>
                    <span className="font-medium">
                      ~${(projectedCost * 1000).toFixed(2)}/month
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>10,000 users/month:</span>
                    <span className="font-medium text-destructive">
                      ~${((projectedCost * 10000) / 1000).toFixed(1)}K/month
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm">
                    <strong>Recommendation:</strong>{' '}
                    {projectedCost < 2 ? (
                      <span className="text-green-600">
                        Usage is sustainable. Current costs are within acceptable range.
                      </span>
                    ) : projectedCost < 5 ? (
                      <span className="text-yellow-600">
                        Usage is acceptable but monitor closely. Consider optimization for scale.
                      </span>
                    ) : (
                      <span className="text-red-600">
                        Usage exceeds sustainable threshold. Implement cost optimization strategies or upgrade plan.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent API Usage</CardTitle>
              <CardDescription>
                Last 50 operations with cost tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usageLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No usage logs yet. Start interpreting dreams to see tracking data.
                  </p>
                ) : (
                  usageLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {log.operationType === 'image_generation' && (
                          <ImageIcon className="h-4 w-4 text-blue-500" />
                        )}
                        {log.operationType === 'ai_interpretation' && (
                          <Sparkles className="h-4 w-4 text-purple-500" />
                        )}
                        {log.operationType === 'video_generation' && (
                          <Video className="h-4 w-4 text-red-500" />
                        )}
                        {log.operationType === 'text_generation' && (
                          <Activity className="h-4 w-4 text-green-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {log.operationType.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()} • {log.modelUsed}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          ${log.estimatedCostUsd.toFixed(4)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.tokensUsed.toLocaleString()} tokens
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
