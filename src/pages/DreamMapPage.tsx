import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DreamMap } from '../components/DreamMap';
import { PageHeader } from '../components/layout/PageHeader';
import { PageFooter } from '../components/layout/PageFooter';
import { Button } from '../components/ui/button';
import { ArrowLeft, Map as MapIcon, Sparkles, Compass, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { SEOHead } from '../components/SEOHead';

export const DreamMapPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead page="map" />
      
      <PageHeader showBackButton={true} backRoute="/dashboard" />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="-ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <MapIcon className="w-8 h-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-serif font-bold">Dreamscape Cartography</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl">
              An experimental visualization of collective dream regions. Discover how your subconscious navigates the universal landscape of human dreaming.
            </p>
          </div>

          <div className="flex gap-2">
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Dreamscape Area */}
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <DreamMap />
            </motion.div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Compass className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-serif font-bold text-lg">Archetypal Navigation</h3>
                <p className="text-sm text-muted-foreground">
                  Understand the common themes that connect your dreams to the shared human experience.
                </p>
              </div>
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-serif font-bold text-lg">Subconscious Mapping</h3>
                <p className="text-sm text-muted-foreground">
                  See the intensity and frequency of different dream territories based on your entries.
                </p>
              </div>
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <Layers className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-serif font-bold text-lg">Evolving Geometry</h3>
                <p className="text-sm text-muted-foreground">
                  This dreamscape shifts in real-time as new dreams are shared, reflecting the current state of our collective mind.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar / Info */}
          <div className="space-y-6">
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
              <h3 className="font-serif font-bold text-xl mb-4">Dreamscape Legend</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-400 mt-1 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                  <div>
                    <span className="font-bold text-sm block">Emotional Waters</span>
                    <span className="text-xs text-muted-foreground">Dreams of ocean, rain, and deep feelings.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-sky-400 mt-1 shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                  <div>
                    <span className="font-bold text-sm block">Aetheric Flight</span>
                    <span className="text-xs text-muted-foreground">Dreams of flying, falling, and high places.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-emerald-400 mt-1 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                  <div>
                    <span className="font-bold text-sm block">Instinctual Wilds</span>
                    <span className="text-xs text-muted-foreground">Dreams of forests, animals, and nature.</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-background rounded-xl border border-border italic text-xs text-muted-foreground">
                "The dream is a little hidden door in the innermost and most secret recesses of the soul." — Carl Jung
              </div>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border text-center">
              <h4 className="font-serif font-bold mb-2">Want to see your data?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Log your latest dream to help us populate the collective dreamscape.
              </p>
              <div className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded mb-4">
                Adding data to Dreamscape is a Premium+ feature
              </div>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Log New Dream
              </Button>
            </div>
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  );
};