/**
 * Emotion Heatmap Visualization
 * 
 * Displays emotion patterns across time periods.
 * - X-axis: Time (days/weeks/months)
 * - Y-axis: Emotion categories
 * - Color intensity: Frequency/strength
 * 
 * Tier Access:
 * - Premium: Basic heatmap with weekly view
 * - VIP: Advanced heatmap with AI insights, monthly view, drill-down
 */

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { Skeleton } from './ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { blink } from '../blink/client'
import { format, subDays, startOfWeek, eachDayOfInterval, eachWeekOfInterval, subWeeks, subMonths, isSameDay, parseISO } from 'date-fns'
import {
  Brain,
  Calendar,
  ChartBar,
  Sparkles,
  Lock,
  TrendingUp,
  TrendingDown,
  Minus,
  Info
} from 'lucide-react'
import type { SubscriptionTier } from '../config/tierCapabilities'

// Emotion taxonomy for heatmap rows
const EMOTION_CATEGORIES = [
  { id: 'joy', label: 'Joy/Happiness', color: '#10B981', emoji: '😊' },
  { id: 'fear', label: 'Fear/Anxiety', color: '#EF4444', emoji: '😨' },
  { id: 'sadness', label: 'Sadness/Grief', color: '#3B82F6', emoji: '😢' },
  { id: 'anger', label: 'Anger/Frustration', color: '#F97316', emoji: '😠' },
  { id: 'surprise', label: 'Surprise/Wonder', color: '#8B5CF6', emoji: '😲' },
  { id: 'love', label: 'Love/Connection', color: '#EC4899', emoji: '💕' },
  { id: 'confusion', label: 'Confusion/Lost', color: '#6B7280', emoji: '😕' },
  { id: 'peace', label: 'Peace/Calm', color: '#06B6D4', emoji: '😌' },
]

// Mapping of common emotion keywords to categories
const EMOTION_KEYWORD_MAP: Record<string, string> = {
  // Joy
  happy: 'joy', happiness: 'joy', joy: 'joy', joyful: 'joy', excited: 'joy',
  thrilled: 'joy', elated: 'joy', cheerful: 'joy', delighted: 'joy',
  // Fear
  scared: 'fear', afraid: 'fear', fear: 'fear', terrified: 'fear', anxious: 'fear',
  nervous: 'fear', panic: 'fear', dread: 'fear', worried: 'fear', frightened: 'fear',
  // Sadness
  sad: 'sadness', sadness: 'sadness', grief: 'sadness', depressed: 'sadness',
  melancholy: 'sadness', sorrow: 'sadness', crying: 'sadness', tears: 'sadness',
  lonely: 'sadness', heartbroken: 'sadness',
  // Anger
  angry: 'anger', anger: 'anger', furious: 'anger', frustrated: 'anger',
  rage: 'anger', annoyed: 'anger', irritated: 'anger', mad: 'anger',
  // Surprise
  surprised: 'surprise', amazed: 'surprise', shocked: 'surprise', wonder: 'surprise',
  astonished: 'surprise', bewildered: 'surprise',
  // Love
  love: 'love', loving: 'love', loved: 'love', affection: 'love', warmth: 'love',
  intimate: 'love', connected: 'love', tender: 'love',
  // Confusion
  confused: 'confusion', lost: 'confusion', disoriented: 'confusion',
  uncertain: 'confusion', puzzled: 'confusion', bewildered: 'confusion',
  // Peace
  peaceful: 'peace', calm: 'peace', serene: 'peace', tranquil: 'peace',
  relaxed: 'peace', content: 'peace', 'at peace': 'peace',
}

interface EmotionDataPoint {
  date: string
  emotion: string
  intensity: number // 0-1
  dreamId: string
  dreamTitle: string
}

interface HeatmapCell {
  date: string
  emotion: string
  intensity: number // 0-1 average
  count: number
  dreams: Array<{ id: string; title: string }>
}

interface EmotionHeatmapProps {
  userId: string
  tier: SubscriptionTier
  onUpgradeClick?: () => void
}

type TimeRange = '7d' | '14d' | '30d' | '90d'

