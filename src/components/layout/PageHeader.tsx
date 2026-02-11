import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  showBackButton?: boolean
  backRoute?: string
  logoSrc?: string
  title?: string
}

export function PageHeader({ showBackButton = true, backRoute = '/', logoSrc = '/dreamcatcher-logo.png', title = 'DREAMWORLDS' }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logoSrc} alt={title} className="w-8 h-8 object-contain" />
            <div className="text-lg sm:text-xl font-bold font-sans tracking-tight hidden sm:block">{title}</div>
          </div>

          {showBackButton && (
            <Button variant="outline" onClick={() => navigate(backRoute)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
