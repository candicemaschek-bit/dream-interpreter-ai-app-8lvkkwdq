import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Gift, Copy, Users, Check } from 'lucide-react'
import { blink } from '../blink/client'
import { getUserReferralCode, getReferralStats } from '../utils/referralSystem'
import toast from 'react-hot-toast'

export function ReferralCard() {
  const [referralCode, setReferralCode] = useState('')
  const [stats, setStats] = useState({
    totalReferrals: 0,
    successfulReferrals: 0,
    bonusDreams: 0
  })
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReferralData()
  }, [])

  const loadReferralData = async () => {
    try {
      const user = await blink.auth.me()
      
      // Get or generate referral code
      const code = await getUserReferralCode(user.id)
      setReferralCode(code)
      
      // Get referral statistics
      const referralStats = await getReferralStats(user.id)
      setStats(referralStats)
    } catch (error) {
      console.error('Error loading referral data:', error)
    } finally {
      setLoading(false)
    }
  }

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
    const shareText = `Try Dreamcatcher AI - AI-powered dream interpretation! Use my code ${referralCode} to get a bonus dream analysis. https://dream-interpreter-ai-app-8lvkkwdq.live.blink.new`
    
    if (navigator.share) {
      navigator.share({
        title: 'Join me on Dreamcatcher AI',
        text: shareText
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText)
        toast.success('Share text copied to clipboard!')
      })
    } else {
      navigator.clipboard.writeText(shareText)
      toast.success('Share text copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Get Extra Dreams Free
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading referral info...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-600" />
          🎁 Get Extra Dreams Free!
        </CardTitle>
        <CardDescription>
          Share your code with friends. When they sign up, you both get +1 dream analysis!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Code Display */}
        <div className="p-4 bg-white rounded-lg border-2 border-purple-300 text-center">
          <p className="text-sm text-muted-foreground mb-2">Your Referral Code</p>
          <p className="text-3xl font-bold text-purple-600 mb-3 tracking-wider">{referralCode}</p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={copyToClipboard}
              className="flex-1"
              variant={copied ? "default" : "outline"}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </>
              )}
            </Button>
            <Button 
              size="sm" 
              onClick={shareReferral}
              className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600"
            >
              Share
            </Button>
          </div>
        </div>

        {/* Referral Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-white rounded-lg text-center">
            <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-purple-600">{stats.successfulReferrals}</p>
            <p className="text-xs text-muted-foreground">Referrals</p>
          </div>
          <div className="p-3 bg-white rounded-lg text-center">
            <Gift className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">{stats.bonusDreams}</p>
            <p className="text-xs text-muted-foreground">Bonus Dreams</p>
          </div>
          <div className="p-3 bg-white rounded-lg text-center">
            <Badge variant="secondary" className="w-full justify-center py-1">
              +1
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Per Referral</p>
          </div>
        </div>

        {/* How it Works */}
        <div className="p-4 bg-white rounded-lg border border-purple-200">
          <h4 className="font-semibold text-sm mb-3 text-purple-900">How it works:</h4>
          <ol className="text-sm space-y-2 text-gray-700">
            <li className="flex gap-2">
              <span className="font-bold text-purple-600">1.</span>
              <span>Share your referral code with friends</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-purple-600">2.</span>
              <span>They enter it when signing up</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-purple-600">3.</span>
              <span>You both get +1 free dream analysis! 🎉</span>
            </li>
          </ol>
        </div>

        {stats.successfulReferrals > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-sm text-green-900">
              <span className="font-semibold">🎉 Great job!</span> You've earned{' '}
              <span className="font-bold">{stats.bonusDreams} extra dream{stats.bonusDreams !== 1 ? 's' : ''}</span> through referrals!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
