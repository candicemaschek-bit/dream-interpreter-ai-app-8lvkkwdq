/**
 * ReflectAI Chat Component
 * Main interface for dream reflection conversations
 */

import { useState, useRef, useEffect } from 'react'
import { SendHorizontal, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Card } from './ui/card'
import { toast } from 'sonner'
import type { SubscriptionTier } from '../types/subscription'
import type { ReflectionMessage, ReflectionSession } from '../types/reflectAI'
import {
  canSendReflectionMessage,
  deductReflectAICredit,
  getReflectAICredits
} from '../utils/reflectAICredits'
import { logReflectAIUsage, estimateReflectAICost } from '../utils/costTracking'
import { blink } from '../blink/client'
import { checkMessageSafety } from '../utils/reflectAISafety'

interface ReflectAIChatProps {
  userId: string
  tier: SubscriptionTier
  dreamId?: string
  dreamTitle?: string
  dreamDescription?: string
  dreamGuidance?: string
  dreamInterpretation?: string // Full dream interpretation for AI analysis
  dreamSymbols?: string[] // Key symbols from dream
  sessionType?: 'dream_reflection' | 'free_journaling' | 'pattern_exploration'
  reflectionPrompts?: string // Reflection prompts from dream interpretation (should be formatted as bullet points or questions)
  onSessionCreated?: (sessionId: string) => void
}

