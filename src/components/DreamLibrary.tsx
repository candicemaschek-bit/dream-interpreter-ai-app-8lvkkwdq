import { useEffect, useState } from 'react'
import { DreamCard } from './DreamCard'
import { DreamWorldGenerator } from './DreamWorldGenerator'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Plus, Loader2, Search, X, Sparkles } from 'lucide-react'
import { blink } from '../blink/client'
import type { Dream } from '../types/dream'
import type { UserProfile } from '../types/profile'
import type { SubscriptionTier } from '../types/subscription'
import { supabaseService } from '../lib/supabaseService'
import toast from 'react-hot-toast'
import { addToQueue } from '../utils/videoQueueManager'
import { WeeklyReflectionCard } from './WeeklyReflectionCard'
import { FirstDreamCelebration } from './FirstDreamCelebration'
import { useNavigate } from 'react-router-dom'

interface DreamLibraryProps {
  onNewDream: () => void
  refreshTrigger: number
  newDreamId?: string // ID of newly created dream to auto-open
}

export function DreamLibrary({ onNewDream, refreshTrigger, newDreamId }: DreamLibraryProps) {
  const navigate = useNavigate()
  const [dreams, setDreams] = useState<Dream[]>([])
  const [filteredDreams, setFilteredDreams] = useState<Dream[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openDreamId, setOpenDreamId] = useState<string | null>(newDreamId || null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  
  // Debug logging for newDreamId prop
  console.log('📚 DreamLibrary component rendered:', { refreshTrigger, newDreamId, openDreamId })

  // Sync openDreamId when newDreamId prop changes
  useEffect(() => {
    if (newDreamId && newDreamId !== openDreamId) {
      console.log('📖 Auto-opening dream from newDreamId:', newDreamId)
      setOpenDreamId(newDreamId)
      
      // Check if this is the first dream to show celebration
      // Wait until dreams are loaded and profile is available
      if (!isLoading && userProfile && dreams.length === 1 && userProfile.subscriptionTier === 'free') {
        // We only show it once per session if it's the very first dream
        const hasShown = sessionStorage.getItem('first-dream-celebrated')
        if (!hasShown) {
          setShowCelebration(true)
          sessionStorage.setItem('first-dream-celebrated', 'true')
        }
      }
    }
  }, [newDreamId, dreams.length, userProfile, isLoading])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [showAllTags, setShowAllTags] = useState(false)
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [dreamWorldsThisMonth, setDreamWorldsThisMonth] = useState(0)
  const [activeTab, setActiveTab] = useState('dreams')
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)

  const loadDreams = async () => {
    try {
      setIsLoading(true)
      const user = await blink.auth.me()
      
      // Load user profile from Supabase
      const profile = await supabaseService.getProfile(user.id)
      if (profile) {
        setUserProfile({
          ...profile,
          age: profile.age,
          nightmareProne: profile.nightmare_prone,
          recurringDreams: profile.recurring_dreams,
          onboardingCompleted: profile.onboarding_completed,
          subscriptionTier: profile.subscription_tier
        } as any)
      }
      
      // Load dreams from Supabase
      const dreamsData = await supabaseService.getDreams(user.id)
      
      // Simple validation and parsing
      const validDreams = dreamsData.map((dream: any) => ({
        ...dream,
        tags: Array.isArray(dream.tags) ? dream.tags : (dream.tags ? JSON.parse(dream.tags) : [])
      })) as Dream[]
      
      setDreams(validDreams)
      setFilteredDreams(validDreams)
      
      // Extract all unique tags
      const tagsSet = new Set<string>()
      validDreams.forEach(dream => {
        dream.tags?.forEach(tag => tagsSet.add(tag))
      })
      setAllTags(Array.from(tagsSet).sort())
      
      // Load DreamWorlds count for this month - using Supabase
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      
      const client = supabaseService.supabase
      if (client) {
        const { data: dreamWorldsData } = await client
          .from('dream_worlds')
          .select('generated_at')
          .eq('user_id', user.id)
        
        const thisMonthCount = (dreamWorldsData || []).filter((dw: any) => {
          try {
            const generatedAt = new Date(dw.generated_at)
            return generatedAt >= new Date(monthStart)
          } catch {
            return false
          }
        }).length
        setDreamWorldsThisMonth(thisMonthCount)
      }
    } catch (error) {
      console.error('Error loading dreams:', error)
      toast.error('Failed to load dreams. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateDreamWorld = async (title: string, selectedDreamIds: string[]) => {
    try {
      const user = await blink.auth.me()
      
      const client = supabaseService.supabase
      if (!client) {
        toast.error('Video generation requires Supabase configuration')
        return
      }

      // Validate selected dreams exist in current dreams list
      const validDreamIds = selectedDreamIds.filter(id => 
        dreams.some(dream => dream.id === id)
      )
      
      if (validDreamIds.length < 2) {
        toast.error('Selected dreams are no longer available. Please refresh and try again.')
        throw new Error('Invalid dream selection')
      }
      
      // Get selected dreams for video generation
      const selectedDreams = dreams.filter(d => validDreamIds.includes(d.id))
      const firstDream = selectedDreams[0]
      
      // Create Dreamworlds record in Supabase
      const dreamWorldId = `dw_${Date.now()}`
      const { error: dwError } = await client
        .from('dream_worlds')
        .insert({
          id: dreamWorldId,
          user_id: user.id,
          title,
          description: null,
          dream_ids: JSON.stringify(validDreamIds),
          video_url: null,
          thumbnail_url: null,
          duration_seconds: 45,
          generated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (dwError) throw dwError
      
      // Automatically enqueue video generation
      setIsGeneratingVideo(true)
      try {
        // Generate comprehensive prompt for Dreamworlds
        const dreamTitles = selectedDreams.map(d => d.title).join(', ')
        const prompt = `Cinematic Dreamworlds video connecting these dream narratives: ${dreamTitles}. Create a flowing, dreamlike sequence with smooth transitions between dream elements. Use the following dream: ${firstDream.description}`
        
        const queueResult = await addToQueue({
          userId: user.id,
          dreamId: dreamWorldId,
          imageUrl: firstDream.imageUrl || '',
          prompt,
          subscriptionTier: (userProfile?.subscriptionTier || 'free') as SubscriptionTier,
          durationSeconds: 45
        })
        
        if (queueResult.success) {
          toast.success('Dreamworlds created! Video is being generated...')
          setDreamWorldsThisMonth(prev => prev + 1)
        } else {
          toast.error(queueResult.error || 'Failed to queue video generation')
        }
      } catch (videoError) {
        console.error('Error queuing video:', videoError)
        toast.error('Dreamworlds created but video generation failed to start')
      } finally {
        setIsGeneratingVideo(false)
      }
    } catch (error) {
      console.error('Error generating Dreamworlds:', error)
      toast.error('Failed to create Dreamworlds')
      throw error
    }
  }

  useEffect(() => {
    loadDreams()
  }, [refreshTrigger])

  useEffect(() => {
    // Filter dreams based on search query and selected tags
    let filtered = dreams

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(dream =>
        dream.title.toLowerCase().includes(query) ||
        dream.description.toLowerCase().includes(query) ||
        dream.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(dream =>
        selectedTags.every(selectedTag =>
          dream.tags?.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
        )
      )
    }

    setFilteredDreams(filtered)
  }, [searchQuery, selectedTags, dreams])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
    setTagSearchQuery('')
  }
  
  // Filter tags based on tag search query
  const filteredTags = tagSearchQuery.trim()
    ? allTags.filter(tag => tag.toLowerCase().includes(tagSearchQuery.toLowerCase()))
    : allTags
  
  // Determine how many tags to show
  const MAX_VISIBLE_TAGS = 12
  const visibleTags = showAllTags ? filteredTags : filteredTags.slice(0, MAX_VISIBLE_TAGS)
  const hasMoreTags = filteredTags.length > MAX_VISIBLE_TAGS

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (dreams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Plus className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-2xl font-serif mb-2">No Dreams Yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Start your journey into dream interpretation by sharing your first dream
        </p>
        <Button onClick={onNewDream} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Write Your First Dream
        </Button>
      </div>
    )
  }

  // Determine if Dreamworlds feature should be disabled for current tier
  // FEATURE FLAG: Disable for free, pro (visionary), and premium (architect) tiers
  // To re-enable for next release: Update DREAMWORLDS_DISABLED_TIERS array
  const DREAMWORLDS_DISABLED_TIERS: SubscriptionTier[] = ['free', 'pro', 'premium']
  const isDreamworldsDisabled = userProfile && DREAMWORLDS_DISABLED_TIERS.includes(userProfile.subscriptionTier as SubscriptionTier)

  // Reset activeTab to 'dreams' if Dreamworlds is disabled and currently selected
  if (isDreamworldsDisabled && activeTab === 'dreamworld') {
    setActiveTab('dreams')
  }

  return (
    <div className="space-y-6">
      <FirstDreamCelebration
        open={showCelebration}
        onOpenChange={setShowCelebration}
        dreamsRemaining={userProfile?.subscriptionTier === 'free' ? (2 + (userProfile as any).referralBonusDreams - dreams.length) : 0}
        onUpgrade={() => navigate('/pricing')}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dreams">Dream Library</TabsTrigger>
          <TabsTrigger 
            value="dreamworld" 
            className="flex items-center gap-2"
            disabled={isDreamworldsDisabled}
            title={isDreamworldsDisabled ? "Dreamworlds feature coming soon. Upgrade to Star tier for access." : ""}
          >
            <Sparkles className="w-4 h-4" />
            Create Dreamworlds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dreams">
          {/* Weekly Reflection Retrospective */}
          <div className="mb-8">
            <WeeklyReflectionCard 
              subscriptionTier={(userProfile?.subscriptionTier as any) || 'free'} 
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">Your Dream Library</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredDreams.length} {filteredDreams.length === 1 ? 'dream' : 'dreams'} collected
            {(searchQuery || selectedTags.length > 0) && ' (filtered)'}
          </p>
        </div>
        <Button onClick={onNewDream} className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all">
          <Plus className="w-4 h-4 mr-2" />
          New Dream
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-8">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search dreams by title, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-12 text-base md:text-sm bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary/50 transition-all hover:bg-background/80"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground p-2 md:p-1 rounded-full hover:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5 md:w-4 md:h-4" />
            </button>
          )}
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="space-y-3 p-4 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <p className="text-sm font-medium">Filter by symbols</p>
                <Badge variant="secondary" className="text-xs bg-secondary/50">
                  {allTags.length}
                </Badge>
                {selectedTags.length > 0 && (
                  <Badge variant="default" className="text-xs animate-in fade-in zoom-in">
                    {selectedTags.length} selected
                  </Badge>
                )}
              </div>
              {selectedTags.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs hover:bg-destructive/10 hover:text-destructive">
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            
            {/* Tag Search - Only show when there are many tags */}
            {allTags.length > 12 && (
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  placeholder="Search symbols..."
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  className="pl-9 pr-9 h-8 text-sm bg-background/50 border-border/30"
                />
                {tagSearchQuery && (
                  <button
                    onClick={() => setTagSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            
            {/* Tags Display */}
            <div className="flex flex-wrap gap-2 pt-1">
              {visibleTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all duration-200 select-none ${
                    selectedTags.includes(tag) 
                      ? 'shadow-sm ring-1 ring-primary/20' 
                      : 'hover:border-primary/50 hover:bg-primary/5 bg-background/50'
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            
            {/* Show More/Less Button */}
            {hasMoreTags && !tagSearchQuery && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  {showAllTags ? (
                    <>Show less symbols</>
                  ) : (
                    <>Show {filteredTags.length - MAX_VISIBLE_TAGS} more symbols</>
                  )}
                </Button>
              </div>
            )}
            
            {/* No results message when searching */}
            {tagSearchQuery && filteredTags.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2 italic">
                No symbols found matching "{tagSearchQuery}"
              </p>
            )}
          </div>
        )}
      </div>

        {/* Results */}
        {filteredDreams.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center px-4 border-2 border-dashed border-muted rounded-xl bg-muted/5">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-primary/70" />
            </div>
            <h3 className="text-xl font-serif mb-2 font-medium">No dreams found</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              We couldn't find any dreams matching your criteria. Try adjusting your search or filters.
            </p>
            <Button variant="outline" onClick={clearFilters} className="border-primary/20 hover:border-primary/50 hover:bg-primary/5">
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
            {filteredDreams.map((dream) => (
              <DreamCard 
                key={dream.id} 
                dream={dream} 
                onUpdate={loadDreams}
                subscriptionTier={(userProfile?.subscriptionTier as any) || 'free'}
                isOpen={openDreamId === dream.id}
                onOpenChange={(isOpen) => setOpenDreamId(isOpen ? dream.id : null)}
              />
            ))}
          </div>
        )}
        </TabsContent>

        <TabsContent value="dreamworld">
          {userProfile && (
            <DreamWorldGenerator
              tier={userProfile.subscriptionTier}
              dreamCount={dreams.length}
              dreamWorldsGeneratedThisMonth={dreamWorldsThisMonth}
              onGenerate={handleGenerateDreamWorld}
              dreamList={dreams.map(d => ({ id: d.id, title: d.title }))}
              isGeneratingVideo={isGeneratingVideo}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}