export function EmotionHeatmap({ userId, tier, onUpgradeClick }: EmotionHeatmapProps) {
  const [emotionData, setEmotionData] = useState<EmotionDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('14d')
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null)
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [loadingInsight, setLoadingInsight] = useState(false)

  const isPremium = tier === 'premium' || tier === 'vip'
  const isVIP = tier === 'vip'

  // Determine allowed time ranges based on tier
  const allowedRanges: TimeRange[] = useMemo(() => {
    if (isVIP) return ['7d', '14d', '30d', '90d']
    if (isPremium) return ['7d', '14d', '30d']
    return ['7d', '14d']
  }, [isPremium, isVIP])

  // Load emotion data from dreams
  useEffect(() => {
    const loadEmotionData = async () => {
      if (!isPremium) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // Get dreams from the time range
        const endDate = new Date()
        const startDate = timeRange === '7d' 
          ? subDays(endDate, 7)
          : timeRange === '14d'
          ? subDays(endDate, 14)
          : timeRange === '30d'
          ? subDays(endDate, 30)
          : subDays(endDate, 90)

        const dreams = await blink.db.dreams.list({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          limit: 200
        })

        // Filter dreams by date and extract emotions
        const emotionPoints: EmotionDataPoint[] = []
        
        for (const dream of dreams) {
          const dreamDate = parseISO(dream.createdAt)
          if (dreamDate < startDate || dreamDate > endDate) continue

          // Extract emotions from interpretation and description
          const textToAnalyze = `${dream.description || ''} ${dream.interpretation || ''}`.toLowerCase()
          
          for (const [keyword, category] of Object.entries(EMOTION_KEYWORD_MAP)) {
            if (textToAnalyze.includes(keyword)) {
              // Calculate intensity based on keyword frequency
              const regex = new RegExp(keyword, 'gi')
              const matches = textToAnalyze.match(regex)
              const intensity = Math.min((matches?.length || 1) * 0.2, 1)

              emotionPoints.push({
                date: dream.createdAt.split('T')[0],
                emotion: category,
                intensity,
                dreamId: dream.id,
                dreamTitle: dream.title
              })
            }
          }
        }

        setEmotionData(emotionPoints)
      } catch (error) {
        console.error('Error loading emotion data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEmotionData()
  }, [userId, timeRange, isPremium])

  // Generate heatmap data
  const heatmapData = useMemo(() => {
    const endDate = new Date()
    const startDate = timeRange === '7d' 
      ? subDays(endDate, 7)
      : timeRange === '14d'
      ? subDays(endDate, 14)
      : timeRange === '30d'
      ? subDays(endDate, 30)
      : subDays(endDate, 90)

    const days = eachDayOfInterval({ start: startDate, end: endDate })
    
    const cells: Map<string, HeatmapCell> = new Map()

    // Initialize cells
    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd')
      for (const emotion of EMOTION_CATEGORIES) {
        const key = `${dateStr}-${emotion.id}`
        cells.set(key, {
          date: dateStr,
          emotion: emotion.id,
          intensity: 0,
          count: 0,
          dreams: []
        })
      }
    }

    // Aggregate emotion data
    for (const point of emotionData) {
      const key = `${point.date}-${point.emotion}`
      const cell = cells.get(key)
      if (cell) {
        cell.count++
        cell.intensity = (cell.intensity * (cell.count - 1) + point.intensity) / cell.count
        if (!cell.dreams.find(d => d.id === point.dreamId)) {
          cell.dreams.push({ id: point.dreamId, title: point.dreamTitle })
        }
      }
    }

    return {
      days,
      cells,
      emotions: EMOTION_CATEGORIES
    }
  }, [emotionData, timeRange])

  // Generate AI insight for VIP users
  const generateAIInsight = async () => {
    if (!isVIP) return

    setLoadingInsight(true)
    try {
      // Summarize emotion patterns
      const emotionSummary: Record<string, number> = {}
      for (const point of emotionData) {
        emotionSummary[point.emotion] = (emotionSummary[point.emotion] || 0) + 1
      }

      const sortedEmotions = Object.entries(emotionSummary)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

      const prompt = `Analyze this dream emotion pattern from the past ${timeRange}:

Top emotions detected:
${sortedEmotions.map(([emotion, count]) => `- ${emotion}: ${count} occurrences`).join('\n')}

Total dreams analyzed: ${new Set(emotionData.map(p => p.dreamId)).size}

Provide a brief (2-3 sentences) psychological insight about what this emotional pattern might suggest about the dreamer's subconscious state or current life situation. Be supportive and constructive.`

      const response = await blink.ai.generateText({
        prompt,
        model: 'gpt-4.1-mini',
        maxTokens: 200
      })

      if (response?.text) {
        setAiInsight(response.text)
      }
    } catch (error) {
      console.error('Error generating AI insight:', error)
    } finally {
      setLoadingInsight(false)
    }
  }

  // Get trend for emotion category
  const getEmotionTrend = (emotionId: string) => {
    const midpoint = Math.floor(emotionData.length / 2)
    const firstHalf = emotionData.slice(0, midpoint).filter(p => p.emotion === emotionId)
    const secondHalf = emotionData.slice(midpoint).filter(p => p.emotion === emotionId)

    const firstAvg = firstHalf.length > 0 
      ? firstHalf.reduce((sum, p) => sum + p.intensity, 0) / firstHalf.length 
      : 0
    const secondAvg = secondHalf.length > 0 
      ? secondHalf.reduce((sum, p) => sum + p.intensity, 0) / secondHalf.length 
      : 0

    const diff = secondAvg - firstAvg
    if (diff > 0.1) return 'up'
    if (diff < -0.1) return 'down'
    return 'stable'
  }

  // Render locked state for non-premium users
  if (!isPremium) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="py-12 text-center">
          <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Emotion Heatmap</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Visualize your emotional patterns across dreams with our interactive heatmap.
            Available for Premium and VIP members.
          </p>
          <Button onClick={onUpgradeClick}>
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  const { days, cells, emotions } = heatmapData

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ChartBar className="w-5 h-5 text-primary" />
              Emotion Heatmap
              {isVIP && <Badge className="ml-2 bg-amber-500">VIP</Badge>}
            </CardTitle>
            <CardDescription>
              Track emotional patterns across your dreams over time
            </CardDescription>
          </div>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList>
              {allowedRanges.map(range => (
                <TabsTrigger key={range} value={range}>
                  {range === '7d' ? '7D' : range === '14d' ? '2W' : range === '30d' ? '1M' : '3M'}
                </TabsTrigger>
              ))}
              {!isVIP && (
                <TabsTrigger value="90d" disabled className="opacity-50">
                  <Lock className="w-3 h-3 mr-1" />
                  3M
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <TooltipProvider>
            <div className="min-w-[600px]">
              {/* Column Headers (Dates) */}
              <div className="flex">
                <div className="w-28 flex-shrink-0" /> {/* Spacer for row labels */}
                <div className="flex-1 flex">
                  {days.filter((_, i) => timeRange === '7d' || timeRange === '14d' || i % 3 === 0).map((day, i) => (
                    <div key={i} className="flex-1 text-center text-xs text-muted-foreground pb-2">
                      {format(day, timeRange === '7d' ? 'EEE' : 'MMM d')}
                    </div>
                  ))}
                </div>
              </div>

              {/* Emotion Rows */}
              {emotions.map(emotion => {
                const trend = getEmotionTrend(emotion.id)
                return (
                  <div key={emotion.id} className="flex items-center">
                    {/* Row Label */}
                    <div className="w-28 flex-shrink-0 flex items-center gap-2 pr-2">
                      <span className="text-lg">{emotion.emoji}</span>
                      <span className="text-xs font-medium truncate">{emotion.label.split('/')[0]}</span>
                      {isVIP && (
                        <span className="ml-auto">
                          {trend === 'up' && <TrendingUp className="w-3 h-3 text-red-500" />}
                          {trend === 'down' && <TrendingDown className="w-3 h-3 text-green-500" />}
                          {trend === 'stable' && <Minus className="w-3 h-3 text-muted-foreground" />}
                        </span>
                      )}
                    </div>

                    {/* Cells */}
                    <div className="flex-1 flex gap-0.5 h-8">
                      {days.map((day, dayIndex) => {
                        const dateStr = format(day, 'yyyy-MM-dd')
                        const key = `${dateStr}-${emotion.id}`
                        const cell = cells.get(key)!
                        const hasData = cell.count > 0

                        return (
                          <Tooltip key={dayIndex}>
                            <TooltipTrigger asChild>
                              <button
                                className={`flex-1 rounded-sm transition-all hover:ring-2 hover:ring-primary/50 ${
                                  hasData ? 'cursor-pointer' : 'cursor-default'
                                }`}
                                style={{
                                  backgroundColor: hasData 
                                    ? `${emotion.color}${Math.round(cell.intensity * 255).toString(16).padStart(2, '0')}`
                                    : 'var(--muted)',
                                  opacity: hasData ? 0.3 + cell.intensity * 0.7 : 0.1
                                }}
                                onClick={() => hasData && setSelectedCell(cell)}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <p className="font-medium">{format(day, 'MMM d, yyyy')}</p>
                                <p>{emotion.label}</p>
                                {hasData ? (
                                  <>
                                    <p className="text-muted-foreground">
                                      {cell.count} dream{cell.count > 1 ? 's' : ''}
                                    </p>
                                    <p className="text-muted-foreground">
                                      Intensity: {Math.round(cell.intensity * 100)}%
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-muted-foreground">No data</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
                <span className="text-xs text-muted-foreground">Intensity:</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-sm bg-primary/10" />
                  <span className="text-xs">Low</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-sm bg-primary/40" />
                  <span className="text-xs">Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded-sm bg-primary/80" />
                  <span className="text-xs">High</span>
                </div>
              </div>
            </div>
          </TooltipProvider>
        </div>

        {/* Selected Cell Detail */}
        {selectedCell && selectedCell.count > 0 && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">
                    {emotions.find(e => e.id === selectedCell.emotion)?.emoji}{' '}
                    {emotions.find(e => e.id === selectedCell.emotion)?.label} on{' '}
                    {format(parseISO(selectedCell.date), 'MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Found in {selectedCell.count} dream{selectedCell.count > 1 ? 's' : ''}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCell(null)}>
                  ✕
                </Button>
              </div>
              <div className="mt-3 space-y-1">
                {selectedCell.dreams.slice(0, 3).map(dream => (
                  <div key={dream.id} className="text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="truncate">{dream.title}</span>
                  </div>
                ))}
                {selectedCell.dreams.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{selectedCell.dreams.length - 3} more
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* VIP AI Insight */}
        {isVIP && (
          <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold">AI Pattern Insight</span>
                  <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                    VIP
                  </Badge>
                </div>
                {!aiInsight && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={generateAIInsight}
                    disabled={loadingInsight || emotionData.length < 5}
                  >
                    {loadingInsight ? 'Analyzing...' : 'Generate Insight'}
                  </Button>
                )}
              </div>
              {aiInsight ? (
                <p className="text-sm text-muted-foreground">{aiInsight}</p>
              ) : emotionData.length < 5 ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Record at least 5 dreams to unlock AI pattern insights
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click "Generate Insight" to get AI-powered analysis of your emotional patterns
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(() => {
            const uniqueDreams = new Set(emotionData.map(p => p.dreamId)).size
            const dominantEmotion = Object.entries(
              emotionData.reduce((acc, p) => {
                acc[p.emotion] = (acc[p.emotion] || 0) + 1
                return acc
              }, {} as Record<string, number>)
            ).sort((a, b) => b[1] - a[1])[0]

            return (
              <>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{uniqueDreams}</p>
                  <p className="text-xs text-muted-foreground">Dreams Analyzed</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{emotionData.length}</p>
                  <p className="text-xs text-muted-foreground">Emotions Detected</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl">
                    {dominantEmotion 
                      ? emotions.find(e => e.id === dominantEmotion[0])?.emoji 
                      : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Dominant Emotion</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">
                    {Object.keys(
                      emotionData.reduce((acc, p) => ({ ...acc, [p.emotion]: true }), {})
                    ).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Emotion Types</p>
                </div>
              </>
            )
          })()}
        </div>
      </CardContent>
    </Card>
  )
}
