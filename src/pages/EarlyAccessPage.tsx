import { useSearchParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { PageFooter } from '../components/layout/PageFooter'
import { EarlyAccessDialog } from '../components/EarlyAccessDialog'
import { SEOHead } from '../components/SEOHead'

export function EarlyAccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)

  const tier = searchParams.get('tier') || 'visionary'
  const returnTo = searchParams.get('returnTo') || '/pricing'
  const tierMap: { [key: string]: { name: string; description: string } } = {
    'visionary': {
      name: 'Visionary',
      description: 'Our enhanced premium tier with advanced features'
    },
    'vip': {
      name: 'Star',
      description: 'The ultimate DreamWorlds experience with cinema-quality features'
    }
  }

  const tierInfo = tierMap[tier] || tierMap['visionary']

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    // Navigate back to the referring page if dialog closes
    if (!newOpen) {
      setTimeout(() => {
        navigate(returnTo)
      }, 300)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex flex-col">
      <SEOHead page="earlyAccess" />
      <PageHeader showBackButton={true} backRoute={returnTo} />

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-sans font-bold mb-3">{tierInfo.name}</h1>
            <p className="text-lg text-muted-foreground">{tierInfo.description}</p>
          </div>

          <div className="p-8 rounded-lg border border-primary/20 bg-white/50 dark:bg-card/30 text-center">
            <p className="text-foreground mb-6">
              Join the early access list to be notified when this tier launches with exclusive launch pricing.
            </p>
          </div>
        </div>
      </div>

      <PageFooter />

      {/* Early Access Dialog - Opens on page load */}
      <EarlyAccessDialog
        open={open}
        onOpenChange={handleOpenChange}
        tier={tier}
        tierName={tierInfo.name}
      />
    </div>
  )
}
