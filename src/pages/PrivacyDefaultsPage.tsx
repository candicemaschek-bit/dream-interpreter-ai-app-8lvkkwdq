/**
 * Privacy Defaults Explanation Page
 * 
 * Shown after onboarding to explain:
 * - What redaction is enabled by default (trauma, sexuality)
 * - Why these defaults exist
 * - How to customize
 * - Links to full Privacy Policy
 */

import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { PageFooter } from '../components/layout/PageFooter'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import {
  Shield,
  Lock,
  EyeOff,
  CheckCircle2,
  Settings,
  ChevronRight,
  Brain,
  Smartphone,
  Heart,
  FileText,
  ExternalLink,
  Sparkles,
  AlertTriangle
} from 'lucide-react'

export function PrivacyDefaultsPage() {
  const navigate = useNavigate()

  const handleContinueToDashboard = () => {
    navigate('/dashboard')
  }

  const handleGoToSettings = () => {
    navigate('/profile')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-background to-blue-50 flex flex-col">
      <PageHeader showBackButton={false} logoSrc="/dreamcatcher-logo.png" />
      
      <div className="flex-1 py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-4 pt-4">
            <h1 className="text-3xl font-bold">Your Privacy is Protected</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              DREAMWORLDS is designed with your privacy at its core. 
              Here's how we protect your most personal dream content.
            </p>
          </div>

          {/* Default Redactions Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <EyeOff className="w-6 h-6 text-primary" />
                <div>
                  <CardTitle>What's Protected by Default</CardTitle>
                  <CardDescription>
                    We automatically redact sensitive content before AI analysis
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {/* Trauma - Enabled by Default */}
                <div className="flex items-start gap-4 p-4 rounded-lg border bg-green-500/5 border-green-500/20">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">💔 Trauma & Loss</span>
                      <Badge variant="default" className="bg-green-600 text-xs">Enabled</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Content related to abuse, death, accidents, grief, and PTSD triggers is automatically 
                      redacted before being sent to cloud AI for analysis.
                    </p>
                  </div>
                </div>

                {/* Sexuality - Enabled by Default */}
                <div className="flex items-start gap-4 p-4 rounded-lg border bg-green-500/5 border-green-500/20">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">💋 Intimate Content</span>
                      <Badge variant="default" className="bg-green-600 text-xs">Enabled</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sexual themes, nudity, and romantic intimacy are automatically protected 
                      to ensure your most personal dreams stay private.
                    </p>
                  </div>
                </div>

                {/* Violence - Disabled by Default */}
                <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-muted">
                    <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-muted-foreground">⚔️ Violence</span>
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Fighting, weapons, and aggression themes can be enabled for redaction in your settings.
                    </p>
                  </div>
                </div>

                {/* Fears - Disabled by Default */}
                <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-muted">
                    <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-muted-foreground">😰 Fears & Phobias</span>
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Common dream fears (falling, chasing, teeth falling out) can be enabled for redaction.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why These Defaults Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-primary" />
                <div>
                  <CardTitle>Why These Defaults?</CardTitle>
                  <CardDescription>
                    Our privacy-first approach protects you from day one
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-700 dark:text-blue-400">On-Device First</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sensitive content is classified locally on your device before any cloud upload. 
                    Your data never leaves unless you allow it.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-700 dark:text-purple-400">Opt-In Analysis</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pattern recognition and deep analysis are opt-in features. 
                    You control exactly what gets analyzed.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-700 dark:text-green-400">Privacy by Design</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We chose these defaults based on what most users consider deeply personal. 
                    Dreams about trauma and intimacy deserve extra protection.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5 text-amber-600" />
                    <span className="font-medium text-amber-700 dark:text-amber-400">Better Insights</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    With trust established, you can choose to enable more detailed analysis later. 
                    Our AI still provides meaningful interpretations while respecting your boundaries.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customization Card */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-primary" />
                <div>
                  <CardTitle>Customize Anytime</CardTitle>
                  <CardDescription>
                    Your privacy settings are always adjustable
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You're in control. Visit your profile settings at any time to:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  Enable or disable specific content redaction types
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  Turn on pattern recognition for deeper dream analysis
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  Toggle cloud AI analysis on or off completely
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  Export or delete your data at any time
                </li>
              </ul>

              <Button variant="outline" onClick={handleGoToSettings} className="w-full mt-4">
                <Settings className="w-4 h-4 mr-2" />
                Go to Privacy Settings
              </Button>
            </CardContent>
          </Card>

          {/* Legal Links */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <Link 
                  to="/privacy" 
                  className="text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Full Privacy Policy
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <Link 
                  to="/terms" 
                  className="text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Terms of Service
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <a 
                  href="mailto:privacy@dreamworlds.io" 
                  className="text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Contact Privacy Team
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <div className="flex flex-col items-center gap-4 pt-4">
            <Button onClick={handleContinueToDashboard} size="lg" className="px-12">
              <Sparkles className="w-5 h-5 mr-2" />
              Continue to Dashboard
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              By continuing, you acknowledge that you've reviewed our privacy defaults.
            </p>
          </div>
        </div>
      </div>
      <PageFooter />
    </div>
  )
}
