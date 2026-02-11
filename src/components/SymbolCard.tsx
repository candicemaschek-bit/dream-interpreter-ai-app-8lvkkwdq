/**
 * Symbol Card Component
 * Displays a dream symbol as a growing plant in the Symbol Orchard
 */

import { motion } from 'framer-motion'
import { Droplets, Sparkles, Leaf, Flower2, Apple, Sprout, Info, Share2 } from 'lucide-react'
import type { DreamSymbol, SymbolGrowthPhase, ArchetypeCategory } from '../types/symbolica'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { SymbolicaShareButton } from './SymbolicaShareButton'

interface SymbolCardProps {
  symbol: DreamSymbol
  onClick: (symbol: DreamSymbol) => void
  onWater?: (symbol: DreamSymbol) => void
  compact?: boolean
}

const GROWTH_PHASE_CONFIG: Record<SymbolGrowthPhase, {
  icon: React.ReactNode
  label: string
  color: string
  bgColor: string
  borderColor: string
  description: string
}> = {
  seed: {
    icon: <Sprout className="h-4 w-4" />,
    label: 'Seed',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'Newly discovered symbol'
  },
  sprout: {
    icon: <Leaf className="h-4 w-4" />,
    label: 'Sprout',
    color: 'text-lime-700',
    bgColor: 'bg-lime-50',
    borderColor: 'border-lime-200',
    description: 'Beginning to grow'
  },
  bloom: {
    icon: <Flower2 className="h-4 w-4" />,
    label: 'Bloom',
    color: 'text-pink-700',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    description: 'Actively flourishing'
  },
  flourish: {
    icon: <Sparkles className="h-4 w-4" />,
    label: 'Flourish',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Deep connection established'
  },
  harvest: {
    icon: <Apple className="h-4 w-4" />,
    label: 'Harvest',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    description: 'Fully matured wisdom'
  }
}

const ARCHETYPE_LABELS: Record<ArchetypeCategory, { label: string; emoji: string }> = {
  the_self: { label: 'The Self', emoji: '🪞' },
  the_shadow: { label: 'Shadow', emoji: '🌑' },
  anima_animus: { label: 'Anima/Animus', emoji: '💫' },
  wise_elder: { label: 'Wise Elder', emoji: '🦉' },
  the_trickster: { label: 'Trickster', emoji: '🃏' },
  the_hero: { label: 'Hero', emoji: '⚔️' },
  mother_father: { label: 'Parent', emoji: '🏛️' },
  the_child: { label: 'Child', emoji: '✨' },
  unknown: { label: 'Unknown', emoji: '❓' }
}

export function SymbolCard({ symbol, onClick, onWater, compact = false }: SymbolCardProps) {
  const phaseConfig = GROWTH_PHASE_CONFIG[symbol.growthPhase]
  const archetype = ARCHETYPE_LABELS[symbol.archetypeCategory]
  
  // Calculate water level visual
  const waterColor = symbol.waterLevel >= 80 
    ? 'text-blue-500' 
    : symbol.waterLevel >= 50 
      ? 'text-blue-400' 
      : 'text-amber-500'
  
  const handleWaterClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onWater?.(symbol)
  }

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onClick(symbol)}
        className="cursor-pointer"
      >
        <Card className={`${phaseConfig.bgColor} ${phaseConfig.borderColor} border hover:shadow-md transition-shadow`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={phaseConfig.color}>{phaseConfig.icon}</span>
                <span className="font-medium text-foreground truncate capitalize">
                  {symbol.symbol}
                </span>
              </div>
              {symbol.needsWatering && (
                <Droplets className="h-4 w-4 text-amber-500 shrink-0" />
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <TooltipProvider>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onClick(symbol)}
        className="cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`${phaseConfig.bgColor} ${phaseConfig.borderColor} border-2 hover:shadow-lg transition-all relative overflow-hidden`}>
          {/* Growth phase indicator bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${phaseConfig.color.replace('text-', 'bg-').replace('-700', '-400')}`} />
          
          <CardContent className="p-4 pt-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ 
                    scale: symbol.needsWatering ? [1, 1.2, 1] : 1,
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: symbol.needsWatering ? Infinity : 0,
                    repeatType: 'loop'
                  }}
                  className={phaseConfig.color}
                >
                  {phaseConfig.icon}
                </motion.div>
                <h3 className="font-semibold text-foreground capitalize text-lg">
                  {symbol.symbol}
                </h3>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className={`${phaseConfig.color} ${phaseConfig.bgColor} border-current shrink-0`}>
                    {phaseConfig.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{phaseConfig.description}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            {/* Archetype badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">{archetype.emoji}</span>
              <span className="text-xs text-muted-foreground">{archetype.label}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {symbol.occurrenceCount} dream{symbol.occurrenceCount > 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Meaning preview */}
            {(symbol.personalMeaning || symbol.jungianMeaning) && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {symbol.personalMeaning || symbol.jungianMeaning}
              </p>
            )}
            
            {/* Growth progress */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Growth</span>
                <span className={phaseConfig.color}>{symbol.growthProgress}%</span>
              </div>
              <Progress 
                value={symbol.growthProgress} 
                className="h-2"
              />
            </div>
            
            {/* Water level & action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Droplets className={`h-4 w-4 ${waterColor}`} />
                <span className={`text-xs ${waterColor}`}>
                  {symbol.waterLevel >= 80 ? 'Hydrated' : symbol.waterLevel >= 50 ? 'Needs care' : 'Thirsty'}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <SymbolicaShareButton 
                  symbol={symbol} 
                  insightType="symbol" 
                  variant="ghost" 
                  size="icon"
                />
                {symbol.needsWatering && onWater && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleWaterClick}
                    className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Droplets className="h-3 w-3 mr-1" />
                    Water
                  </Button>
                )}
              </div>
            </div>
            
            {/* Emotional valence indicator */}
            {symbol.emotionalValence !== 0 && (
              <div className="mt-2 flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${
                  symbol.emotionalValence > 0.3 ? 'bg-green-400' :
                  symbol.emotionalValence < -0.3 ? 'bg-red-400' :
                  'bg-gray-400'
                }`} />
                <span className="text-xs text-muted-foreground">
                  {symbol.emotionalValence > 0.3 ? 'Positive' :
                   symbol.emotionalValence < -0.3 ? 'Challenging' :
                   'Neutral'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  )
}

/**
 * Mini symbol badge for inline display
 */
export function SymbolBadge({ symbol, onClick }: { symbol: DreamSymbol; onClick?: () => void }) {
  const phaseConfig = GROWTH_PHASE_CONFIG[symbol.growthPhase]
  
  return (
    <Badge 
      variant="outline" 
      className={`${phaseConfig.color} ${phaseConfig.bgColor} border-current cursor-pointer hover:opacity-80 transition-opacity`}
      onClick={onClick}
    >
      {phaseConfig.icon}
      <span className="ml-1 capitalize">{symbol.symbol}</span>
    </Badge>
  )
}

export default SymbolCard
