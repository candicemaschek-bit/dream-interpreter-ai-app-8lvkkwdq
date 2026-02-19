import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { ArrowRight, Star, Film, X, Menu, Sparkles } from 'lucide-react'
import { NewsletterDialog } from '../components/NewsletterDialog'
import { SEOHead } from '../components/SEOHead'
import { ShareAppButton } from '../components/ShareAppButton'
import { blink } from '../blink/client'
import { PageHeader } from '../components/layout/PageHeader'
import { PageFooter } from '../components/layout/PageFooter'

const HERO_IMAGE = 'https://storage.googleapis.com/blink-core-storage/projects/dream-interpreter-ai-app-8lvkkwdq/images/generated-image-1764589625044-0.webp'
const HOW_IT_WORKS_IMAGE = 'https://storage.googleapis.com/blink-core-storage/projects/dream-interpreter-ai-app-8lvkkwdq/images/generated-image-1764589628914-0.webp'
const ECOSYSTEM_IMAGE = 'https://storage.googleapis.com/blink-core-storage/projects/dream-interpreter-ai-app-8lvkkwdq/images/generated-image-1764589627596-0.webp'
const CINEMATICS_IMAGE = 'https://storage.googleapis.com/blink-core-storage/projects/dream-interpreter-ai-app-8lvkkwdq/images/generated-image-1764589629527-0.webp'

