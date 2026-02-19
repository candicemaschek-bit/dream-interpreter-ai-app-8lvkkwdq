import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../ui/button'
import { ArrowLeft, Menu, X, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import { ThemeToggle } from '../ui/theme-toggle'
import { blink } from '../../blink/client'

interface PageHeaderProps {
  showBackButton?: boolean
  backRoute?: string
  logoSrc?: string
  title?: string
  showNavLinks?: boolean
}

export function PageHeader({ 
  showBackButton = false, 
  backRoute = '/', 
  logoSrc = '/dreamworlds-logo.png', 
  title = 'DREAMWORLDS',
  showNavLinks = true
}: PageHeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return () => unsubscribe()
  }, [])

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false)
    if (location.pathname !== '/') {
      navigate('/' + (id ? `#${id}` : ''))
      return
    }
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const navLinks = [
    { label: 'Tools', onClick: () => scrollToSection('tools') },
    { label: 'How It Works', onClick: () => scrollToSection('how-it-works') },
    { label: 'Pricing', onClick: () => navigate('/pricing') },
    { label: 'Contact', onClick: () => navigate('/contact') },
  ]

  return (
    <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="relative">
              <img src={logoSrc} alt={title} className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform relative z-10" />
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full scale-0 group-hover:scale-150 transition-transform duration-500"></div>
            </div>
            <div className="text-xl font-bold font-sans tracking-tight hidden sm:block dream-gradient-text drop-shadow-sm">{title}</div>
          </div>

          {/* Desktop Navigation */}
          {showNavLinks && (
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={link.onClick}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-all hover:scale-105 active:scale-95"
                >
                  {link.label}
                </button>
              ))}
              
              <div className="h-4 w-px bg-border/50 mx-1" />
              <ThemeToggle />
              
              {user ? (
                <Button onClick={() => navigate('/dashboard')} className="font-semibold shadow-md bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 text-white border-0 hover:scale-105 transition-all gap-2 px-6">
                  <Sparkles className="w-4 h-4" />
                  Dashboard
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={() => navigate('/signup?mode=signin')} className="hover:bg-primary/5">
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/signup?mode=signup')} className="font-semibold shadow-md bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 text-white border-0 hover:scale-105 transition-all px-6">
                    Start Free
                  </Button>
                </div>
              )}
            </nav>
          )}

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 md:hidden">
            {showBackButton && (
              <Button variant="ghost" size="sm" onClick={() => navigate(backRoute)} className="hover:bg-primary/5">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <ThemeToggle />
            <button
              className="p-2 hover:bg-primary/10 rounded-lg transition-all active:scale-90"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-2 border-t space-y-2 px-4 pb-8 bg-background/98 backdrop-blur-2xl absolute left-0 right-0 top-[64px] border-b shadow-2xl animate-in slide-in-from-top-5 z-50 overflow-y-auto max-h-[calc(100vh-64px)]">
            <div className="pt-6 space-y-2">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={link.onClick}
                  className="block w-full text-left text-xl font-semibold text-foreground hover:text-primary transition-all py-4 px-4 hover:bg-primary/5 rounded-xl border-b border-border/10 last:border-0"
                >
                  {link.label}
                </button>
              ))}
            </div>
            
            <div className="flex flex-col gap-4 pt-8">
              {user ? (
                <Button size="lg" className="w-full justify-center font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 text-white border-0 h-14 rounded-2xl shadow-lg" onClick={() => navigate('/dashboard')}>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="lg" className="w-full justify-center font-semibold h-14 rounded-2xl border-2" onClick={() => navigate('/signup?mode=signin')}>
                    Sign In
                  </Button>
                  <Button size="lg" className="w-full justify-center font-bold shadow-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 text-white border-0 h-14 rounded-2xl" onClick={() => navigate('/signup?mode=signup')}>
                    Start Free
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
