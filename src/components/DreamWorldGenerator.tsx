import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'
import { AlertCircle, Sparkles, Loader2, ShoppingCart } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { DreamworldsPurchaseDialog } from './DreamworldsPurchaseDialog'
import type { SubscriptionTier } from '../types/subscription'
import { SUBSCRIPTION_PLANS } from '../types/subscription'
import { guardString, guardArray } from '../utils/typeGuards'
import { getUserAddOnPurchases } from '../utils/addOnPurchaseManager'
import toast from 'react-hot-toast'

interface DreamWorldGeneratorProps {
  tier: SubscriptionTier
  dreamCount: number
  dreamWorldsGeneratedThisMonth: number
  onGenerate: (title: string, selectedDreamIds: string[]) => Promise<void>
  dreamList: Array<{ id: string; title: string }>
  isGeneratingVideo?: boolean
}

export function DreamWorldGenerator({
  tier,
  dreamCount,
  dreamWorldsGeneratedThisMonth,
  onGenerate,
  dreamList,
  isGeneratingVideo = false
}: DreamWorldGeneratorProps) {
  const [title, setTitle] = useState('')
  const [selectedDreams, setSelectedDreams] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [purchasedDreamworlds, setPurchasedDreamworlds] = useState(0)

  const plan = SUBSCRIPTION_PLANS[tier]
  
  // Load purchased add-ons on mount
  useEffect(() => {
    const loadPurchases = async () => {
      try {
        const purchases = await getUserAddOnPurchases()
        const dreamworldsPurchases = purchases.filter(
          p => (p.addOnId === 'dreamworlds_pass' || p.addOnId === 'extra_dreamworld') && 
          p.status === 'completed'
        )
        
        // Calculate total available Dreamworlds from purchases
        let total = 0
        dreamworldsPurchases.forEach(p => {
          if (p.addOnId === 'dreamworlds_pass') {
            total += Number(p.quantity || 1)
          } else if (p.addOnId === 'extra_dreamworld') {
            total += Number(p.quantity || 1) * 3 // Bundle gives 3
          }
        })
        setPurchasedDreamworlds(total)
      } catch (error) {
        console.error('Failed to load purchased Dreamworlds:', error)
      }
    }
    loadPurchases()
  }, [])
  
  // VIP/Star gets 1 free Dreamworlds per month. Others need to purchase.
  const vipFreeRemaining = tier === 'vip' && dreamWorldsGeneratedThisMonth < 1
  const purchasedRemaining = purchasedDreamworlds - dreamWorldsGeneratedThisMonth
  const totalRemaining = vipFreeRemaining ? 1 + Math.max(0, purchasedRemaining) : Math.max(0, purchasedRemaining)
  
  const canGenerateMore = totalRemaining > 0
  const needsPurchase = !canGenerateMore && tier !== 'vip'

  const canGenerate = title.trim() && selectedDreams.length >= 2 && canGenerateMore

  const handleToggleDream = (dreamId: string) => {
    setSelectedDreams(prev =>
      prev.includes(dreamId)
        ? prev.filter(id => id !== dreamId)
        : [...prev, dreamId]
    )
  }

  const handleGenerate = async () => {
    if (!canGenerate) return

    // Validate inputs before generation
    const titleValidation = guardString(title, '')
    const dreamsValidation = guardArray(selectedDreams, [])

    if (!titleValidation.valid || titleValidation.value.trim().length === 0) {
      toast.error('Please provide a valid title for your Dreamworlds')
      return
    }

    if (!dreamsValidation.valid || dreamsValidation.value.length < 2) {
      toast.error('Please select at least 2 dreams to create a Dreamworlds')
      return
    }

    // Additional validation: ensure dream IDs are strings
    const validDreamIds = dreamsValidation.value.filter(
      (id: unknown) => typeof id === 'string' && id.trim().length > 0
    )

    if (validDreamIds.length < 2) {
      toast.error('Invalid dream selection. Please try again.')
      console.error('Dream ID validation failed:', dreamsValidation.value)
      return
    }

    setIsGenerating(true)
    try {
      await onGenerate(titleValidation.value.trim(), validDreamIds)
      setTitle('')
      setSelectedDreams([])
      toast.success('Dreamworlds created successfully!')
    } catch (error) {
      console.error('Error generating Dreamworlds:', error)
      toast.error('Failed to generate Dreamworlds. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          Create a Dreamworlds
        </CardTitle>
        <CardDescription>
          Weave multiple dreams into one connected narrative
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Access Level Alert */}
        {tier === 'free' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Dreamworlds is locked for Free users. Purchase an Add-on ($6.99) or upgrade to Star for 1 free per month.
            </AlertDescription>
          </Alert>
        )}

        {tier === 'pro' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Dreamworlds is locked for Pro users. Purchase an Add-on ($6.99) or upgrade to Star for 1 free per month.
            </AlertDescription>
          </Alert>
        )}

        {tier === 'premium' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Dreamworlds is locked for Premium users. Purchase an Add-on ($6.99) or upgrade to Star for 1 free per month plus exclusive AI models.
            </AlertDescription>
          </Alert>
        )}

        {tier === 'vip' && dreamWorldsGeneratedThisMonth < 1 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have 1 free Dreamworlds this month remaining. Additional ones cost $6.99 each.
            </AlertDescription>
          </Alert>
        )}

        {tier === 'vip' && dreamWorldsGeneratedThisMonth >= 1 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You've used your 1 free Dreamworlds this month. Purchase Add-ons at $6.99 each for more.
            </AlertDescription>
          </Alert>
        )}

        {/* Purchase Status */}
        {tier !== 'vip' && purchasedDreamworlds > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have {purchasedRemaining} purchased Dreamworlds remaining.
            </AlertDescription>
          </Alert>
        )}
        
        {tier === 'vip' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {vipFreeRemaining ? (
                <>You have 1 free Dreamworlds this month. Additional: {purchasedRemaining} purchased.</>
              ) : (
                <>Your free Dreamworlds used. {purchasedRemaining} purchased Dreamworlds remaining.</>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Purchase Button for Non-VIP */}
        {needsPurchase && (
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Unlock Dreamworlds
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Purchase add-on access to create cinematic 45-second videos that weave multiple dreams together.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <div className="bg-background px-3 py-1.5 rounded-md border">
                      <span className="font-medium">Single:</span> $6.99
                    </div>
                    <div className="bg-background px-3 py-1.5 rounded-md border border-accent/30">
                      <span className="font-medium">Bundle (3):</span> $14.99 <span className="text-accent">(Save $6.97)</span>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowPurchaseDialog(true)}
                  className="flex-shrink-0"
                  size="lg"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Purchase Access
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="title">Dreamworlds Title</Label>
          <Input
            id="title"
            placeholder="e.g., My Subconscious Journey, The Forest Chronicles..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Dream Selection */}
        <div className="space-y-3">
          <Label className="block">
            Select Dreams to Include (minimum 2)
            <span className="text-muted-foreground text-sm font-normal ml-2">
              ({selectedDreams.length} selected)
            </span>
          </Label>

          {dreamList.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3 rounded-lg border border-dashed">
              Create at least 2 dreams before generating a Dreamworlds
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dreamList.map(dream => (
                <div
                  key={dream.id}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-secondary/50 transition"
                >
                  <Checkbox
                    id={dream.id}
                    checked={selectedDreams.includes(dream.id)}
                    onCheckedChange={() => handleToggleDream(dream.id)}
                  />
                  <Label htmlFor={dream.id} className="flex-1 font-normal cursor-pointer">
                    {dream.title}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating || isGeneratingVideo}
          className="w-full"
          size="lg"
        >
          {isGenerating || isGeneratingVideo ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isGeneratingVideo ? 'Generating Video...' : 'Creating Dreamworlds...'}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Dreamworlds {canGenerateMore && `(${totalRemaining} remaining)`}
            </>
          )}
        </Button>

        {!canGenerateMore && (
          <p className="text-sm text-muted-foreground text-center">
            {tier === 'vip' ? (
              'No Dreamworlds remaining. Purchase more to continue creating.'
            ) : (
              'Purchase Dreamworlds access to start creating cinematic videos.'
            )}
          </p>
        )}
        
        {/* Purchase Dialog */}
        <DreamworldsPurchaseDialog
          open={showPurchaseDialog}
          onOpenChange={setShowPurchaseDialog}
          onPurchaseComplete={() => {
            // Reload purchases after successful purchase
            getUserAddOnPurchases().then(purchases => {
              const dreamworldsPurchases = purchases.filter(
                p => (p.addOnId === 'dreamworlds_pass' || p.addOnId === 'extra_dreamworld') && 
                p.status === 'completed'
              )
              let total = 0
              dreamworldsPurchases.forEach(p => {
                if (p.addOnId === 'dreamworlds_pass') {
                  total += Number(p.quantity || 1)
                } else if (p.addOnId === 'extra_dreamworld') {
                  total += Number(p.quantity || 1) * 3
                }
              })
              setPurchasedDreamworlds(total)
            })
          }}
        />
      </CardContent>
    </Card>
  )
}
