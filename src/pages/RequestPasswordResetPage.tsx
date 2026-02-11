import { useNavigate } from 'react-router-dom'
import { RequestPasswordReset } from '../components/RequestPasswordReset'

export function RequestPasswordResetPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <img src="/logo_new.png" alt="Logo" className="w-16 h-16 mx-auto opacity-70" />
          <h1 className="text-4xl font-serif font-bold">Dreamcatcher AI</h1>
          <p className="text-muted-foreground">
            Reset your password to continue your dream journey
          </p>
        </div>

        <RequestPasswordReset onBack={() => navigate('/signup')} />
      </div>
    </div>
  )
}
