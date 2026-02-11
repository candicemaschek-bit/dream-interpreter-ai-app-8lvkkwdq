import React, { useEffect, useState } from 'react'
import { initializeDatabase, isMigrationComplete, MigrationStep, removeMigrationListener } from '../utils/databaseMigration'
import { NebulaSpinner } from './NebulaSpinner'
import { FactCarousel } from './FactCarousel'
import { motion, AnimatePresence } from 'framer-motion'

interface MigrationGuardProps {
  children: React.ReactNode
}

/**
 * MigrationGuard
 * Blocks rendering of children until database migration is complete.
 */
export function MigrationGuard({ children }: MigrationGuardProps) {
  const [ready, setReady] = useState(isMigrationComplete())
  const [step, setStep] = useState<MigrationStep>('scanning')
  const [details, setDetails] = useState('Scanning the dreamscape...')

  useEffect(() => {
    if (ready) return

    const handleStepChange = (newStep: MigrationStep, newDetails?: string) => {
      setStep(newStep)
      if (newDetails) setDetails(newDetails)
    }
    
    initializeDatabase(handleStepChange).then(() => {
      setReady(true)
    })

    return () => {
      removeMigrationListener(handleStepChange)
    }
  }, [ready])

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 overflow-hidden">
        {/* Atmospheric Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>

        <div className="relative max-w-md w-full text-center space-y-8 z-10">
          <div className="flex justify-center mb-4">
            <NebulaSpinner />
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <h2 className="text-3xl font-bold font-playfair tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Preparing Your Dream Journal
                </h2>
                <p className="text-lg text-foreground/80 font-medium">
                  {details}
                </p>
              </motion.div>
            </AnimatePresence>
            
            <div className="pt-4 border-t border-border/40">
              <FactCarousel />
            </div>
          </div>
          
          <div className="pt-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
              Synchronizing with the collective unconscious
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
