/**
 * Symbol Orchard Component
 * The main garden view where users explore and nurture their dream symbols
 */

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Leaf, Droplets, Sparkles, Search, Filter, Plus,
  TreeDeciduous, Flower2, Apple, Sprout, RefreshCw,
  TrendingUp, Calendar, Heart, Loader2, AlertCircle,
  ChevronDown, X, Lock, Share2, Download
} from 'lucide-react'
import type { DreamSymbol, SymbolGrowthPhase, ArchetypeCategory, GardenStats } from '../types/symbolica'
import { SymbolicaShareButton, ShareGardenStatsButton } from './SymbolicaShareButton'
import { SymbolicaExportButton } from './SymbolicaExportButton'
import { SymbolicaOfflineIndicator, SymbolicaOfflineStatusBadge } from './SymbolicaOfflineIndicator'
import { saveOfflineSymbols, type OfflineSymbol } from '../utils/symbolicaOffline'
import { SymbolicGuide } from '../utils/symbolicGuide'
import { getSymbolicaAIAccessStatus, canPerformSymbolicaAction, deductSymbolicaAICredit } from '../utils/symbolicaAICredits'
import { canAccessSymbolicaAI, type SubscriptionTier } from '../config/tierCapabilities'
import { SymbolCard } from './SymbolCard'
import { SymbolDetailModal } from './SymbolDetailModal'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu'
import { toast } from 'sonner'

interface SymbolOrchardProps {
  userId: string
  tier: SubscriptionTier
  onUpgradeClick?: () => void
}

const ARCHETYPE_OPTIONS: { value: ArchetypeCategory | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'All Archetypes', emoji: '🌳' },
  { value: 'the_self', label: 'The Self', emoji: '🪞' },
  { value: 'the_shadow', label: 'The Shadow', emoji: '🌑' },
  { value: 'anima_animus', label: 'Anima/Animus', emoji: '💫' },
  { value: 'wise_elder', label: 'Wise Elder', emoji: '🦉' },
  { value: 'the_trickster', label: 'The Trickster', emoji: '🃏' },
  { value: 'the_hero', label: 'The Hero', emoji: '⚔️' },
  { value: 'mother_father', label: 'Parent', emoji: '🏛️' },
  { value: 'the_child', label: 'The Child', emoji: '✨' }
]

const GROWTH_PHASE_OPTIONS: { value: SymbolGrowthPhase | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Phases', icon: <TreeDeciduous className="h-4 w-4" /> },
  { value: 'seed', label: 'Seeds', icon: <Sprout className="h-4 w-4" /> },
  { value: 'sprout', label: 'Sprouts', icon: <Leaf className="h-4 w-4" /> },
  { value: 'bloom', label: 'Blooms', icon: <Flower2 className="h-4 w-4" /> },
  { value: 'flourish', label: 'Flourishing', icon: <Sparkles className="h-4 w-4" /> },
  { value: 'harvest', label: 'Harvest', icon: <Apple className="h-4 w-4" /> }
]

