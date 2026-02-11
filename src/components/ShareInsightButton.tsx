/**
 * Share Insight Button Component
 * Allows users to share reflection insights via various channels
 * Privacy-first: Only shares sanitized insights, not raw conversation data
 * 
 * Phase 4 Implementation
 */

import { useState } from 'react'
import { Share2, Copy, Twitter, MessageCircle, Link2, Check, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/dialog'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner'
import { blink } from '../blink/client'

interface ShareInsightButtonProps {
  insightText: string
  insightType?: 'reflection' | 'pattern' | 'streak'
  streakDays?: number
  emotionalThemes?: string[]
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ShareInsightButton({
  insightText,
  insightType = 'reflection',
  streakDays,
  emotionalThemes,
  variant = 'ghost',
  size = 'sm'
}: ShareInsightButtonProps) {
  const [open, setOpen] = useState(false)
  const [customText, setCustomText] = useState('')
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Generate a privacy-safe shareable insight
  const generateShareableInsight = async (): Promise<string> => {
    setGenerating(true)
    try {
      // Use AI to create a generic, privacy-safe version of the insight
      const response = await blink.ai.generateText({
        prompt: `Transform this personal reflection insight into a generic, inspirational quote that could resonate with others while protecting privacy. Remove all personal details, names, or specific situations.

Original insight: "${insightText}"

Requirements:
- Keep the emotional essence and wisdom
- Make it universally relatable  
- Remove any identifying information
- Keep it under 280 characters for social sharing
- Add an uplifting or thoughtful tone
- Do NOT include hashtags

Return ONLY the transformed quote, nothing else.`,
        maxTokens: 100
      })

      return response?.text?.trim() || getDefaultShareText()
    } catch (error) {
      console.error('Error generating shareable insight:', error)
      return getDefaultShareText()
    } finally {
      setGenerating(false)
    }
  }

  const getDefaultShareText = (): string => {
    if (streakDays && streakDays > 0) {
      return `I've been on a ${streakDays}-day reflection journey, discovering insights about my dreams and inner world. 🌙✨ #DreamReflection #SelfDiscovery`
    }
    if (emotionalThemes && emotionalThemes.length > 0) {
      return `Taking time to reflect on my emotions and dreams has been transformative. The journey inward reveals so much. 🌙 #Mindfulness #DreamJournal`
    }
    return `Exploring the landscape of my dreams through reflection. Every insight is a step toward self-understanding. 🌙 #DreamExploration`
  }

  const handleGenerateQuote = async () => {
    const quote = await generateShareableInsight()
    setCustomText(quote)
  }

  const handleCopyToClipboard = async () => {
    const textToCopy = customText || getDefaultShareText()
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Could not copy to clipboard')
    }
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(customText || getDefaultShareText())
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'width=550,height=420')
  }

  const handleShareNative = async () => {
    const textToShare = customText || getDefaultShareText()
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Dream Reflection Insight',
          text: textToShare,
        })
        toast.success('Shared successfully!')
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          toast.error('Could not share')
        }
      }
    } else {
      handleCopyToClipboard()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-1.5">
          <Share2 className="w-3.5 h-3.5" />
          {size !== 'icon' && <span>Share</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Your Insight
          </DialogTitle>
          <DialogDescription>
            Share your reflection journey while keeping personal details private.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Generate Quote Button */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleGenerateQuote}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating shareable quote...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4" />
                Generate Privacy-Safe Quote
              </>
            )}
          </Button>

          {/* Custom Text Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Share Text</label>
            <Textarea
              value={customText || getDefaultShareText()}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Write your own or generate a quote..."
              className="min-h-24 resize-none"
              maxLength={280}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Edit to personalize</span>
              <span>{(customText || getDefaultShareText()).length}/280</span>
            </div>
          </div>

          {/* Share Options */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="flex flex-col gap-1 h-auto py-3"
              onClick={handleCopyToClipboard}
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
              <span className="text-xs">Copy</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col gap-1 h-auto py-3"
              onClick={handleShareTwitter}
            >
              <Twitter className="w-5 h-5 text-blue-400" />
              <span className="text-xs">Twitter</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col gap-1 h-auto py-3"
              onClick={handleShareNative}
            >
              <Link2 className="w-5 h-5 text-primary" />
              <span className="text-xs">Share</span>
            </Button>
          </div>

          {/* Privacy Notice */}
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">🔒 Privacy First</p>
            <p>Your personal reflection conversations are never shared. Only the generic insight text above will be shared.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Quick share button for streak milestones
 */
export function ShareStreakButton({
  streakDays,
  variant = 'outline',
  size = 'sm'
}: {
  streakDays: number
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}) {
  const shareText = `🔥 ${streakDays}-day reflection streak! Taking time each day to explore my dreams and inner world has been transformative. 🌙 #DreamJournal #SelfDiscovery`

  return (
    <ShareInsightButton
      insightText={shareText}
      insightType="streak"
      streakDays={streakDays}
      variant={variant}
      size={size}
    />
  )
}
