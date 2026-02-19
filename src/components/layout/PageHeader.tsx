import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../ui/button'
import { ArrowLeft, Menu, X } from 'lucide-react'
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
  logoSrc = '/DW-logo.png', 
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
    { label: 'Home', onClick: () => navigate('/') },
    { label: 'How It Works', onClick: () => scrollToSection('how-it-works') },
    { label: 'Pricing', onClick: () => navigate('/pricing') },
    { label: 'Contact', onClick: () => navigate('/contact') },
  ]

  return (
    <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <img src={logoSrc} alt={title} className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform" />
            <div className="text-xl font-bold font-sans tracking-tight hidden sm:block bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent">{title}</div>
          </div>

          {/* Desktop Navigation */}
          {showNavLinks && (
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={link.onClick}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </button>
              ))}
              
              <div className="h-4 w-px bg-border mx-1" />
              <ThemeToggle />
              
              {user ? (
                <Button onClick={() => navigate('/dashboard')} className="font-semibold shadow-md bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 text-white border-0 hover:scale-105 transition-all">
                  Dashboard
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={() => navigate('/signup?mode=signin')}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/signup?mode=signup')} className="font-semibold shadow-md bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 text-white border-0 hover:scale-105 transition-all">
                    Start Free
                  </Button>
                </div>
              )}
            </nav>
          )}

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 md:hidden">
            {showBackButton && (
              <Button variant="ghost" size="sm" onClick={() => navigate(backRoute)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <ThemeToggle />
            <button
              className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t space-y-4 px-4 pb-6 bg-background/95 backdrop-blur-xl absolute left-0 right-0 top-16 border-b shadow-xl animate-in slide-in-from-top-5 z-50">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={link.onClick}
                className="block w-full text-left text-lg font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-border/50"
              >
                {link.label}
              </button>
            ))}
            
            <div className="flex flex-col gap-3 pt-4">
              {user ? (
                <Button size="lg" className="w-full justify-center font-bold bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 text-white border-0" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="lg" className="w-full justify-center font-medium h-12" onClick={() => navigate('/signup?mode=signin')}>
                    Sign In
                  </Button>
                  <Button size="lg" className="w-full justify-center font-bold shadow-md bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 text-white border-0 h-12" onClick={() => navigate('/signup?mode=signup')}>
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