export function LandingPage() {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [newsletterOpen, setNewsletterOpen] = useState(false)
  
  // Load Elfsight script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = "https://elfsightcdn.com/platform.js"
    script.async = true
    document.body.appendChild(script)
    
    // Handle hash scrolling after script load or on mount
    const hash = window.location.hash
    if (hash === '#how-it-works') {
      setTimeout(() => {
        const element = document.getElementById('how-it-works')
        element?.scrollIntoView({ behavior: 'smooth' })
      }, 500)
    }
    
    return () => {
      const existingScript = document.querySelector('script[src="https://elfsightcdn.com/platform.js"]')
      if (existingScript) {
        document.body.removeChild(existingScript)
      }
    }
  }, [])

  // CRITICAL: Redirect authenticated users to dashboard (prevents back button returning to homepage)
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      if (!state.isLoading && state.user) {
        // User is authenticated, redirect to dashboard with replace to prevent back button issues
        navigate('/dashboard', { replace: true })
      }
    })
    
    return () => unsubscribe()
  }, [navigate])

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false)
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <SEOHead page="home" />
      <div className="min-h-screen bg-background relative selection:bg-primary/20">
        {/* Subtle global gradient overlay for more color depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.05),transparent_50%),radial-gradient(circle_at_bottom_left,hsl(var(--accent)/0.05),transparent_50%)] pointer-events-none fixed z-0"></div>
        
        <div className="relative z-10">
          <PageHeader />

          {/* Elfsight Number Counter Widget */}
          <div className="elfsight-app-77c57c55-5c10-4e9f-bfdf-853eeea3a9b4" data-elfsight-app-lazy></div>

          {/* HERO SECTION */}
          <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
            {/* Background Hero Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src={HERO_IMAGE}
                alt="Mystical dreamscape with ethereal clouds and starry night sky representing subconscious mind exploration"
                className="w-full h-full object-cover scale-105 animate-slow-zoom"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
              <div className="absolute inset-0 bg-black/10"></div>
            </div>

            {/* Hero Content */}
            <div className="relative z-10 pt-20 pb-20 px-6 text-center max-w-5xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect text-xs font-bold mb-8 animate-fade-in uppercase tracking-widest text-primary border-primary/20">
                <Sparkles className="w-3 h-3" />
                Experience the Subconscious
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 font-sans dream-gradient-text drop-shadow-md leading-[1.1] tracking-tight animate-slide-up">
                Turn Your Dreams into Cinematic Realities
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 leading-relaxed text-foreground font-medium font-sans max-w-3xl mx-auto animate-slide-up [animation-delay:200ms]">
                Powered by Dreamcatcher AI: Capture, Interpret, and Visualize Your Subconscious Journeys.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 animate-slide-up [animation-delay:400ms]">
                <Button size="lg" onClick={() => navigate('/signup?tier=free')} className="h-14 px-8 text-lg font-bold shadow-2xl shadow-primary/20 bg-gradient-to-r from-violet-600 to-fuchsia-500 border-0 hover:scale-105 active:scale-95 transition-all gap-2">
                  Explore Your Mind FREE <ArrowRight className="w-5 h-5" />
                </Button>
                <ShareAppButton size="lg" variant="outline" className="h-14 px-8 glass-effect border-primary/20 hover:bg-primary/5" />
              </div>
            </div>
            
            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
              <div className="w-1 h-12 rounded-full bg-gradient-to-b from-primary to-transparent"></div>
            </div>
          </section>

          {/* DREAMCATCHER AI SECTION */}
          <section className="py-24 px-6 relative overflow-hidden">
            <div className="max-w-4xl mx-auto text-center relative z-10">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-sans tracking-tight">Dreamcatcher AI</h2>
              <h3 className="text-2xl md:text-3xl font-semibold mb-12 text-primary font-sans">Your Gateway to Self-Discovery</h3>

              <div className="grid md:grid-cols-2 gap-8 mb-16">
                <div className="dream-card text-left group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="text-xl font-bold mb-3">Symbol Decoder</h4>
                  <p className="text-muted-foreground">Instantly decode your subconscious symbols with advanced psychological mapping.</p>
                </div>
                <div className="dream-card text-left group">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Film className="w-6 h-6 text-accent" />
                  </div>
                  <h4 className="text-xl font-bold mb-3">Visual Synthesis</h4>
                  <p className="text-muted-foreground">Transform dream data into stunning AI-generated imagery and atmospheric video.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/signup?tier=free')} className="h-14 px-8 font-bold">
                  Decode Your First Dream
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/pricing')} className="h-14 px-8 glass-effect">
                  Explore Plans
                </Button>
              </div>
              <p className="text-muted-foreground mt-6 font-medium">No credit card required • 2 Lifetime Analyses Free</p>
            </div>
          </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 md:py-24 px-6 text-center">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-sans">HOW IT WORKS</h2>
          <h3 className="text-2xl md:text-3xl font-semibold mb-12 md:mb-16 text-primary font-sans">A Simple Path Into Your Inner World</h3>

          {/* Steps */}
          <div className="space-y-6 mb-12">
            <div className="text-center">
              <div className="inline-block mb-4 p-3 bg-primary/10 rounded-full">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h4 className="text-xl md:text-2xl font-bold mb-2 font-sans">Capture your Dream</h4>
                <p className="text-base md:text-lg font-sans">Capture your dream using text or voice.
                  Your dreams are kept safe and private in your personal Dream Library.</p>
            </div>

            <div className="text-center">
              <div className="inline-block mb-4 p-3 bg-primary/10 rounded-full">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h4 className="text-xl md:text-2xl font-bold mb-2 font-sans">Unpack Personal Symbols</h4>
                <p className="text-base md:text-lg font-sans">See patterns, archetypes, and emotional themes gently revealed.
                  Nothing to memorize. Just explore.
</p>
            </div>

            <div className="text-center">
              <div className="inline-block mb-4 p-3 bg-primary/10 rounded-full">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h4 className="text-xl md:text-2xl font-bold mb-2 font-sans">Reflect & Grow</h4>
                <p className="text-base md:text-lg font-sans">Guided reflections with ReflectAI help you understand feelings and behaviors.
                  Go at your own pace.
</p>
            </div>

            <div className="text-center">
              <div className="inline-block mb-4 p-3 bg-primary/10 rounded-full">
                <span className="text-2xl font-bold text-primary">4</span>
              </div>
              <h4 className="text-xl md:text-2xl font-bold mb-2 font-sans">Deepen the Map</h4>
                <p className="text-base md:text-lg font-sans">Watch connections form across days and weeks through symbol trails and cycles.
                Clarity builds over time.
</p>
            </div>

            <div className="text-center">
              <div className="inline-block mb-4 p-3 bg-primary/10 rounded-full">
                <span className="text-2xl font-bold text-primary">5</span>
              </div>
              <h4 className="text-xl md:text-2xl font-bold mb-2 font-sans">Enter Dreamworlds</h4>
              <p className="text-base md:text-lg font-sans"> The ultimate payoff: A cinematic experience where your dreams form a living, visual map of your subconscious.
                Unlock your cinematic journey—releasing soon.
