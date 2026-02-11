import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Moon, Star, Calendar, ArrowRight, Lock, Loader2, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { blink } from '../blink/client';
import { castPatternInsight } from '../utils/databaseCast';
import type { PatternInsight } from '../types/insight';
import type { SubscriptionTier } from '../config/tierCapabilities';
import toast from 'react-hot-toast';

interface WeeklyReflectionCardProps {
  subscriptionTier: SubscriptionTier;
  onUpgrade?: () => void;
}

export function WeeklyReflectionCard({ subscriptionTier, onUpgrade }: WeeklyReflectionCardProps) {
  const [insight, setInsight] = useState<PatternInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dreamCount, setDreamCount] = useState(0);

  const isPremium = subscriptionTier === 'premium' || subscriptionTier === 'vip';

  const fetchWeeklyInsight = async () => {
    try {
      const user = await blink.auth.me();
      
      // Fetch dream count for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const dreams = await blink.db.dreams.list({
        where: { userId: user.id },
        limit: 50 // Get recent dreams
      });

      const recentDreams = dreams.filter((d: any) => new Date(d.createdAt) > sevenDaysAgo);
      setDreamCount(recentDreams.length);

      // Fetch latest weekly summary insight
      const insights = await blink.db.patternInsights.list({
        where: { userId: user.id, insightType: 'weekly_summary' },
        orderBy: { generatedAt: 'desc' },
        limit: 1
      });

      if (insights.length > 0) {
        setInsight(castPatternInsight(insights[0]));
      }
    } catch (error) {
      console.error('Error fetching weekly insight:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyInsight();
  }, []);

  const handleGenerate = async () => {
    if (dreamCount < 3) {
      toast.error(`You need at least 3 dreams this week to generate a reflection. You have ${dreamCount}.`);
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading('Synthesizing your weekly subconscious aura...');

    try {
      const { getValidAuthToken } = await import('../utils/authTokenManager');
      const tokenResult = await getValidAuthToken(true);

      if (!tokenResult.success || !tokenResult.token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('https://8lvkkwdq--generate-weekly-report.functions.blink.new', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenResult.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate report');
      }

      const newInsight = await response.json();
      setInsight(castPatternInsight(newInsight));
      toast.success('Your weekly reflection is ready!', { id: toastId });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate reflection', { id: toastId });
    } finally {
      setIsGenerating(true); // Keep in generating state for a moment for transition
      setTimeout(() => setIsGenerating(false), 500);
    }
  };

  const handleUnlock = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.location.href = '/pricing';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-primary/20">
        <CardContent className="py-12 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse font-medium">
            Scanning your subconscious patterns...
          </p>
        </CardContent>
      </Card>
    );
  }

  // If user is not premium, show the teaser/locked state
  if (!isPremium) {
    return (
      <Card className="w-full relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent opacity-50 group-hover:opacity-70 transition-opacity" />
        
        <CardContent className="relative p-6 pt-10 flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">Weekly Reflection</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Unlock a deep-dive analysis of your dreams over the past 7 days. Discover recurring themes and psychological patterns.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <div className="p-3 bg-secondary/50 rounded-xl border border-primary/10">
              <BarChart3 className="w-5 h-5 text-primary mb-1 mx-auto" />
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Theme Trends</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-xl border border-primary/10">
              <Star className="w-5 h-5 text-primary mb-1 mx-auto" />
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Pattern IQ</p>
            </div>
          </div>

          <Button 
            className="w-full max-w-xs bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 transition-all"
            onClick={handleUnlock}
          >
            Upgrade to Unlock
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If no insight exists yet
  if (!insight) {
    return (
      <Card className="w-full bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            {isGenerating ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <Moon className="w-6 h-6 text-primary" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold">
              {isGenerating ? "Synthesizing Aura..." : "Aura is Building..."}
            </h3>
            <p className="text-sm text-muted-foreground">
              {dreamCount < 3 
                ? `Log ${3 - dreamCount} more dreams this week to generate your first weekly report.`
                : isGenerating 
                  ? "We are analyzing your subconscious patterns from the past 7 days."
                  : "Your weekly report is ready to be synthesized!"}
            </p>
          </div>
          
          {dreamCount < 3 ? (
            <div className="flex justify-center gap-1 mt-4">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-8 h-1.5 rounded-full ${i < dreamCount ? 'bg-primary' : 'bg-secondary'}`} 
                />
              ))}
            </div>
          ) : (
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="mt-2 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
              variant="outline"
            >
              {isGenerating ? "Analyzing..." : "Generate Reflection"}
              {!isGenerating && <Sparkles className="w-4 h-4 ml-2" />}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Beautiful active reflection state
  return (
    <Card className="w-full relative overflow-hidden border-primary/20 bg-background/50 backdrop-blur-sm">
      <div className="absolute top-0 right-0 p-4">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 flex gap-1 items-center">
          <Sparkles className="w-3 h-3" />
          VIP Insight
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-primary mb-1">
          <Calendar className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Weekly Retrospective</span>
        </div>
        <CardTitle className="text-2xl font-playfair bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {insight.title}
        </CardTitle>
        <CardDescription>
          Generated on {new Date(insight.generatedAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-foreground/80 first-letter:text-3xl first-letter:font-playfair first-letter:mr-1 first-letter:float-left first-letter:text-primary">
          {insight.description}
        </p>

        <div className="pt-4 border-t border-primary/10 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Subconscious Alignment</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${insight.confidence * 100}%` }}
                  className="h-full bg-primary"
                />
              </div>
              <span className="text-xs font-medium">{Math.round(insight.confidence * 100)}%</span>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="text-xs text-primary group">
            Full Report
            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
