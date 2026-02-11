import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { Sparkles, Heart, Stars, Lightbulb, MessageCircle } from 'lucide-react'
import type { ValidationRecommendation, CheckpointResult } from '../utils/inputValidationCheckpoint'

interface RecommendationApprovalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  checkpoints: CheckpointResult[]
  recommendations: ValidationRecommendation[]
  onProceed: () => void
  onCancel: () => void
  title?: string
  description?: string
}

// Friendly AI guide messages based on issue type
const AI_GUIDE_MESSAGES = {
  needsMoreDetail: [
    "Your dream sounds intriguing! I'd love to understand it better. Could you share a few more details about what you experienced?",
    "I sense there's more to this dream... What else do you remember? Even small details can reveal meaningful insights.",
    "Dreams often hide their wisdom in the details. What other moments from this dream stand out to you?"
  ],
  needsEmotions: [
    "Dreams speak through feelings. How did you feel during this dream? Were you anxious, curious, peaceful, or something else entirely?",
    "Your emotions are the key to unlocking your dream's meaning. What feelings do you remember experiencing?",
    "I'd love to understand the emotional landscape of your dream. What sensations or feelings stayed with you?"
  ],
  tooShort: [
    "This dream snippet has caught my attention! Help me see the full picture—what else happened in this dream?",
    "Every dream has a story to tell. Can you paint a richer picture of what you experienced?",
    "I'm curious to explore more of this dream with you. What other scenes or moments do you recall?"
  ],
  contentIssue: [
    "Let me help you capture this dream more clearly. Could you describe it using everyday words and descriptions?",
    "I want to understand your dream fully. Try describing it as if you were telling a friend about it."
  ],
  encouragement: [
    "Your dream is ready for interpretation! Let's discover what messages your subconscious has for you.",
    "Beautiful! I can feel the depth of this dream. Let's explore its meaning together.",
    "Your dream description is wonderful. I'm excited to help you uncover its hidden insights."
  ]
}

const getRandomMessage = (messages: string[]) => messages[Math.floor(Math.random() * messages.length)]

// Convert technical messages to friendly AI prompts
const getFriendlyMessage = (recommendation: ValidationRecommendation): string => {
  const msg = recommendation.message.toLowerCase()
  
  if (msg.includes('emotional') || msg.includes('emotion')) {
    return getRandomMessage(AI_GUIDE_MESSAGES.needsEmotions)
  }
  if (msg.includes('too brief') || msg.includes('too short') || msg.includes('minimum')) {
    return getRandomMessage(AI_GUIDE_MESSAGES.tooShort)
  }
  if (msg.includes('detail') || msg.includes('content')) {
    return getRandomMessage(AI_GUIDE_MESSAGES.needsMoreDetail)
  }
  if (msg.includes('special character') || msg.includes('gibberish') || msg.includes('invalid')) {
    return getRandomMessage(AI_GUIDE_MESSAGES.contentIssue)
  }
  
  // Default friendly message
  return recommendation.suggestion || getRandomMessage(AI_GUIDE_MESSAGES.needsMoreDetail)
}

// Get friendly severity label
const getFriendlySeverityLabel = (severity: 'error' | 'warning' | 'suggestion') => {
  switch (severity) {
    case 'error':
      return 'Let me help'
    case 'warning':
      return 'A thought'
    case 'suggestion':
      return 'Quick tip'
  }
}