const REFLECT_AI_SYSTEM_PROMPT = `You are Reflect AI, a compassionate dream reflection companion. Your role is to help users transform dream insights into practical self-understanding through guided reflection.

CRITICAL LANGUAGE GUIDELINES - ALWAYS FOLLOW:
- Treat ALL interpretations as POSSIBILITIES, never absolute truths
- Use tentative language: "It could suggest...", "Some people associate this symbol with...", "You might consider..."
- NEVER claim spiritual authority, psychic insight, or absolute symbolic interpretation
- Avoid deterministic statements: "This means...", "This is definitely...", "This proves..."
- Acknowledge that dream meaning is deeply personal and subjective
- Respect that the dreamer is the ultimate authority on what their dreams mean to them

YOUR PRIMARY MISSION:
- Help users EXPLORE how dream themes MIGHT connect to waking-life emotions, stressors, relationships, fears, and desires
- Ask questions about waking experiences that COULD influence their dream content
- Invite users to consider how symbols MIGHT relate to their personal experiences
- Encourage noticing POTENTIAL parallels between dream world and daily life patterns
- Transform dream exploration into practical self-understanding (not definitive "answers" or predictions)

REFLECTION APPROACH:
- Start by analyzing the dream interpretation to generate personalized reflection prompts
- Ask ONE thoughtful, open-ended question at a time
- Focus on POSSIBLE connections between dream symbols and waking life experiences
- When discussing symbols, ask how they MIGHT relate to current situations or relationships
- Help users explore patterns: "Does this emotion/symbol remind you of anything in your daily life?"
- NEVER provide definitive interpretations; ALWAYS invite exploration and self-discovery
- Be warm, non-judgmental, and encouraging
- Keep responses concise but meaningful (2-3 sentences + 1 reflective question)

EXAMPLE REFLECTION QUESTIONS (note the tentative language):
- "The [symbol] in your dream... when have you felt something similar in your waking life recently?"
- "This dream seems to touch on [theme]. What current situation might be bringing up these feelings?"
- "You mentioned [emotion] in the dream. How does that emotion show up in your relationships or work?"
- "If [symbol] could speak, what do you think it might tell you about [life area]?"
- "Some people associate [symbol] with [common meaning] - does that resonate with you, or does it suggest something different?"
- "It's interesting that [element] appeared in your dream. What might that mean to you personally?"

PHRASES TO USE:
✓ "It could suggest..."
✓ "Some people associate this symbol with..."
✓ "You might consider whether..."
✓ "This could potentially reflect..."
✓ "In your experience, this might relate to..."
✓ "One possibility is..."

PHRASES TO AVOID:
✗ "This means..."
✗ "This definitely shows..."
✗ "This is a sign that..."
✗ "Your dream is telling you..."
✗ "The universe is saying..."
✗ "This proves that..."

Remember: Dream reflection is about self-discovery, NOT fortune-telling or claiming special insight. You facilitate exploration - the dreamer determines their own meaning.`

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function ReflectAIChat({
  userId,
  tier,
  dreamId,
  dreamTitle,
  dreamDescription,
  dreamGuidance,
  dreamInterpretation,
  dreamSymbols,
  sessionType = 'dream_reflection',
  reflectionPrompts,
  onSessionCreated
}: ReflectAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]) // Store generated prompts separately
  const [showPrompts, setShowPrompts] = useState(true) // Show prompts until user clicks one

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Check access first
        const access = await canSendReflectionMessage(userId, tier)
        if (!access.allowed) {
          console.warn('ReflectAI access denied:', access.reason)
          toast.error(access.reason || 'Unable to access ReflectAI')
          return
        }
        
        console.log('✅ ReflectAI access granted:', { tier, creditsRemaining: access.creditsRemaining })
        setCreditsRemaining(access.creditsRemaining)

        // Create session
        const now = new Date().toISOString()
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        const session = await blink.db.reflectionSessions.create({
          id: newSessionId,
          userId,
          dreamId,
          sessionType,
          creditsConsumed: 0,
          messageCount: 0,
          createdAt: now,
          updatedAt: now
        })

        setSessionId(newSessionId)
        onSessionCreated?.(newSessionId)

        // Generate personalized reflection prompts by analyzing the dream interpretation
        let generatedReflectionPrompts: string[] = []
        
        // Use AI to generate reflection prompts based on dream interpretation
        if (dreamInterpretation && dreamInterpretation.trim()) {
          try {
            const reflectionResponse = await blink.ai.generateText({
              prompt: `Analyze this dream interpretation and generate exactly 3 personalized reflection questions that help the dreamer EXPLORE how their dream MIGHT connect to waking life.

CRITICAL GUIDELINES:
- Use tentative, invitational language - NEVER claim definitive meaning
- Frame questions as explorations, not assertions
- Use phrases like "might connect to", "could reflect", "may relate to"
- Acknowledge the dreamer is the authority on their own experience
- Do NOT claim spiritual authority or absolute symbolic interpretation

Dream Title: ${dreamTitle || 'Untitled Dream'}
Dream Description: ${dreamDescription || 'Not provided'}
Key Symbols: ${dreamSymbols?.join(', ') || 'Not specified'}

Dream Interpretation:
${dreamInterpretation}

Generate exactly 3 thoughtful reflection questions that:
1. Invite the dreamer to consider how a specific symbol or theme MIGHT connect to current waking-life situations
2. Ask them to explore what unresolved conflict, hope, or emotional need the dream COULD be processing
3. Encourage noticing POTENTIAL parallels between dream imagery and daily life patterns

Format: Return ONLY the 3 questions, one per line, numbered as "1. ", "2. ", "3. " (no bullets). Make them personal, specific to THIS dream, focused on self-exploration, and use tentative/invitational language.`,
              maxTokens: 300,
              temperature: 0.7
            })
            
            if (reflectionResponse?.text) {
              generatedReflectionPrompts = reflectionResponse.text
                .split('\n')
                .filter(line => line.trim().match(/^\d+\./)) // Match "1. ", "2. ", etc.
                .map(line => line.replace(/^\d+\.\s*/, '').trim())
                .filter(q => q.length > 0)
                .slice(0, 3) // Ensure exactly 3
              
              console.log('✨ Generated exactly 3 reflection prompts:', generatedReflectionPrompts)
              
              // Store generated prompts in state for display
              setGeneratedPrompts(generatedReflectionPrompts)
            }
          } catch (error) {
            console.warn('Could not generate reflection prompts:', error)
          }
        }

        // Build initial greeting with AI-generated reflection prompts
        let greeting = `Welcome to your personal reflection space. I'm here to help you connect your dream insights to your waking life. 🌙`
        
        // Add dream summary if provided
        if (dreamTitle) {
          greeting += `\n\n📖 **Your Dream:** "${dreamTitle}"`
          if (dreamDescription) {
            // Add brief excerpt from description
            const excerpt = dreamDescription.length > 150 
              ? dreamDescription.substring(0, 150).trim() + '...' 
              : dreamDescription
            greeting += `\n${excerpt}`
          }
        }
        
        // Present AI-generated reflection prompts (or fall back to provided ones)
        const promptsToUse = generatedPrompts.length > 0 
          ? generatedPrompts 
          : (reflectionPrompts ? reflectionPrompts.split('\n').filter(p => p.trim()) : [])
        
        if (promptsToUse.length > 0) {
          greeting += `\n\n✨ **Let's explore how this dream connects to your life:**`
          promptsToUse.forEach((prompt, index) => {
            greeting += `\n${index + 1}. ${prompt}`
          })
          greeting += `\n\n**Which question speaks to you most?** Or share what's on your mind, and we'll explore together.`
        } else if (dreamSymbols && dreamSymbols.length > 0) {
          greeting += `\n\n✨ **Key symbols from your dream:** ${dreamSymbols.join(', ')}`
          greeting += `\n\nThese symbols often carry meaning from our waking life. When you think about "${dreamSymbols[0]}", what current situation or feeling comes to mind?`
        } else if (dreamGuidance) {
          greeting += `\n\n💡 **From your interpretation:**\n${dreamGuidance.substring(0, 200)}...`
          greeting += `\n\nLet's explore how you can apply these insights. What resonates most with where you are in life right now?`
        } else {
          greeting += `\n\n${dreamId ? "I've reviewed your dream interpretation. What aspect would you like to explore deeper - the emotions, the symbols, or how it connects to your current life?" : 'Feel free to share what\'s on your mind, and I\'ll help you explore it thoughtfully.'}`
        }

        setMessages([{ role: 'assistant', content: greeting, timestamp: new Date() }])
      } catch (error) {
        console.error('Error initializing ReflectAI session:', error)
        toast.error('Failed to initialize ReflectAI session')
      }
    }

    initializeSession()
  }, [userId, tier, dreamId, sessionType, reflectionPrompts, onSessionCreated, generatedPrompts]) // Added generatedPrompts to dependency array

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt)
    setShowPrompts(false) // Hide prompts once one is selected
    // Optionally, you could auto-send the prompt here if desired
    // handleSendMessage(new Event('submit') as React.FormEvent)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim() || !sessionId) return

    // Check access before sending
    const access = await canSendReflectionMessage(userId, tier)
    if (!access.allowed) {
      toast.error(access.reason || 'Unable to send message')
      return
    }

    const userMessage = inputValue.trim()
    setInputValue('')
    setLoading(true)

    try {
      // Check message safety (rate limiting and crisis detection)
      const safetyCheck = await checkMessageSafety({
        userId,
        sessionId,
        message: userMessage
      })

      // If crisis detected, show ONLY support message and PAUSE conversation
      // This is a FREE safety intervention - no credits consumed
      if (safetyCheck.crisisDetected) {
        // Add user message to UI first
        const userMsg: Message = {
          role: 'user',
          content: userMessage,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, userMsg])
        
        // Show ONLY the support message - do NOT generate AI response
        // This is FREE - no credit deduction for safety interventions
        if (safetyCheck.supportMessage) {
          const supportMsg: Message = {
            role: 'assistant',
            content: safetyCheck.supportMessage,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, supportMsg])
        }
        
        // Show toast notification about paused conversation
        toast.info(safetyCheck.reason || 'Conversation paused - please see support resources', {
          duration: 8000
        })
        
        setLoading(false)
        return // PAUSE - do not continue with AI generation
      }

      // Standard rate limit check (non-crisis)
      if (!safetyCheck.safe) {
        toast.error(safetyCheck.reason || 'Unable to send message')
        setInputValue(userMessage) // Restore input
        setLoading(false)
        return
      }

      // Add user message to UI
      const userMsg: Message = {
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMsg])

      // Estimate tokens for cost tracking
      const inputTokens = Math.ceil(userMessage.length / 4)
      const estimatedOutputTokens = 150

      // Generate AI response with system prompt and chat history
      // NOTE: Cannot use both 'prompt' and 'messages' - use messages array only
      const response = await blink.ai.generateText({
        messages: [
          { role: 'system' as const, content: REFLECT_AI_SYSTEM_PROMPT },
          ...messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          })),
          { role: 'user' as const, content: userMessage }
        ],
        maxTokens: 300
      })
      
      // Extract text from response (handles both text and steps formats)
      let aiResponse = ''
      if (response?.text) {
        aiResponse = response.text
      } else if ((response as any)?.steps && Array.isArray((response as any).steps)) {
        const steps = (response as any).steps
        const lastStep = steps[steps.length - 1]
        aiResponse = lastStep?.text || ''
      }

      // Calculate actual costs
      const outputTokens = Math.ceil(aiResponse.length / 4)
      const estimatedCost = estimateReflectAICost(inputTokens, outputTokens)

      // Deduct credit
      const deductSuccess = await deductReflectAICredit(userId, tier)

      // Log usage
      await logReflectAIUsage({
        userId,
        sessionId,
        tokensUsed: inputTokens + outputTokens,
        estimatedCostUsd: estimatedCost,
        messageRole: 'assistant'
      })

      // Add assistant response
      const assistantMsg: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMsg])

      // Update session
      const messageCount = messages.length + 2
      await blink.db.reflectionSessions.update(sessionId, {
        messageCount,
        updatedAt: new Date().toISOString()
      })

      // Update credits display
      if (tier === 'premium') {
        const credits = await getReflectAICredits(userId, tier)
        if (credits) {
          setCreditsRemaining(credits.creditsRemaining)
        }
      }

      // Show warning if running low
      if (creditsRemaining && creditsRemaining <= 5 && tier === 'premium') {
        toast.warning('Running low on ReflectAI credits')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message. Please try again.')
      // Remove the user message we added
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto space-y-4">
      {/* Credit indicator */}
      {creditsRemaining !== null && tier === 'premium' && (
        <div className="text-xs text-muted-foreground text-center">
          {creditsRemaining} credits remaining this month
        </div>
      )}

      {/* Initial greeting and prompts */}
      {showPrompts && messages.length === 1 && messages[0].role === 'assistant' && (
        <Card className="p-4 bg-background">
          <p className="text-sm text-muted-foreground mb-4">{messages[0].content}</p>
          {generatedPrompts.length > 0 && (
            <div>
              <p className="font-semibold mb-2">Suggested Reflections:</p>
              <div className="space-y-2">
                {generatedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt)}
                    className="text-left w-full text-sm text-primary hover:underline cursor-pointer p-2 rounded-md hover:bg-secondary/50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Messages container */}
      <Card className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </Card>

      {/* Input form */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Textarea
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Share your reflections..."
          disabled={loading}
          className="min-h-12 max-h-24 resize-none"
          onKeyDown={e => {
            if (e.key === 'Enter' && e.ctrlKey) {
              handleSendMessage(e)
            }
          }}
        />
        <Button
          type="submit"
          disabled={loading || !inputValue.trim()}
          size="icon"
          className="self-end"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <SendHorizontal className="w-4 h-4" />
          )}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground text-center">
        Press Ctrl+Enter to send
      </p>
    </div>
  )
}
