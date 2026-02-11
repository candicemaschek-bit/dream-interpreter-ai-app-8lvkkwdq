import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Gift, Copy, Share2, Check } from 'lucide-react'
import { blink } from '../blink/client'
import { getUserReferralCode } from '../utils/referralSystem'
import toast from 'react-hot-toast'

interface ReferralDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReferralDialog({ open, onOpenChange }: ReferralDialogProps) {
  const [referralCode, setReferralCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return

    const loadReferralCode = async () => {
      try {
        const user = await blink.auth.me()
        const code = await getUserReferralCode(user.id)
        setReferralCode(code)
      } catch (error) {
        console.error('Error loading referral code:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReferralCode()
  }, [open])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralCode)
      setCopied(true)
      toast.success('Referral code copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy code')
    }
  }

  const shareReferral = () => {
    const shareText = `Share a dream with a friend using my code ${referralCode} and we both get a free interpretation! 🌙 https://dream-interpreter-ai-app-8lvkkwdq.live.blink.new`
    
    if (navigator.share) {
      navigator.share({
        title: 'Share a Dream with Dreamcatcher AI',
        text: shareText
      }).catch(() => {
        navigator.clipboard.writeText(shareText)
        toast.success('Share text copied to clipboard!')
      })
    } else {
      navigator.clipboard.writeText(shareText)
      toast.success('Share text copied to clipboard!')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-lg bg-purple-100">
            <Gift className="w-6 h-6 text-purple-600" />
          </div>
          <DialogTitle className="text-center text-xl">Share a Dream with a Friend</DialogTitle>
          <DialogDescription className="text-center mt-2">
            Share a dream with a friend and get a free interpretation when they sign up
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loading ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading your referral code...</p>
            </div>
          ) : (
            <>
              {/* Referral Code Display */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border-2 border-purple-300">
                <p className="text-sm text-muted-foreground text-center mb-2 font-medium">Your Dream Code</p>
                <p className="text-3xl font-bold text-center text-purple-600 tracking-wider mb-4 font-mono">
                  {referralCode}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={copyToClipboard}
                    size="sm"
                    variant={copied ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={shareReferral}
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* How It Works */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-sm text-blue-900 mb-2">How it works:</h4>
                <ol className="text-xs space-y-1.5 text-blue-700">
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
                    <span>Share your dream code with friends</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
                    <span>They use it when signing up</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
                    <span>You both unlock a free interpretation 🎉</span>
                  </li>
                </ol>
              </div>
            </>
          )}
        </div>

        <Button
          onClick={() => onOpenChange(false)}
          variant="outline"
          className="w-full"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  )
}
