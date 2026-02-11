/**
 * Symbol Detail Modal
 * Full view of a symbol with nurturing actions and AI guidance
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Droplets, Sparkles, Leaf, Flower2, Apple, Sprout, 
  Edit3, Trash2, X, Loader2, MessageCircle, GitBranch,
  Calendar, TrendingUp, Heart, RefreshCw
} from 'lucide-react'
import type { DreamSymbol, SymbolGrowthPhase, ArchetypeCategory } from '../types/symbolica'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ScrollArea } from './ui/scroll-area'
import { toast } from 'sonner'
import { SymbolicGuide } from '../utils/symbolicGuide'

interface SymbolDetailModalProps {
  symbol: DreamSymbol | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (symbol: DreamSymbol) => void
  onDelete: (symbolId: string) => void
  userId: string
}

const GROWTH_PHASE_CONFIG: Record<SymbolGrowthPhase, {
  icon: React.ReactNode
  label: string
  color: string
  bgGradient: string
}> = {
  seed: {
    icon: <Sprout className="h-6 w-6" />,
    label: 'Seed',
    color: 'text-amber-600',
    bgGradient: 'from-amber-50 to-amber-100'
  },
  sprout: {
    icon: <Leaf className="h-6 w-6" />,
    label: 'Sprout',
    color: 'text-lime-600',
    bgGradient: 'from-lime-50 to-lime-100'
  },
  bloom: {
    icon: <Flower2 className="h-6 w-6" />,
    label: 'Bloom',
    color: 'text-pink-600',
    bgGradient: 'from-pink-50 to-pink-100'
  },
  flourish: {
    icon: <Sparkles className="h-6 w-6" />,
    label: 'Flourish',
    color: 'text-purple-600',
    bgGradient: 'from-purple-50 to-purple-100'
  },
  harvest: {
    icon: <Apple className="h-6 w-6" />,
    label: 'Harvest',
    color: 'text-rose-600',
    bgGradient: 'from-rose-50 to-rose-100'
  }
}

const ARCHETYPE_INFO: Record<ArchetypeCategory, { label: string; emoji: string; description: string }> = {
  the_self: { label: 'The Self', emoji: '🪞', description: 'Wholeness, completion, integration' },
  the_shadow: { label: 'The Shadow', emoji: '🌑', description: 'Hidden aspects, repressed parts' },
  anima_animus: { label: 'Anima/Animus', emoji: '💫', description: 'Soul connection, opposite energy' },
  wise_elder: { label: 'Wise Elder', emoji: '🦉', description: 'Guidance, wisdom, mentorship' },
  the_trickster: { label: 'The Trickster', emoji: '🃏', description: 'Change, disruption, awakening' },
  the_hero: { label: 'The Hero', emoji: '⚔️', description: 'Quest, challenge, growth' },
  mother_father: { label: 'Parent', emoji: '🏛️', description: 'Authority, nurturing, foundation' },
  the_child: { label: 'The Child', emoji: '✨', description: 'New beginnings, innocence, wonder' },
  unknown: { label: 'Unknown', emoji: '❓', description: 'Awaiting classification' }
}

export function SymbolDetailModal({ 
  symbol, 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete,
  userId 
}: SymbolDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [personalMeaning, setPersonalMeaning] = useState(symbol?.personalMeaning || '')
  const [aiGuidance, setAiGuidance] = useState<string | null>(null)
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false)
  const [isWatering, setIsWatering] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  if (!symbol) return null

  const phaseConfig = GROWTH_PHASE_CONFIG[symbol.growthPhase]
  const archetype = ARCHETYPE_INFO[symbol.archetypeCategory]

  const handleWater = async () => {
    setIsWatering(true)
    try {
      const updated = await SymbolicGuide.waterSymbol(userId, symbol.id)
      if (updated) {
        onUpdate(updated)
        toast.success('Symbol watered! 💧', {
          description: `${symbol.symbol} has been refreshed`
        })
      }
    } catch (error) {
      toast.error('Failed to water symbol')
    } finally {
      setIsWatering(false)
    }
  }

  const handleFertilize = async () => {
    if (!personalMeaning.trim()) {
      toast.error('Please add a personal meaning')
      return
    }
    
    setIsSaving(true)
    try {
      const updated = await SymbolicGuide.fertilizeSymbol(userId, symbol.id, personalMeaning)
      if (updated) {
        onUpdate(updated)
        setIsEditing(false)
        toast.success('Personal meaning added! 🌱', {
          description: 'Your symbol is growing stronger'
        })
      }
    } catch (error) {
      toast.error('Failed to save meaning')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGetGuidance = async () => {
    setIsLoadingGuidance(true)
    try {
      if (symbol.needsWatering) {
        const guidance = await SymbolicGuide.getWateringGuidance(symbol)
        setAiGuidance(guidance)
      } else if (symbol.growthPhase === 'harvest') {
        const celebration = await SymbolicGuide.celebrateHarvest(symbol)
        setAiGuidance(celebration)
      } else {
        const interpretation = await SymbolicGuide.getSymbolInterpretation(
          symbol.symbol,
          symbol.occurrenceCount,
          symbol.contexts,
          symbol.personalMeaning
        )
        if (interpretation) {
          setAiGuidance(`**Universal Meaning**\n${interpretation.universalMeaning}\n\n**Questions to Explore**\n${interpretation.personalQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\n**Related Symbols**\n${interpretation.relatedSymbols.join(', ')}\n\n**Care Suggestion**\n${interpretation.careSuggestion}`)
        }
      }
    } catch (error) {
      toast.error('Failed to get guidance')
    } finally {
      setIsLoadingGuidance(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Remove "${symbol.symbol}" from your Symbol Orchard?`)) return
    
    try {
      await SymbolicGuide.removeSymbol(userId, symbol.id)
      onDelete(symbol.id)
      onClose()
      toast.success('Symbol removed from garden')
    } catch (error) {
      toast.error('Failed to remove symbol')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        {/* Header with gradient background */}
        <div className={`bg-gradient-to-r ${phaseConfig.bgGradient} p-6 pb-4`}>
          <DialogHeader className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  className={phaseConfig.color}
                  animate={{ 
                    rotate: symbol.growthPhase === 'bloom' ? [0, 5, -5, 0] : 0,
                    scale: symbol.growthPhase === 'harvest' ? [1, 1.1, 1] : 1
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {phaseConfig.icon}
                </motion.div>
                <div>
                  <DialogTitle className="text-2xl font-bold capitalize">
                    {symbol.symbol}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {archetype.emoji} {archetype.label}
                  </p>
                </div>
              </div>
              <Badge className={`${phaseConfig.color} bg-white/80`}>
                {phaseConfig.label}
              </Badge>
            </div>
            
            {/* Growth progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Growth Progress</span>
                <span className={phaseConfig.color}>{symbol.growthProgress}%</span>
              </div>
              <Progress value={symbol.growthProgress} className="h-2" />
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 max-h-[calc(90vh-200px)]">
          <div className="p-6 pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="meanings">Meanings</TabsTrigger>
                <TabsTrigger value="guidance">Guidance</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-2xl font-bold">{symbol.occurrenceCount}</p>
                    <p className="text-xs text-muted-foreground">Appearances</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">{formatDate(symbol.firstSeen)}</p>
                    <p className="text-xs text-muted-foreground">First Seen</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Droplets className={`h-5 w-5 mx-auto mb-1 ${
                      symbol.waterLevel >= 80 ? 'text-blue-500' : 
                      symbol.waterLevel >= 50 ? 'text-blue-400' : 
                      'text-amber-500'
                    }`} />
                    <p className="text-2xl font-bold">{symbol.waterLevel}%</p>
                    <p className="text-xs text-muted-foreground">Water Level</p>
                  </div>
                </div>

                {/* Archetype info */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <span>{archetype.emoji}</span>
                    {archetype.label} Archetype
                  </h4>
                  <p className="text-sm text-muted-foreground">{archetype.description}</p>
                </div>

                {/* Emotional valence */}
                <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Heart className={`h-5 w-5 ${
                      symbol.emotionalValence > 0.3 ? 'text-green-500' :
                      symbol.emotionalValence < -0.3 ? 'text-red-500' :
                      'text-gray-400'
                    }`} />
                    <span className="text-sm">Emotional Tone</span>
                  </div>
                  <Badge variant="outline">
                    {symbol.emotionalValence > 0.3 ? 'Positive' :
                     symbol.emotionalValence < -0.3 ? 'Challenging' :
                     'Neutral'}
                  </Badge>
                </div>

                {/* Recent contexts */}
                {symbol.contexts.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-sm">Recent Dream Contexts</h4>
                    <div className="space-y-2">
                      {symbol.contexts.slice(-3).reverse().map((ctx, i) => (
                        <div key={i} className="text-sm text-muted-foreground bg-muted/30 rounded p-2">
                          "{ctx}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Meanings Tab */}
              <TabsContent value="meanings" className="space-y-4">
                {/* Jungian meaning */}
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    Universal Meaning
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                    {symbol.jungianMeaning || 'No universal meaning recorded yet. Click "Get Guidance" to discover this symbol\'s archetypal significance.'}
                  </p>
                </div>

                <Separator />

                {/* Personal meaning */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Personal Meaning
                    </h4>
                    {!isEditing && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setPersonalMeaning(symbol.personalMeaning || '')
                          setIsEditing(true)
                        }}
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        {symbol.personalMeaning ? 'Edit' : 'Add'}
                      </Button>
                    )}
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {isEditing ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <Textarea
                          value={personalMeaning}
                          onChange={(e) => setPersonalMeaning(e.target.value)}
                          placeholder="What does this symbol mean to you personally? How does it connect to your life?"
                          rows={4}
                          className="resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleFertilize}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Sparkles className="h-4 w-4 mr-1" />
                            )}
                            Fertilize
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3"
                      >
                        {symbol.personalMeaning || 'Add your personal meaning to help this symbol grow! Your unique connection is what makes it flourish.'}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </TabsContent>

              {/* Guidance Tab */}
              <TabsContent value="guidance" className="space-y-4">
                {!aiGuidance ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h4 className="font-medium mb-2">Get Symbol Guidance</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      {symbol.needsWatering 
                        ? 'This symbol needs watering. Get guidance on how to reconnect with it.'
                        : symbol.growthPhase === 'harvest'
                          ? 'This symbol has reached maturity! Celebrate your deep understanding.'
                          : 'Ask the Symbolic Guide for deeper insights about this symbol.'}
                    </p>
                    <Button onClick={handleGetGuidance} disabled={isLoadingGuidance}>
                      {isLoadingGuidance ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      {symbol.needsWatering ? 'Get Watering Guidance' : 
                       symbol.growthPhase === 'harvest' ? 'Celebrate Harvest' : 
                       'Get Guidance'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        Symbolic Guide
                      </h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAiGuidance(null)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        New Guidance
                      </Button>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-lg p-4 prose prose-sm max-w-none">
                      {aiGuidance.split('\n').map((line, i) => {
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <h5 key={i} className="font-semibold mt-3 mb-1">{line.replace(/\*\*/g, '')}</h5>
                        }
                        return line ? <p key={i} className="text-sm text-muted-foreground mb-1">{line}</p> : null
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="border-t p-4 flex items-center justify-between bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleWater}
              disabled={isWatering}
            >
              {isWatering ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Droplets className="h-4 w-4 mr-1" />
              )}
              Water
            </Button>
            <Button size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SymbolDetailModal
