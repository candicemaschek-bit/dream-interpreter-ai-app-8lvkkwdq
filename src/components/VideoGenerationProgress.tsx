import { useEffect, useState } from 'react';
import { Loader2, Sparkles, Film, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

interface VideoGenerationProgressProps {
  stage: 'generating-frames' | 'composing-video' | 'uploading' | 'complete';
  currentFrame?: number;
  totalFrames?: number;
}

export function VideoGenerationProgress({ 
  stage, 
  currentFrame = 0, 
  totalFrames = 3 
}: VideoGenerationProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Calculate progress based on stage and frame
    let targetProgress = 0;
    
    switch (stage) {
      case 'generating-frames':
        targetProgress = (currentFrame / totalFrames) * 60; // 0-60%
        break;
      case 'composing-video':
        targetProgress = 75; // 75%
        break;
      case 'uploading':
        targetProgress = 90; // 90%
        break;
      case 'complete':
        targetProgress = 100; // 100%
        break;
    }

    // Animate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev < targetProgress) {
          return Math.min(prev + 2, targetProgress);
        }
        return prev;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [stage, currentFrame, totalFrames]);

  const getStageInfo = () => {
    switch (stage) {
      case 'generating-frames':
        return {
          icon: Sparkles,
          title: 'Generating Dream Frames',
          description: `Creating cinematic frame ${currentFrame} of ${totalFrames}...`,
          color: 'text-purple-500'
        };
      case 'composing-video':
        return {
          icon: Film,
          title: 'Composing Video',
          description: 'Combining frames into your dream video...',
          color: 'text-violet-500'
        };
      case 'uploading':
        return {
          icon: Wand2,
          title: 'Finalizing',
          description: 'Saving your dream video...',
          color: 'text-indigo-500'
        };
      case 'complete':
        return {
          icon: Film,
          title: 'Complete!',
          description: 'Your dream video is ready',
          color: 'text-green-500'
        };
    }
  };

  const stageInfo = getStageInfo();
  const Icon = stageInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-card rounded-2xl shadow-2xl p-8 max-w-md w-full border border-border"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ 
              rotate: stage === 'generating-frames' ? 360 : 0,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity }
            }}
            className={`w-16 h-16 rounded-full bg-secondary flex items-center justify-center ${stageInfo.color}`}
          >
            <Icon className="w-8 h-8" />
          </motion.div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-serif font-bold text-center mb-2">
          {stageInfo.title}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground text-center mb-6">
          {stageInfo.description}
        </p>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">
            {Math.round(progress)}% complete
          </p>
        </div>

        {/* Loading Indicator */}
        {stage !== 'complete' && (
          <div className="flex items-center justify-center mt-6 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              This may take a few moments...
            </span>
          </div>
        )}

        {/* Frame Counter */}
        {stage === 'generating-frames' && (
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: totalFrames }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0.3 }}
                animate={{ 
                  scale: i < currentFrame ? 1 : 0.8,
                  opacity: i < currentFrame ? 1 : 0.3
                }}
                className={`w-3 h-3 rounded-full ${
                  i < currentFrame ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