</p>
            </div>
          </div>

          {/* Image Below Steps */}
          <div className="mb-12 overflow-hidden rounded-lg shadow-2xl max-w-2xl mx-auto relative group">
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-primary/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                <Film className="w-3 h-3" /> CINEMATIC TEASER
              </div>
            </div>
            <img 
              src={HOW_IT_WORKS_IMAGE}
              alt="Teaser visualization of a Dreamworld cinematic experience - transforming symbols into a living landscape"
              className="w-full block transition-transform duration-700 group-hover:scale-110"
              style={{
                aspectRatio: '2/1',
                objectFit: 'cover',
                objectPosition: 'center 20%'
              }}
              loading="lazy"
            />
          </div>

          <div>
            <Button size="lg" onClick={() => navigate('/signup?tier=free')} className="gap-2">
              Capture your First Dream <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-muted-foreground mt-4 font-sans">No credit card required</p>
          </div>
        </div>
      </section>

      {/* DREAM TOOLS ECOSYSTEM */}
      <section id="tools" className="py-24 md:py-32 px-6 text-white relative overflow-hidden">
        {/* Ambient Background for Dark Section */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-sans text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-300">The Dreamworlds Ecosystem</h2>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto font-sans">
              An evolving ecosystem of intelligent tools that transform subconscious signals into meaningful self-discovery. Start free with Dreamcatcher AI and unlock advanced cinematic tools as you grow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Core Tool - Featured */}
            <div className="lg:col-span-1 group relative p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/20 dream-card">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500 blur-2xl"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-3 font-sans text-white flex items-center gap-3">
                  <img src="/dreamworlds-logo.png" alt="Dreamcatcher AI Icon" className="w-8 h-8 object-contain" />
                  Dreamcatcher AI
                </h3>
                <p className="text-base font-sans text-slate-300 mb-4">AI dream interpretations, symbolic insights, and emotional mapping. Your starting point into the ecosystem.</p>
                <div className="inline-block px-3 py-1 bg-violet-500/20 text-violet-200 border border-violet-500/30 rounded-full text-xs font-semibold">Core Tool</div>
              </div>
            </div>

            {/* Premium Tools */}
            <div className="lg:col-span-1 group relative p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:border-white/20 dream-card">
              <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-300 blur-xl"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 font-sans text-white">Symbol Orchard</h3>
                <p className="text-sm text-slate-400 mb-3 font-sans">SymbolicaAI: A living library of symbols, patterns, motifs, and archetypes gathered from your dreams.</p>
                <div className="inline-block px-3 py-1 bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/30 rounded-full text-xs font-semibold">Premium+</div>
              </div>
            </div>

            <div className="lg:col-span-1 group relative p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:border-white/20 dream-card">
              <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-300 blur-xl"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 font-sans text-white">Reflection Journal</h3>
                <p className="text-sm text-slate-400 mb-3 font-sans">ReflectAI: Guided journaling and emotional reflection powered by your dream themes.</p>
                <div className="inline-block px-3 py-1 bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/30 rounded-full text-xs font-semibold">Premium+</div>
              </div>
            </div>

            {/* Coming Soon Tools */}
            <div className="lg:col-span-1 group relative p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all duration-300 dream-card">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-300 blur-xl"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 font-sans text-slate-200">Guidance & Mindfulness</h3>
                <p className="text-sm text-slate-500 mb-3 font-sans">LumenAI: Emotional guidance and mindfulness practices based on patterns from your dreams.</p>
                <div className="inline-block px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full text-xs font-semibold">Coming Soon</div>
              </div>
            </div>

            <div className="lg:col-span-1 group relative p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 dream-card">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-300 blur-xl"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 font-sans text-slate-200">Dreamscape</h3>
                <p className="text-sm text-slate-300 mb-3 font-sans">AtlasAI: A visual landscape of your subconscious woven together over time. Explore the collective archetypes.</p>
                <div className="inline-block px-3 py-1 bg-violet-500/20 text-violet-200 border border-violet-500/30 rounded-full text-xs font-semibold">Available Now</div>
              </div>
            </div>

            <div className="lg:col-span-1 group relative p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-900/40 to-slate-900/40 hover:bg-white/10 transition-all duration-300 dream-card">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-300 blur-xl"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 font-sans text-white">Dreamworlds Cinematics</h3>
                <p className="text-sm text-slate-300 mb-3 font-sans">Experience your subconscious in a whole new way.
                Your dreams and symbols will be transformed into a personalized cinematic journey—combining sound, motion, atmosphere, and emotion.
