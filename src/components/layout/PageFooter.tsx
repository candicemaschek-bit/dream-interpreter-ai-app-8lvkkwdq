import { useNavigate } from 'react-router-dom'

interface PageFooterProps {
  logoSrc?: string
  logoAlt?: string
  title?: string
}

export function PageFooter({ logoSrc = '/dreamworlds-logo.png', logoAlt = 'Dreamworlds', title = 'DREAMWORLDS' }: PageFooterProps) {
  const navigate = useNavigate()

  return (
    <footer className="py-20 px-6 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent border-t">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 text-left">
          <div className="md:col-span-2">
            <div className="mb-6 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img src={logoSrc} alt={logoAlt} className="w-10 h-10 object-contain drop-shadow-md" />
              <p className="text-xl font-bold font-sans tracking-tight dream-gradient-text">{title}</p>
            </div>
            <p className="text-muted-foreground mb-8 font-sans max-w-sm leading-relaxed">
              Dreamworlds is an evolving ecosystem of intelligent tools that transform subconscious signals into meaningful self-discovery. Capture, interpret, and visualize your inner world.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-foreground uppercase tracking-wider text-sm">Platform</h4>
            <ul className="space-y-4 text-muted-foreground text-sm">
              <li><button onClick={() => navigate('/')} className="hover:text-primary transition-colors">Home</button></li>
              <li><button onClick={() => navigate('/pricing')} className="hover:text-primary transition-colors">Pricing</button></li>
              <li><button onClick={() => navigate('/signup')} className="hover:text-primary transition-colors">Get Started</button></li>
              <li><button onClick={() => navigate('/early-access')} className="hover:text-primary transition-colors">Early Access</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-foreground uppercase tracking-wider text-sm">Legal & Support</h4>
            <ul className="space-y-4 text-muted-foreground text-sm">
              <li><button onClick={() => navigate('/privacy')} className="hover:text-primary transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => navigate('/terms')} className="hover:text-primary transition-colors">Terms of Service</button></li>
              <li><button onClick={() => navigate('/contact')} className="hover:text-primary transition-colors">Contact Us</button></li>
              <li><button onClick={() => navigate('/help-center')} className="hover:text-primary transition-colors">Help Center</button></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-muted-foreground font-sans">
            © 2025 Dreamworlds. Built for the dreamers, by the visionaries. All rights reserved.
          </p>
          <div className="flex gap-6 text-muted-foreground">
             <a href="https://twitter.com/dreamworldsio" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
               <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
             </a>
          </div>
        </div>
      </div>
    </footer>
  )
}