/**
 * Reflection Journal Component
 * Dashboard for ReflectAI sessions and history
 */

import { useState, useEffect } from 'react'
import { MessageCircle, Plus, Archive, Sparkles, Flame, BarChart3 } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { ReflectAICreditIndicator } from './ReflectAICreditIndicator'
import { ReflectAIChat } from './ReflectAIChat'
import { ReflectionStreakIndicator } from './ReflectionStreakIndicator'
import { JournalExportButton } from './JournalExportButton'
import { ReflectionAnalyticsDashboard } from './ReflectionAnalyticsDashboard'
import { ReflectAIOfflineIndicator } from './ReflectAIOfflineIndicator'
import { toast } from 'sonner'
import type { SubscriptionTier } from '../types/subscription'
import type { ReflectionSession } from '../types/reflectAI'
import { blink } from '../blink/client'

interface ReflectionJournalProps {
  userId: string
  tier: SubscriptionTier
  dreamId?: string
  sessionId?: string
  dreamTitle?: string
  initialView?: 'list' | 'chat' | 'detail' | 'analytics'
}

type ViewMode = 'list' | 'chat' | 'detail' | 'analytics'

export function ReflectionJournal({
  userId,
  tier,
  dreamId,
  sessionId,
  dreamTitle,
  initialView = 'list'
}: ReflectionJournalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialView)
  const [sessions, setSessions] = useState<ReflectionSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ReflectionSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [reflectionPrompts, setReflectionPrompts] = useState<string>('')
  const [dreamContext, setDreamContext] = useState<{
    title?: string
    description?: string
    interpretation?: string
    guidance?: string
    symbols?: string
    emotionalThemes?: string
    lifeConnections?: string
    tags?: string[]
  } | null>(null)

  // Fetch user's reflection sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true)
        const results = await blink.db.reflectionSessions.list({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          limit: 50
        })

        setSessions(results as ReflectionSession[])
      } catch (error) {
        console.error('Error fetching reflection sessions:', error)
        toast.error('Failed to load reflection history')
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [userId, refreshKey])

  const handleSessionCreated = (sessionId: string) => {
    setRefreshKey(prev => prev + 1)
  }

  const handleArchiveSession = async (sessionId: string) => {
    try {
      await blink.db.reflectionSessions.update(sessionId, {
        updatedAt: new Date().toISOString()
      })
      toast.success('Session archived')
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Error archiving session:', error)
      toast.error('Failed to archive session')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // ✅ FIXED: useEffect moved to top level (was inside conditional render - React hooks violation)
  // Get reflection prompts and dream context from sessionStorage
  useEffect(() => {
    // Only run when in chat view
    if (viewMode !== 'chat') return

    // Check for full dream context from DreamInterpretationResults
    const storedContext = sessionStorage.getItem('dreamReflectionContext')
    if (storedContext) {
      try {
        const parsedContext = JSON.parse(storedContext)
        setDreamContext(parsedContext)
        console.log('📖 Loaded dream context for ReflectAI:', parsedContext)
        // Clear after loading to avoid stale data
        sessionStorage.removeItem('dreamReflectionContext')
      } catch (error) {
        console.warn('Could not parse dream context:', error)
      }
    }

    // Fallback: check for old reflection prompts format
    const stored = sessionStorage.getItem('dreamReflectionPrompts')
    if (stored) {
      setReflectionPrompts(stored)
    }
    
    // If we have dream context via URL params, fetch from DB
    if (dreamId && sessionId) {
      const initializeSession = async () => {
        try {
          const dreams = await blink.db.dreams.list({ where: { id: dreamId } })
          const dreamData = dreams[0]
          if (dreamData && dreamData.interpretation) {
            const { parseInterpretation, EnhancedParsedInterpretation } = await import('../utils/interpretationParser')
            const parsed = parseInterpretation(dreamData.interpretation) as any
            
            // Set full dream context for AI analysis
            setDreamContext({
              title: dreamData.title,
              description: dreamData.description,
              interpretation: dreamData.interpretation,
              guidance: parsed.guidanceContent || parsed.guidance,
              symbols: parsed.keySymbols?.join(', ') || '',
              emotionalThemes: parsed.emotionalThemes || '',
              lifeConnections: parsed.lifeConnections || '',
              tags: (dreamData as any).tags ? JSON.parse((dreamData as any).tags) : []
            })
            
            if (parsed.reflectionPrompts && parsed.reflectionPrompts.length > 0) {
              setReflectionPrompts(parsed.reflectionPrompts.join('\n'))
            }
          }
        } catch (error) {
          console.error('Error loading dream context:', error)
        }
      }
      initializeSession()
    }
  }, [viewMode, dreamId, sessionId])

  // Analytics view
  if (viewMode === 'analytics') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Reflection Analytics
            </h2>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setViewMode('list')}
            className="border-primary/20 hover:bg-primary/10 hover:border-primary/40"
          >
            Back to Journal
          </Button>
        </div>

        <ReflectionAnalyticsDashboard userId={userId} />
      </div>
    )
  }

  // Chat view
  if (viewMode === 'chat') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Start Reflection Session
            </h2>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setViewMode('list')}
            className="border-primary/20 hover:bg-primary/10 hover:border-primary/40"
          >
            Back to Sessions
          </Button>
        </div>

        <ReflectAIChat
          userId={userId}
          tier={tier}
          dreamId={dreamId || dreamContext?.title ? 'context-dream' : undefined}
          dreamTitle={dreamContext?.title || dreamTitle}
          dreamDescription={dreamContext?.description}
          dreamGuidance={dreamContext?.guidance}
          dreamInterpretation={dreamContext?.interpretation}
          dreamSymbols={dreamContext?.tags || (dreamContext?.symbols ? dreamContext.symbols.split(', ') : undefined)}
          sessionType={dreamId || dreamContext ? 'dream_reflection' : 'free_journaling'}
          reflectionPrompts={reflectionPrompts}
          onSessionCreated={handleSessionCreated}
        />
      </div>
    )
  }

  // List view (default)
  return (
    <div className="space-y-6">
      {/* Header with Dreamcatcher theming */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
            <img src="/logo_new.png" alt="Dreams" className="w-6 h-6 opacity-70" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Reflection Journal
          </h1>
        </div>
        <p className="text-muted-foreground">
          Explore your dreams through AI-guided reflection and journaling
        </p>
      </div>

      {/* Offline Indicator */}
      <ReflectAIOfflineIndicator
        userId={userId}
        onSyncComplete={() => setRefreshKey(prev => prev + 1)}
      />

      {/* Streak Indicator */}
      <ReflectionStreakIndicator
        userId={userId}
        showInsights={true}
      />

      {/* Credit Indicator */}
      <ReflectAICreditIndicator
        userId={userId}
        tier={tier}
        onCreditsUpdated={() => setRefreshKey(prev => prev + 1)}
      />

      {/* Action Buttons Row */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={() => setViewMode('chat')}
          size="lg"
          className="flex-1 min-w-48 gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
        >
          <Plus className="w-4 h-4" />
          Start New Reflection Session
        </Button>
        <Button
          onClick={() => setViewMode('analytics')}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Analytics
        </Button>
        <JournalExportButton
          userId={userId}
          variant="outline"
          size="lg"
        />
      </div>

      {/* Session History */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary/70" />
          <h2 className="text-xl font-semibold">Recent Sessions</h2>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse border-primary/10">
                <CardContent className="h-20" />
              </Card>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="p-8 text-center border-primary/20 bg-gradient-to-br from-secondary/50 to-primary/5">
            <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground">
              No reflection sessions yet. Start your first session to begin exploring your dreams.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {sessions.map(session => (
              <Card 
                key={session.id} 
                className="hover:bg-gradient-to-r hover:from-secondary/50 hover:to-primary/5 cursor-pointer transition-all duration-300 border-primary/10 hover:border-primary/30 hover:shadow-md hover:shadow-primary/10"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold capitalize truncate">
                          {session.sessionType.replace(/_/g, ' ')}
                        </h3>
                        {session.dreamId && (
                          <span className="text-xs bg-gradient-to-r from-primary/20 to-accent/20 text-primary px-2 py-1 rounded-full border border-primary/20">
                            Dream
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {session.messageCount} messages •{' '}
                        {formatDate(session.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-primary/10 hover:text-primary"
                        onClick={() => {
                          setSelectedSession(session)
                          setViewMode('detail')
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleArchiveSession(session.id)}
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info Section - Dreamcatcher styled */}
      <Card className="bg-gradient-to-br from-primary/5 via-secondary/50 to-accent/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">How ReflectAI Works</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
              <span className="text-primary font-bold text-xs">1</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Share Your Experience</p>
              <p className="text-muted-foreground">
                Describe your dream or share what's on your mind
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
              <span className="text-primary font-bold text-xs">2</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Guided Reflection</p>
              <p className="text-muted-foreground">
                AI asks thoughtful questions to help you explore deeper
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20">
              <span className="text-primary font-bold text-xs">3</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Self-Discovery</p>
              <p className="text-muted-foreground">
                Uncover patterns and insights from your dreams over time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