</p>
              <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold">Join the waitlist to be first to explore.
</div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Button size="lg" onClick={() => navigate('/early-access?tier=visionary')} className="gap-2 bg-white text-slate-900 hover:bg-slate-200 border-0 font-bold">
              Sign up for Early Access <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-slate-400 mt-4 font-sans">Start free with Dreamcatcher AI and unlock premium cinematic tools as your universe grows.</p>
          </div>
        </div>
      </section>

      {/* DREAMWORLDS CINEMATICS */}
      <section className="py-20 md:py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-block mb-6 p-3 bg-accent/10 rounded-full">
            <Star className="w-6 h-6 text-accent" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-sans">DREAMWORLDS CINEMATICS</h2>
          <p className="text-lg text-accent font-semibold mb-8 font-sans">Join 5,478+ dreamers already building their Dream Universe – early access drops soon.</p>
          <h3 className="text-2xl md:text-3xl font-semibold mb-8 font-sans">More Than Interpretation, start decoding your dreams tonight.</h3>

          <p className="text-base md:text-lg mb-10 leading-relaxed font-sans">
            Soon, you'll turn your dream patterns and symbols into a breathtaking cinematic video—sound, motion, atmosphere, and emotion blended into a personalized subconscious journey.
          </p>

          <Button size="lg" onClick={() => navigate('/early-access?tier=vip')} className="gap-2">
            Sign up for Early Access <Star className="w-4 h-4" />
          </Button>
        </div>
      </section>



      {/* TESTIMONIALS & NEWSLETTER MERGED */}
      <section id="testimonials" className="py-20 md:py-24 px-6 bg-gradient-to-br from-primary/8 via-accent/8 to-background text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 md:mb-16 font-sans">What Early Users Are Saying</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="p-8 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex justify-center mb-4">
                <Star className="w-5 h-5 text-accent fill-accent" />
              </div>
              <p className="text-base md:text-lg italic text-foreground font-sans">
                "It feels like therapy, art, and introspection fused together."
              </p>
            </div>
            
            <div className="p-8 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex justify-center mb-4">
                <Star className="w-5 h-5 text-accent fill-accent" />
              </div>
              <p className="text-base md:text-lg italic text-foreground font-sans">
                "Finally understanding why certain dreams repeat… life-changing."
              </p>
            </div>
            
            <div className="p-8 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex justify-center mb-4">
                <Star className="w-5 h-5 text-accent fill-accent" />
              </div>
              <p className="text-base md:text-lg italic text-foreground font-sans">
                "The symbol patterns blew my mind."
              </p>
            </div>
          </div>

          {/* Newsletter Section Merged */}
          <div className="p-8 md:p-12 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 font-sans">Stay Connected to Your Dreams</h3>
            <p className="text-base md:text-lg mb-8 font-sans text-foreground/90">
              Get early features, dream insights, and psychological tools before anyone else.
            </p>
            <Button size="lg" onClick={() => setNewsletterOpen(true)} className="gap-2">
              Join the Dream Letter <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 md:py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-sans">Your Dreamworld is waiting</h2>
          <p className="text-base md:text-lg mb-10 font-sans">Start with Dreamcatcher AI today – free. Capture your dreams and see where they lead.</p>

          <div className="flex justify-center">
            <Button size="lg" onClick={() => navigate('/signup?tier=free')} className="gap-2">
              Start Free <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>



      {/* Footer */}
      <PageFooter logoSrc="/dreamworlds-logo.png" />

      {/* Newsletter Dialog */}
      <NewsletterDialog open={newsletterOpen} onOpenChange={setNewsletterOpen} />
        </div>
    </div>
    </>
  )
}
