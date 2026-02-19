import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { ThemeToggle } from '../components/ui/theme-toggle'
import { ArrowRight, Star, Menu, X, Sparkles, Heart, Zap, Map, Film } from 'lucide-react'
import { NewsletterDialog } from '../components/NewsletterDialog'
import { SEOHead } from '../components/SEOHead'
import { ShareAppButton } from '../components/ShareAppButton'
import { blink } from '../blink/client'

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
      <div className="min-h-screen bg-background relative">
        {/* Subtle global gradient overlay for more color depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-amber-500/5 pointer-events-none fixed z-0"></div>
        <div className="relative z-10">
      {/* Navigation */}
      <nav className="border-b bg-white/50 dark:bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/DW-logo.png" alt="Dreamworlds Logo" className="w-12 h-12 object-contain drop-shadow-md" />
              <div className="text-xl font-bold font-sans tracking-tight">DREAMWORLDS</div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-8 items-center">
              <button onClick={() => scrollToSection('tools')} className="text-sm font-medium text-foreground hover:text-primary transition-colors">Tools</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-foreground hover:text-primary transition-colors">How It Works</button>
              <button onClick={() => navigate('/pricing')} className="text-sm font-medium text-foreground hover:text-primary transition-colors">Pricing</button>
              
              <div className="h-4 w-px bg-border/50 mx-1" />
              
              <ThemeToggle />
              <ShareAppButton variant="outline" size="sm" className="hidden lg:flex border-primary/20 hover:bg-primary/5 hover:border-primary/50 text-primary" />
              
              <Button variant="ghost" onClick={() => navigate('/signup?mode=signin')} className="font-medium hover:bg-primary/5">
                Sign In
              </Button>
              <Button onClick={() => navigate('/signup?tier=free&mode=signup')} className="font-semibold shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 hover:scale-105 border-0 text-white">
                Start Free
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <button 
                className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t space-y-4 px-4 pb-6 bg-background/95 backdrop-blur-xl absolute left-0 right-0 top-16 border-b shadow-xl animate-in slide-in-from-top-5 z-50">
              <button 
                onClick={() => scrollToSection('tools')} 
                className="block w-full text-left text-lg font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-border/50"
              >
                Tools
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')} 
                className="block w-full text-left text-lg font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-border/50"
              >
                How It Works
              </button>
              <button 
                onClick={() => navigate('/pricing')} 
                className="block w-full text-left text-lg font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-border/50"
              >
                Pricing
              </button>
              
              <div className="flex flex-col gap-3 pt-4">
                <Button variant="outline" size="lg" className="w-full justify-center font-medium h-12" onClick={() => navigate('/signup?mode=signin')}>
                  Sign In
                </Button>
                <Button size="lg" className="w-full justify-center font-bold shadow-md bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 text-white h-12" onClick={() => navigate('/signup?tier=free&mode=signup')}>
                  Start Free
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Elfsight Number Counter Widget */}
      <div className="elfsight-app-77c57c55-5c10-4e9f-bfdf-853eeea3a9b4" data-elfsight-app-lazy></div>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden">
        {/* Background Hero Image */}
        <div className="absolute inset-0 opacity-90 dark:opacity-80">
          <img 
            src={HERO_IMAGE}
            alt="Mystical dreamscape with ethereal clouds and starry night sky representing subconscious mind exploration"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
          
          {/* Aurora Mesh Gradient Effects */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[100px] -translate-y-1/2 mix-blend-screen animate-pulse duration-[4s]"></div>
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[80px] mix-blend-screen"></div>
          <div className="absolute bottom-0 left-1/3 w-[600px] h-[300px] bg-fuchsia-500/20 rounded-full blur-[100px] translate-y-1/2 mix-blend-screen"></div>
        </div>

        {/* Hero Content */}
        <div className="relative pt-20 pb-32 md:pt-32 md:pb-48 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 font-sans bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent drop-shadow-sm leading-tight pb-2">
                  Dreamworlds – Turn Your Dreams into Cinematic Realities
            </h1>
            <p className="text-xl md:text-2xl mb-6 leading-relaxed text-purple-600 font-bold font-sans">
                Powered by Dreamcatcher AI: Capture, Interpret, and Visualize Your Subconscious
            </p>
            <p className="text-base md:text-lg mb-8 leading-relaxed text-foreground font-sans">
                  Start with Dreamcatcher AI to instantly decode your subconscious symbols, track emotional patterns, and find deeper meaning in your nightly journeys. As your library grows, Dreamworlds connects these insights to build your personalized "Dream Universe"—transforming your raw data into an immersive, AI-generated cinematic experience. <br /><br />
            DreamWorlds is where quick interpretation meets deep visualization. It's self-discovery in motion—a film made entirely by your mind.
            </p>

            <div className="flex justify-center gap-4 flex-wrap">
              <Button size="lg" onClick={() => navigate('/signup?tier=free')} className="gap-2">
                  Capture your Dreams FREE <ArrowRight className="w-4 h-4" />
              </Button>
              <ShareAppButton size="lg" variant="outline" />
            </div>
          </div>
        </div>
      </section>

      {/* DREAMCATCHER AI SECTION */}
      <section className="py-20 md:py-24 px-6 bg-white/50 dark:bg-card/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 font-sans">Dreamcatcher AI</h2>
          <h3 className="text-2xl md:text-3xl font-semibold mb-12 text-primary font-sans">Your Gateway to Self-Discovery</h3>

          <p className="mb-6 leading-relaxed text-base md:text-lg font-sans">
              Dreamcatcher AI is the foundation of the Dreamworlds ecosystem. Start with dream interpretation, then unlock deeper tools as your journey evolves.

          </p>

          <p className="mb-10 leading-relaxed text-base md:text-lg font-sans">
            Watch your dreams come alive as rich, five-part interpretations — meaning, symbols, emotions, connections, and guidance — with personalized AI imagery and video.
          </p>

          <div className="flex gap-4 flex-wrap justify-center">
            <Button size="lg" onClick={() => navigate('/signup?tier=free')}>
                Decode Your First Dream

            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>
              Explore Plans
            </Button>
          </div>
          <p className="text-muted-foreground mt-6 font-sans">No credit card required</p>
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
      <section id="tools" className="py-24 md:py-32 px-6 bg-slate-900 text-white relative overflow-hidden">
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
            <div className="lg:col-span-1 group relative p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500 blur-2xl"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-3 font-sans text-white flex items-center gap-3">
                  <img src="/dreamcatcher-logo.png" alt="Dreamcatcher AI Icon" className="w-8 h-8 object-contain" />
                  Dreamcatcher AI
                </h3>
                <p className="text-base font-sans text-slate-300 mb-4">AI dream interpretations, symbolic insights, and emotional mapping. Your starting point into the ecosystem.</p>
                <div className="inline-block px-3 py-1 bg-violet-500/20 text-violet-200 border border-violet-500/30 rounded-full text-xs font-semibold">Core Tool</div>
              </div>
            </div>

            {/* Premium Tools */}
            <div className="lg:col-span-1 group relative p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:border-white/20">
              <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-300 blur-xl"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 font-sans text-white">Symbol Orchard</h3>
                <p className="text-sm text-slate-400 mb-3 font-sans">SymbolicaAI: A living library of symbols, patterns, motifs, and archetypes gathered from your dreams.</p>
                <div className="inline-block px-3 py-1 bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/30 rounded-full text-xs font-semibold">Premium+</div>
              </div>
            </div>

            <div className="lg:col-span-1 group relative p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:border-white/20">
              <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-300 blur-xl"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 font-sans text-white">Reflection Journal</h3>
                <p className="text-sm text-slate-400 mb-3 font-sans">ReflectAI: Guided journaling and emotional reflection powered by your dream themes.</p>
                <div className="inline-block px-3 py-1 bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/30 rounded-full text-xs font-semibold">Premium+</div>
              </div>
            </div>

            {/* Coming Soon Tools */}
            <div className="lg:col-span-1 group relative p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-300 blur-xl"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 font-sans text-slate-200">Guidance & Mindfulness</h3>
                <p className="text-sm text-slate-500 mb-3 font-sans">LumenAI: Emotional guidance and mindfulness practices based on patterns from your dreams.</p>
                <div className="inline-block px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full text-xs font-semibold">Coming Soon</div>
              </div>
            </div>

            <div className="lg:col-span-1 group relative p-8 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-300 blur-xl"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2 font-sans text-slate-200">Dreamscape</h3>
                <p className="text-sm text-slate-300 mb-3 font-sans">AtlasAI: A visual landscape of your subconscious woven together over time. Explore the collective archetypes.</p>
                <div className="inline-block px-3 py-1 bg-violet-500/20 text-violet-200 border border-violet-500/30 rounded-full text-xs font-semibold">Available Now</div>
              </div>
            </div>

            <div className="lg:col-span-1 group relative p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-900/40 to-slate-900/40 hover:bg-white/10 transition-all duration-300">
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
      <footer className="py-16 px-6 bg-gradient-to-t from-primary/8 to-transparent border-t">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <img src="/DW-logo.png" alt="Dreamworlds Logo" className="w-12 h-12 object-contain drop-shadow-md mx-auto mb-3" />
            <p className="text-lg font-bold font-sans tracking-tight">DREAMWORLDS</p>
          </div>
          <p className="text-muted-foreground mb-6 font-sans">
            Decode your dreams. Understand your symbols. Explore your inner world.
          </p>
          
          {/* Share App CTA in Footer */}
          <div className="mb-8">
            <div className="flex justify-center">
              <ShareAppButton size="lg" />
            </div>
            <p className="text-sm text-muted-foreground mt-3 font-sans">
              Help friends discover the magic of dream interpretation
            </p>
          </div>
          
          <div className="flex justify-center gap-6 text-sm mb-8">
            <button onClick={() => navigate('/privacy')} className="hover:text-primary transition-colors font-sans">Privacy</button>
            <span className="text-border">•</span>
            <button onClick={() => navigate('/terms')} className="hover:text-primary transition-colors font-sans">Terms</button>
            <span className="text-border">•</span>
            <button onClick={() => navigate('/contact')} className="hover:text-primary transition-colors font-sans">Contact</button>
          </div>
          <p className="text-xs text-muted-foreground font-sans">
            © 2025 Dreamworlds. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Newsletter Dialog */}
      <NewsletterDialog open={newsletterOpen} onOpenChange={setNewsletterOpen} />
        </div>
    </div>
    </>
  )
}
