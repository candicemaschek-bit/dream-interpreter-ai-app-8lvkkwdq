import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { X, HelpCircle } from 'lucide-react'

interface VoiceRecorderOnboardingProps {
  onDismiss: () => void
  onReady: () => void
}

export function VoiceRecorderOnboarding({ onDismiss, onReady }: VoiceRecorderOnboardingProps) {
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null)

  const faqs = [
    {
      id: 'how-to-start',
      question: 'How do I start recording?',
      answer: 'Tap the large microphone button to begin. Allow microphone permission when prompted by your browser.',
    },
    {
      id: 'how-to-stop',
      question: 'How do I stop recording?',
      answer: 'Tap the same button again to stop. Your recording will be ready to preview.',
    },
    {
      id: 'can-i-restart',
      question: 'Can I start over?',
      answer: 'Yes! After recording, you can cancel and start a new recording. Just tap the X button.',
    },
    {
      id: 'make-mistake',
      question: 'What if I make a mistake?',
      answer: 'Don\'t worry. The AI understands natural speech, pauses, and corrections. Just keep talking and correct yourself naturally.',
    },
    {
      id: 'listen-before',
      question: 'Can I listen to my recording before analysis?',
      answer: 'Absolutely! After recording, you can play it back using the play button. Review it before saving.',
    },
    {
      id: 'duration',
      question: 'How long should my recording be?',
      answer: '30 seconds to 3 minutes is ideal, but you can record as long as you need. Keep it as detailed as you\'d like.',
    },
    {
      id: 'what-to-say',
      question: 'What should I include in my recording?',
      answer: 'Talk naturally about what you remember: the setting, your emotions, people or creatures, recurring symbols, and how it ended.',
    },
  ]

  const toggleFaq = (id: string) => {
    setExpandedFaqId(expandedFaqId === id ? null : id)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <Card className="w-full max-w-md shadow-2xl animate-in slide-in-from-bottom duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                Recording Tips
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Common questions about recording your dreams
              </CardDescription>
            </div>
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors mt-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
          {/* FAQs */}
          <div className="space-y-1">
            {faqs.map((faq) => (
              <div key={faq.id} className="border border-border/40 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors flex items-start justify-between gap-2"
                >
                  <span className="text-sm font-medium text-foreground">{faq.question}</span>
                  <span className={`text-primary text-lg transition-transform flex-shrink-0 ${expandedFaqId === faq.id ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                
                {expandedFaqId === faq.id && (
                  <div className="px-4 py-3 bg-secondary/30 border-t border-border/40">
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-border/40">
            <Button
              size="sm"
              variant="outline"
              onClick={onDismiss}
              className="flex-1 mt-3"
            >
              Close
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={onReady}
              className="flex-1 mt-3"
            >
              Got It
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
