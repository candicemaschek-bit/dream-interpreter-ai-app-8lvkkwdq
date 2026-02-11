import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { CheckCircle2, Sparkles, Loader2, CreditCard } from 'lucide-react'
import { ADD_ONS } from '../types/subscription'
import type { AddOnType } from '../types/subscription'
import { validateAndProcessAddOnPurchase, formatCurrency, trackAddOnEvent } from '../utils/addOnPurchaseManager'
import toast from 'react-hot-toast'

interface DreamworldsPurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPurchaseComplete: () => void
}

export function DreamworldsPurchaseDialog({
  open,
  onOpenChange,
  onPurchaseComplete
}: DreamworldsPurchaseDialogProps) {
  const [selectedAddOn, setSelectedAddOn] = useState<AddOnType | null>(null)
  const [isPurchasing, setIsPurchasing] = useState(false)

  const singlePass = ADD_ONS.dreamworlds_pass
  const bundlePass = ADD_ONS.extra_dreamworld

  const handlePurchase = async (addOnId: AddOnType) => {
    setIsPurchasing(true)
    setSelectedAddOn(addOnId)
    
    try {
      // Track purchase attempt
      await trackAddOnEvent('purchase_attempt', addOnId, {
        price: ADD_ONS[addOnId].price
      })

      const result = await validateAndProcessAddOnPurchase({
        addOnId,
        quantity: 1
      })

      if (result.valid) {
        toast.success('Purchase successful! You can now create Dreamworlds.')
        
        // Track successful purchase
        await trackAddOnEvent('purchase_success', addOnId, {
          transactionId: result.transactionId,
          amount: result.amount
        })

        onPurchaseComplete()
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Purchase failed. Please try again.')
        
        // Track failed purchase
        await trackAddOnEvent('purchase_failed', addOnId, {
          error: result.error
        })
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('An error occurred during purchase. Please try again.')
    } finally {
      setIsPurchasing(false)
      setSelectedAddOn(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-accent" />
            Purchase Dreamworlds Access
          </DialogTitle>
          <DialogDescription>
            Choose an add-on to unlock Dreamworlds video generation
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {/* Single Dreamworlds Pass */}
          <Card className="relative hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{singlePass.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {singlePass.description}
                  </CardDescription>
                </div>
                <Badge variant="secondary">One-time</Badge>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(singlePass.price)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Per Dreamworlds video
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                {singlePass.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handlePurchase('dreamworlds_pass')}
                disabled={isPurchasing}
                className="w-full"
                size="lg"
              >
                {isPurchasing && selectedAddOn === 'dreamworlds_pass' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Purchase for {formatCurrency(singlePass.price)}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Bundle Pass */}
          <Card className="relative border-accent hover:shadow-lg transition-shadow">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-accent text-white shadow-md">
                BEST VALUE - Save $6.97
              </Badge>
            </div>

            <CardHeader className="pt-8">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{bundlePass.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {bundlePass.description}
                  </CardDescription>
                </div>
                <Badge variant="secondary">Bundle</Badge>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-accent">
                    {formatCurrency(bundlePass.price)}
                  </div>
                  <div className="text-sm text-muted-foreground line-through">
                    {formatCurrency(20.97)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(bundlePass.price / 3)} per video
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                {bundlePass.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handlePurchase('extra_dreamworld')}
                disabled={isPurchasing}
                className="w-full bg-accent hover:bg-accent/90"
                size="lg"
              >
                {isPurchasing && selectedAddOn === 'extra_dreamworld' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Purchase Bundle for {formatCurrency(bundlePass.price)}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-secondary/50 border">
          <h4 className="font-medium mb-2">What is Dreamworlds?</h4>
          <p className="text-sm text-muted-foreground">
            Dreamworlds is a cinematic 45-second video that weaves multiple dreams together into one connected narrative. 
            It's perfect for creating a visual journey through your dream landscape with professional-quality editing and transitions.
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPurchasing}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