export function SymbolOrchard({ userId, tier, onUpgradeClick }: SymbolOrchardProps) {
  const [symbols, setSymbols] = useState<DreamSymbol[]>([])
  const [stats, setStats] = useState<GardenStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSymbol, setSelectedSymbol] = useState<DreamSymbol | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [archetypeFilter, setArchetypeFilter] = useState<ArchetypeCategory | 'all'>('all')
  const [phaseFilter, setPhaseFilter] = useState<SymbolGrowthPhase | 'all'>('all')
  const [showNeedsWatering, setShowNeedsWatering] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'most_seen' | 'growth' | 'name'>('recent')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [gardenAnalysis, setGardenAnalysis] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [creditsRemaining, setCreditsRemaining] = useState<number | undefined>()

  // Check access
  const hasAccess = canAccessSymbolicaAI(tier)

  // Load symbols
  useEffect(() => {
    if (hasAccess) {
      loadSymbols()
      loadCredits()
    } else {
      setIsLoading(false)
    }
  }, [userId, hasAccess])

  const loadCredits = async () => {
    try {
      const status = await getSymbolicaAIAccessStatus(userId, tier)
      setCreditsRemaining(status.creditsRemaining)
    } catch (error) {
      console.error('Failed to load credits:', error)
    }
  }

  const loadSymbols = async () => {
    setIsLoading(true)
    try {
      const [allSymbols, gardenStats] = await Promise.all([
        SymbolicGuide.getAllSymbols(userId),
        SymbolicGuide.getGardenStats(userId)
      ])
      setSymbols(allSymbols)
      setStats(gardenStats)
      
      // Cache symbols for offline access
      if (allSymbols.length > 0) {
        const offlineSymbols: OfflineSymbol[] = allSymbols.map(s => ({
          id: s.id,
          userId: s.userId,
          symbol: s.symbol,
          archetypeCategory: s.archetypeCategory,
          jungianMeaning: s.jungianMeaning,
          personalMeaning: s.personalMeaning,
          occurrenceCount: s.occurrenceCount,
          contexts: s.contexts,
          emotionalValence: s.emotionalValence,
          firstSeen: s.firstSeen,
          lastSeen: s.lastSeen,
          growthPhase: s.growthPhase,
          growthProgress: s.growthProgress,
          waterLevel: s.waterLevel,
          needsWatering: s.needsWatering,
          synced: true,
          updatedAt: s.updatedAt
        }))
        await saveOfflineSymbols(offlineSymbols)
      }
    } catch (error) {
      console.error('Failed to load symbols:', error)
      toast.error('Failed to load your Symbol Orchard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadSymbols()
    setIsRefreshing(false)
    toast.success('Garden refreshed')
  }

  const handleWaterSymbol = async (symbol: DreamSymbol) => {
    try {
      const updated = await SymbolicGuide.waterSymbol(userId, symbol.id)
      if (updated) {
        setSymbols(prev => prev.map(s => s.id === updated.id ? updated : s))
        toast.success(`Watered ${symbol.symbol}! 💧`)
      }
    } catch (error) {
      toast.error('Failed to water symbol')
    }
  }

  const handleSymbolUpdate = (updatedSymbol: DreamSymbol) => {
    setSymbols(prev => prev.map(s => s.id === updatedSymbol.id ? updatedSymbol : s))
    setSelectedSymbol(updatedSymbol)
    // Reload stats
    SymbolicGuide.getGardenStats(userId).then(setStats)
  }

  const handleSymbolDelete = (symbolId: string) => {
    setSymbols(prev => prev.filter(s => s.id !== symbolId))
    // Reload stats
    SymbolicGuide.getGardenStats(userId).then(setStats)
  }

  const handleAnalyzeGarden = async () => {
    const canPerform = await canPerformSymbolicaAction(userId, tier)
    if (!canPerform.allowed) {
      toast.error(canPerform.reason)
      return
    }

    setIsAnalyzing(true)
    try {
      const analysis = await SymbolicGuide.getGardenPatternAnalysis(userId)
      setGardenAnalysis(analysis)
      await deductSymbolicaAICredit(userId, tier)
      loadCredits()
    } catch (error) {
      toast.error('Failed to analyze garden')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Filtered and sorted symbols
  const filteredSymbols = useMemo(() => {
    let result = [...symbols]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(s => 
        s.symbol.toLowerCase().includes(query) ||
        s.jungianMeaning.toLowerCase().includes(query) ||
        s.personalMeaning.toLowerCase().includes(query)
      )
    }

    // Archetype filter
    if (archetypeFilter !== 'all') {
      result = result.filter(s => s.archetypeCategory === archetypeFilter)
    }

    // Phase filter
    if (phaseFilter !== 'all') {
      result = result.filter(s => s.growthPhase === phaseFilter)
    }

    // Needs watering filter
    if (showNeedsWatering) {
      result = result.filter(s => s.needsWatering)
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.firstSeen).getTime() - new Date(b.firstSeen).getTime())
        break
      case 'most_seen':
        result.sort((a, b) => b.occurrenceCount - a.occurrenceCount)
        break
      case 'growth':
        result.sort((a, b) => b.growthProgress - a.growthProgress)
        break
      case 'name':
        result.sort((a, b) => a.symbol.localeCompare(b.symbol))
        break
      default: // recent
        result.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
    }

    return result
  }, [symbols, searchQuery, archetypeFilter, phaseFilter, showNeedsWatering, sortBy])

  // Render locked state for non-Premium users
  if (!hasAccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <Card className="max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-10 w-10 text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Symbol Orchard</h2>
            <p className="text-muted-foreground mb-6">
              Grow and nurture your personal dream symbol garden. Track recurring symbols, discover their meanings, and watch your understanding flourish.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span>Automatic symbol extraction from dreams</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Leaf className="h-4 w-4 text-green-500" />
                <span>Watch symbols grow through 5 phases</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 text-pink-500" />
                <span>Add personal meanings and connections</span>
              </div>
            </div>
            <Separator className="my-6" />
            <p className="text-sm text-muted-foreground mb-4">
              Available on Premium ($19.99/mo) and VIP ($29.99/mo)
            </p>
            {onUpgradeClick && (
              <Button onClick={onUpgradeClick} className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Unlock Symbol Orchard
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your Symbol Orchard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Offline Indicator */}
      <SymbolicaOfflineIndicator userId={userId} onSyncComplete={loadSymbols} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TreeDeciduous className="h-8 w-8 text-green-600" />
            Symbol Orchard
            <SymbolicaOfflineStatusBadge />
          </h1>
          <p className="text-muted-foreground mt-1">
            Your personal garden of dream symbols
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {tier === 'premium' && creditsRemaining !== undefined && (
            <Badge variant="outline" className="text-purple-600">
              {creditsRemaining} credits left
            </Badge>
          )}
          {stats && stats.totalSymbols > 0 && (
            <>
              <ShareGardenStatsButton stats={stats} variant="outline" size="sm" />
              <SymbolicaExportButton 
                userId={userId} 
                stats={stats} 
                symbolCount={stats.totalSymbols}
                variant="outline" 
                size="sm" 
              />
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Garden Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4 text-center">
              <TreeDeciduous className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-700">{stats.totalSymbols}</p>
              <p className="text-xs text-green-600">Total Symbols</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-4 text-center">
              <Sprout className="h-6 w-6 mx-auto mb-2 text-amber-600" />
              <p className="text-2xl font-bold text-amber-700">{stats.seedCount + stats.sproutCount}</p>
              <p className="text-xs text-amber-600">Seeds & Sprouts</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
            <CardContent className="p-4 text-center">
              <Flower2 className="h-6 w-6 mx-auto mb-2 text-pink-600" />
              <p className="text-2xl font-bold text-pink-700">{stats.bloomCount + stats.flourishCount}</p>
              <p className="text-xs text-pink-600">Blooming</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-rose-50 to-red-50 border-rose-200">
            <CardContent className="p-4 text-center">
              <Apple className="h-6 w-6 mx-auto mb-2 text-rose-600" />
              <p className="text-2xl font-bold text-rose-700">{stats.harvestCount}</p>
              <p className="text-xs text-rose-600">Harvested</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <Droplets className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-700">{stats.needsWateringCount}</p>
              <p className="text-xs text-blue-600">Needs Water</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <Heart className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-purple-700">{stats.gardenHealth}%</p>
              <p className="text-xs text-purple-600">Garden Health</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Garden Analysis */}
      {stats && stats.totalSymbols >= 3 && (
        <Card className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-purple-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Garden Insights
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAnalyzeGarden}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                {gardenAnalysis ? 'Re-analyze' : 'Analyze Garden'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {gardenAnalysis ? (
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {gardenAnalysis.split('\n').map((line, i) => (
                  <p key={i} className={line.startsWith('**') ? 'font-semibold text-foreground' : ''}>
                    {line.replace(/\*\*/g, '')}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click "Analyze Garden" to receive personalized insights about your symbol patterns and growth opportunities.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={archetypeFilter} onValueChange={(v) => setArchetypeFilter(v as ArchetypeCategory | 'all')}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Archetype" />
          </SelectTrigger>
          <SelectContent>
            {ARCHETYPE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  <span>{opt.emoji}</span>
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={phaseFilter} onValueChange={(v) => setPhaseFilter(v as SymbolGrowthPhase | 'all')}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Growth Phase" />
          </SelectTrigger>
          <SelectContent>
            {GROWTH_PHASE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  {opt.icon}
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              More
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filters</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showNeedsWatering}
              onCheckedChange={setShowNeedsWatering}
            >
              <Droplets className="h-4 w-4 mr-2" />
              Needs Watering
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={sortBy === 'recent'}
              onCheckedChange={() => setSortBy('recent')}
            >
              Most Recent
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortBy === 'most_seen'}
              onCheckedChange={() => setSortBy('most_seen')}
            >
              Most Seen
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortBy === 'growth'}
              onCheckedChange={() => setSortBy('growth')}
            >
              Growth Progress
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortBy === 'name'}
              onCheckedChange={() => setSortBy('name')}
            >
              Name (A-Z)
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active filters */}
      {(searchQuery || archetypeFilter !== 'all' || phaseFilter !== 'all' || showNeedsWatering) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
            </Badge>
          )}
          {archetypeFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {ARCHETYPE_OPTIONS.find(o => o.value === archetypeFilter)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setArchetypeFilter('all')} />
            </Badge>
          )}
          {phaseFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {GROWTH_PHASE_OPTIONS.find(o => o.value === phaseFilter)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setPhaseFilter('all')} />
            </Badge>
          )}
          {showNeedsWatering && (
            <Badge variant="secondary" className="gap-1">
              Needs Watering
              <X className="h-3 w-3 cursor-pointer" onClick={() => setShowNeedsWatering(false)} />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setArchetypeFilter('all')
              setPhaseFilter('all')
              setShowNeedsWatering(false)
            }}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Symbol Grid */}
      {filteredSymbols.length === 0 ? (
        <Card className="p-12 text-center">
          {symbols.length === 0 ? (
            <>
              <TreeDeciduous className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-medium mb-2">Your garden awaits</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start logging dreams to plant symbols in your orchard. Each dream will automatically extract key symbols that grow with your understanding.
              </p>
            </>
          ) : (
            <>
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-medium mb-2">No symbols match your filters</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </>
          )}
        </Card>
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
        >
          <AnimatePresence mode="popLayout">
            {filteredSymbols.map(symbol => (
              <motion.div
                key={symbol.id}
                layout
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  visible: { opacity: 1, scale: 1 }
                }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <SymbolCard
                  symbol={symbol}
                  onClick={setSelectedSymbol}
                  onWater={handleWaterSymbol}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Recently Discovered */}
      {stats && stats.recentlyDiscovered.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Recently Discovered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.recentlyDiscovered.map((sym, i) => (
                <Badge key={i} variant="secondary" className="capitalize">
                  {sym}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Symbol Detail Modal */}
      <SymbolDetailModal
        symbol={selectedSymbol}
        isOpen={!!selectedSymbol}
        onClose={() => setSelectedSymbol(null)}
        onUpdate={handleSymbolUpdate}
        onDelete={handleSymbolDelete}
        userId={userId}
      />
    </div>
  )
}

export default SymbolOrchard
