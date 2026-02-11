import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Sparkles, Crown, Check } from 'lucide-react'
import { motion } from 'framer-motion'

interface FirstDreamCelebrationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dreamsRemaining: number
  onUpgrade: () => void
}

export function FirstDreamCelebration({
  open,
  onOpenChange,
  dreamsRemaining,
  onUpgrade
}: FirstDreamCelebrationProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-serif">
              🎉 Your First Dream Interpretation is Ready!
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Congratulations on exploring your subconscious with Dreamcatcher AI
            </DialogDescription>
          </motion.div>
        </DialogHeader>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mt-4"
        >
          {/* Usage Status */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-purple-900 mb-1">
                    Free Interpretations Remaining
                  </p>
                  <p className="text-lg font-bold text-purple-600">
                    {dreamsRemaining} {dreamsRemaining === 1 ? 'interpretation' : 'interpretations'} left
                  </p>
                  <p className="text-sm text-purple-700 mt-2">
                    Make the most of your free trial to explore your dream world!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade CTA */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <Crown className="w-8 h-8 text-amber-600 mx-auto" />
                <p className="font-semibold text-gray-900">
                  Want Unlimited Interpretations?
                </p>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between p-2 bg-white/50 rounded">
                    <span className="font-medium">Visionary Plan</span>
                    <span className="font-bold text-purple-600">10/month · $9.99</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/50 rounded">
                    <span className="font-medium">Architect Plan</span>
                    <span className="font-bold text-purple-600">20/month · $19.99</span>
                  </div>
                </div>
                <Button
                  onClick={onUpgrade}
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                  size="lg"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  View All Plans
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Continue Exploring
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
