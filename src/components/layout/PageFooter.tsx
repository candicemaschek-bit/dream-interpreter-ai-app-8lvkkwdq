import { useNavigate } from 'react-router-dom'

interface PageFooterProps {
  logoSrc?: string
  logoAlt?: string
  title?: string
}

export function PageFooter({ logoSrc = '/dreamcatcher-logo.png', logoAlt = 'Dreamworlds', title = 'DREAMWORLDS' }: PageFooterProps) {
  const navigate = useNavigate()

  return (
    <footer className="py-16 px-6 bg-gradient-to-t from-primary/5 to-transparent border-t">
      <div className="max-w-6xl mx-auto text-center">
        <div className="mb-8 flex flex-col items-center">
          <img src={logoSrc} alt={logoAlt} className="w-12 h-12 object-contain mb-3 drop-shadow-md" />
          <p className="text-lg font-bold font-sans tracking-tight">{title}</p>
        </div>
        <p className="text-muted-foreground mb-6 font-sans">
          Decode your dreams. Understand your symbols. Explore your inner world.
        </p>
        <div className="flex justify-center gap-6 text-sm mb-8 flex-wrap">
          <button onClick={() => navigate('/privacy')} className="hover:text-primary transition-colors font-sans">
            Privacy
          </button>
          <span className="text-border">•</span>
          <button onClick={() => navigate('/terms')} className="hover:text-primary transition-colors font-sans">
            Terms
          </button>
          <span className="text-border">•</span>
          <button onClick={() => navigate('/contact')} className="hover:text-primary transition-colors font-sans">
            Contact
          </button>
          <span className="text-border">•</span>
          <button onClick={() => navigate('/help-center')} className="hover:text-primary transition-colors font-sans">
            Help
          </button>
        </div>
        <p className="text-xs text-muted-foreground font-sans">
          © 2025 Dreamworlds. All rights reserved.
        </p>
      </div>
    </footer>
  )
}