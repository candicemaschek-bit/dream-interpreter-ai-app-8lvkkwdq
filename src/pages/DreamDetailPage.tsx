import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabaseService } from '../lib/supabaseService'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { ArrowLeft, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { DreamShareButton } from '../components/DreamShareButton'
import { updateOpenGraphTags } from '../utils/openGraph'
import { isCrawler, getServerOGUrl, addPrerenderHint } from '../utils/ogHelper'
import { guardDream } from '../utils/typeGuards'
import { parseInterpretation } from '../utils/interpretationParser'
import type { Dream } from '../types/dream'
import toast from 'react-hot-toast'

function DreamInterpretationDisplay({ interpretation }: { interpretation: string }) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0, 1]))
  
  const toggleSection = (index: number) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const parsed = parseInterpretation(interpretation)

  if (!parsed.sections || parsed.sections.length === 0) {
    return (
      <div>
        <h3 className="font-semibold text-lg mb-2">AI Interpretation</h3>
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
          <p className="text-foreground whitespace-pre-wrap">{interpretation}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="font-semibold text-lg mb-4">AI Interpretation</h3>
      <div className="space-y-3">
        {parsed.sections.map((section, index) => (
          <div key={index} className="rounded-lg border border-primary/20 overflow-hidden">
            <button
              onClick={() => toggleSection(index)}
              className="w-full flex items-center justify-between gap-3 p-4 hover:bg-primary/5 transition-colors bg-primary/2"
            >
              <div className="text-left flex-1">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                    {section.sectionNumber || index + 1}
                  </span>
                  {section.title}
                </h4>
              </div>
              {expandedSections.has(index) ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
            </button>
            
            {expandedSections.has(index) && (
              <div className="px-4 pb-4 pt-0 bg-background">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </p>
              </div>
            )}
          </div>
        ))}
        
        {/* Guidance Section */}
        {parsed.guidanceContent && (
          <div className="rounded-lg border border-blue-200 dark:border-blue-800 overflow-hidden bg-blue-50 dark:bg-blue-950/20">
            <button
              onClick={() => toggleSection(parsed.sections.length)}
              className="w-full flex items-center justify-between gap-3 p-4 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <div className="text-left flex-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium">
                    G
                  </span>
                  Guidance
                </h4>
              </div>
              {expandedSections.has(parsed.sections.length) ? (
                <ChevronUp className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              )}
            </button>
            
            {expandedSections.has(parsed.sections.length) && (
              <div className="px-4 pb-4 pt-0">
                <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed whitespace-pre-wrap">
                  {parsed.guidanceContent}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function DreamDetailPage() {
  const { dreamId } = useParams<{ dreamId: string }>()
  const navigate = useNavigate()
  const [dream, setDream] = useState<Dream | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!dreamId) {
      setError('Invalid dream ID')
      setIsLoading(false)
      return
    }

    // If this is a crawler, redirect to server-side OG generation
    if (isCrawler()) {
      window.location.href = getServerOGUrl(dreamId)
      return
    }

    // Add prerender hints for crawlers
    addPrerenderHint(dreamId)

    loadDream()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dreamId])

  const loadDream = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!dreamId) return

      const dreamData = await supabaseService.getDreamById(dreamId)

      if (!dreamData) {
        setError('Dream not found')
        return
      }

      // Actually, I'll just map it directly and use guardDream if needed
      const processedDream = {
        ...dreamData,
        createdAt: dreamData.created_at,
        updatedAt: dreamData.updated_at,
        inputType: dreamData.input_type,
        imageUrl: dreamData.image_url,
        videoUrl: dreamData.video_url,
        tags: dreamData.tags ? JSON.parse(dreamData.tags) : []
      } as unknown as Dream
      
      setDream(processedDream)

      // Update OG tags for social sharing
      updateOpenGraphTags({
        title: `Dream: ${processedDream.title || 'Untitled Dream'} | Dreamcatcher`,
        description: processedDream.description || 'Explore this dream interpretation',
        url: window.location.href,
        image: processedDream.imageUrl,
        type: 'article'
      })
    } catch (err) {
      console.error('Error loading dream:', err)
      setError('Failed to load dream')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dream...</p>
        </div>
      </div>
    )
  }

  if (error || !dream) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img src="/logo_new.png" alt="Error" className="w-6 h-6 opacity-70 grayscale" />
              Dream Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {error || 'This dream could not be found.'}
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <img src="/logo_new.png" alt="Logo" className="w-6 h-6 opacity-70" />
            <span className="font-serif font-semibold">Dreamcatcher AI</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-xl">
          <CardHeader className="pb-0">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-3 font-serif">{dream.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(dream.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <DreamShareButton
                dreamTitle={dream.title}
                dreamDescription={dream.description}
                interpretation={dream.interpretation || ''}
                dreamId={dream.id}
                imageUrl={dream.imageUrl}
                variant="default"
                size="lg"
              />
              <Button 
                onClick={() => navigate('/')} 
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dreams
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dream Image */}
            {dream.imageUrl && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={dream.imageUrl}
                  alt={dream.title}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Dream Description */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Dream Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {dream.description}
              </p>
            </div>

            {/* Interpretation */}
            {dream.interpretation && (
              <DreamInterpretationDisplay interpretation={dream.interpretation} />
            )}

            {/* Video */}
            {dream.videoUrl && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Dream Video</h3>
                <div className="rounded-lg overflow-hidden">
                  <video
                    src={dream.videoUrl}
                    controls
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}

            {/* Tags */}
            {dream.tags && dream.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {dream.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
