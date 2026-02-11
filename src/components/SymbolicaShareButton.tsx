/**
 * Symbolica Share Button Component
 * Allows users to share symbol insights via various channels
 * Privacy-first: Only shares sanitized insights, not raw personal data
 */

import { useState } from 'react'
import { Share2, Copy, Twitter, Link2, Check, Loader2, MessageCircle } from 'lucide-react'
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
import type { DreamSymbol, GardenStats } from '../types/symbolica'

interface SymbolicaShareButtonProps {
  symbol?: DreamSymbol
  gardenStats?: GardenStats
  insightType?: 'symbol' | 'garden' | 'milestone'
  milestoneText?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function SymbolicaShareButton({
  symbol,
  gardenStats,
  insightType = 'symbol',
  milestoneText,
  variant = 'ghost',
  size = 'sm'
}: SymbolicaShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [customText, setCustomText] = useState('')
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Generate a privacy-safe shareable insight
  const generateShareableInsight = async (): Promise<string> => {
    setGenerating(true)
    try {
      let prompt = ''
      
      if (insightType === 'symbol' && symbol) {
        prompt = `Transform this dream symbol insight into a universal, inspirational message that could resonate with others while protecting privacy. Remove all personal details.

Symbol: "${symbol.symbol}"
Universal meaning: "${symbol.jungianMeaning}"
Growth phase: ${symbol.growthPhase}
Times appeared: ${symbol.occurrenceCount}

Requirements:
- Create a thoughtful, philosophical message about dream symbols
- Make it universally relatable
- Remove any identifying information
- Keep it under 280 characters
- Add an uplifting or insightful tone
- Do NOT include hashtags

Return ONLY the transformed quote, nothing else.`
      } else if (insightType === 'garden' && gardenStats) {
        prompt = `Create an inspirational message about dream symbol exploration and personal growth. Use these stats for inspiration but don't include specific numbers:

Total symbols discovered: ${gardenStats.totalSymbols}
Garden health: ${gardenStats.gardenHealth}%

Requirements:
- Create a thoughtful message about the journey of self-discovery through dreams
- Make it universally relatable
- Keep it under 280 characters
- Add an uplifting tone
- Do NOT include hashtags

Return ONLY the transformed quote, nothing else.`
      } else if (insightType === 'milestone' && milestoneText) {
        prompt = `Transform this personal milestone into an inspirational message:

Milestone: "${milestoneText}"

Requirements:
- Make it a universal message about dream exploration
- Remove specific details
- Keep it under 280 characters
- Do NOT include hashtags

Return ONLY the transformed quote.`
      }

      if (!prompt) return getDefaultShareText()

      const response = await blink.ai.generateText({
        prompt,
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
    if (insightType === 'symbol' && symbol) {
      return `Exploring the symbol "${symbol.symbol}" in my dreams has led to fascinating insights. Every dream symbol is a seed of self-discovery. 🌱🌙 #DreamSymbols #SelfDiscovery`
    }
    if (insightType === 'garden' && gardenStats) {
      return `Growing my personal Symbol Orchard—discovering the recurring themes and archetypes in my dreams. The unconscious speaks in symbols! 🌳💫 #DreamJournal #Symbolism`
    }
    if (insightType === 'milestone') {
      return milestoneText || `Another milestone in my dream symbol journey! Each symbol nurtured brings deeper self-understanding. 🌸 #DreamExploration`
    }
    return `Cultivating my inner garden of dream symbols. Each one tells a story. 🌙✨ #SymbolOrchard`
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
          title: 'Symbol Orchard Insight',
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
            <Share2 className="w-5 h-5 text-green-500" />
            Share Your Insight
          </DialogTitle>
          <DialogDescription>
            Share your symbol journey while keeping personal details private.
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
              <Link2 className="w-5 h-5 text-green-500" />
              <span className="text-xs">Share</span>
            </Button>
          </div>

          {/* Privacy Notice */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">🔒 Privacy First</p>
            <p>Your personal symbol meanings and dream details are never shared. Only the generic insight text above will be shared.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Quick share button for symbol milestones
 */
export function ShareSymbolMilestoneButton({
  symbol,
  milestone,
  variant = 'outline',
  size = 'sm'
}: {
  symbol: DreamSymbol
  milestone: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}) {
  const milestoneText = `My dream symbol "${symbol.symbol}" has ${milestone}! The journey of understanding our dreams continues. 🌳✨`

  return (
    <SymbolicaShareButton
      symbol={symbol}
      insightType="milestone"
      milestoneText={milestoneText}
      variant={variant}
      size={size}
    />
  )
}

/**
 * Garden stats share button
 */
export function ShareGardenStatsButton({
  stats,
  variant = 'outline',
  size = 'sm'
}: {
  stats: GardenStats
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}) {
  return (
    <SymbolicaShareButton
      gardenStats={stats}
      insightType="garden"
      variant={variant}
      size={size}
    />
  )
}