export function RecommendationApprovalModal({
  open,
  onOpenChange,
  checkpoints,
  recommendations,
  onProceed,
  onCancel,
  title = 'Before We Interpret...',
  description
}: RecommendationApprovalModalProps) {
  // Count recommendations by severity
  const errorCount = recommendations.filter(r => r.severity === 'error').length
  const warningCount = recommendations.filter(r => r.severity === 'warning').length
  const suggestionCount = recommendations.filter(r => r.severity === 'suggestion').length

  // Determine if user can proceed
  const canProceed = errorCount === 0

  // Get friendly severity styling
  const getSeverityStyle = (severity: 'error' | 'warning' | 'suggestion') => {
    switch (severity) {
      case 'error':
        return 'border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50'
      case 'warning':
        return 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50'
      case 'suggestion':
        return 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'
    }
  }

  // Get severity icon with friendly styling
  const getSeverityIcon = (severity: 'error' | 'warning' | 'suggestion') => {
    switch (severity) {
      case 'error':
        return <Heart className="w-5 h-5 text-violet-600" />
      case 'warning':
        return <Lightbulb className="w-5 h-5 text-amber-600" />
      case 'suggestion':
        return <Sparkles className="w-5 h-5 text-blue-600" />
    }
  }

  // Get severity badge variant
  const getSeverityBadge = (severity: 'error' | 'warning' | 'suggestion') => {
    switch (severity) {
      case 'error':
        return <Badge variant="outline" className="border-violet-400 text-violet-700 bg-violet-100">{getFriendlySeverityLabel(severity)}</Badge>
      case 'warning':
        return <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-100">{getFriendlySeverityLabel(severity)}</Badge>
      case 'suggestion':
        return <Badge variant="outline" className="border-blue-400 text-blue-700 bg-blue-100">{getFriendlySeverityLabel(severity)}</Badge>
    }
  }

  // Get checkpoint status icon
  const getCheckpointStatusIcon = (status: string, passed: boolean) => {
    if (status === 'passed') {
      return <Stars className="w-5 h-5 text-violet-500" />
    } else if (status === 'failed') {
      return <img src="/logo_new.png" alt="Failed" className="w-5 h-5 opacity-50 grayscale" />
    } else if (status === 'skipped') {
      return <img src="/logo_new.png" alt="Skipped" className="w-5 h-5 opacity-30 grayscale" />
    }
    return <img src="/logo_new.png" alt="Pending" className="w-5 h-5 opacity-50 grayscale" />
  }

  // Determine if we should show minimal view (all passed) or guidance view
  const showGuidance = recommendations.length > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-violet-200 bg-gradient-to-b from-background to-violet-50/30">
        <AlertDialogHeader className="text-center pb-2">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <AlertDialogTitle className="text-2xl font-serif bg-gradient-to-r from-violet-700 to-purple-700 bg-clip-text text-transparent">
            {canProceed && !showGuidance ? "Your Dream Awaits" : title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-muted-foreground">
            {description || (canProceed && !showGuidance 
              ? "I can feel the depth of your dream. Ready to explore its meaning?" 
              : "Let me help you capture your dream more vividly for a deeper interpretation.")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* AI Guide Messages - Conversational Style */}
          {showGuidance && (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <Card key={`${rec.checkpointId}-${index}`} className={`${getSeverityStyle(rec.severity)} border shadow-sm`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getSeverityIcon(rec.severity)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(rec.severity)}
                        </div>
                        {/* Friendly conversational message */}
                        <p className="text-sm text-foreground leading-relaxed">
                          {getFriendlyMessage(rec)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Success state - All passed */}
          {canProceed && !showGuidance && (
            <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-violet-900">{getRandomMessage(AI_GUIDE_MESSAGES.encouragement)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gentle prompt when can't proceed */}
          {!canProceed && (
            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground italic">
                Take a moment to add these details—they'll help me give you a more meaningful interpretation ✨
              </p>
            </div>
          )}

          {/* Quiet progress indicators - only show if there are checkpoints to display */}
          {checkpoints.length > 0 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {checkpoints.map((checkpoint) => (
                <div key={checkpoint.id} className="flex items-center gap-1">
                  {getCheckpointStatusIcon(checkpoint.status, checkpoint.passed)}
                </div>
              ))}
            </div>
          )}
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel 
            onClick={onCancel}
            className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800"
          >
            Add More Details
          </AlertDialogCancel>
          {canProceed && (
            <AlertDialogAction 
              onClick={onProceed}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md shadow-violet-200"
            >
              {warningCount > 0 ? 'Interpret Anyway' : 'Reveal My Dream\'s Meaning'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
