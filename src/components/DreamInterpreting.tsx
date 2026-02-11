import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Brain, Eye, Wand2 } from 'lucide-react'
import { Progress } from './ui/progress'

interface DreamInterpretingProps {
  stage: 'analyzing' | 'interpreting' | 'generating' | 'complete'
}

export function DreamInterpreting({ stage }: DreamInterpretingProps) {
  const stageConfig = {
    analyzing: {
      title: 'Analyzing Your Dream',
      subtitle: 'Identifying dream symbols and patterns...',
      details: 'Examining the core elements, emotions, and narrative structure of your dream to understand its deeper meaning.',
      progress: 35,
      icon: Brain,
      color: 'from-blue-500 to-indigo-500'
    },
    interpreting: {
      title: 'Interpreting Meanings',
      subtitle: 'Connecting meanings to your personal context...',
      details: 'Drawing from psychological frameworks and symbolism databases to craft your personalized interpretation.',
      progress: 70,
      icon: Eye,
      color: 'from-purple-500 to-pink-500'
    },
    generating: {
      title: 'Creating Visualization',
      subtitle: 'Generating your personalized dream visualization...',
      details: 'Transforming your dream into a stunning visual representation that captures its essence and emotional tone.',
      progress: 90,
      icon: Wand2,
      color: 'from-violet-500 to-fuchsia-500'
    },
    complete: {
      title: 'Complete',
      subtitle: 'Revealing your dream insights...',
      details: 'Preparing your comprehensive dream interpretation and visualization.',
      progress: 100,
      icon: Sparkles,
      color: 'from-green-500 to-emerald-500'
    }
  }

  const currentStage = stageConfig[stage]
  const StageIcon = currentStage.icon

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-indigo-950 via-purple-900 to-violet-950"
    >
      <div className="text-center space-y-8 px-4">
        {/* Animated Dreamcatcher */}
        <motion.div
          animate={{
            rotate: [-3, 3, -3],
            y: [-10, 10, -10]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative w-40 h-40 mx-auto"
        >
          {/* Outer Circle */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-4 border-purple-300/40"
          />
          
          {/* Inner Web */}
          <svg
            viewBox="0 0 160 160"
            className="absolute inset-0 w-full h-full"
          >
            {/* Web Pattern */}
            <motion.circle
              cx="80"
              cy="80"
              r="60"
              stroke="rgba(167, 139, 250, 0.3)"
              strokeWidth="2"
              fill="none"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <motion.circle
              cx="80"
              cy="80"
              r="40"
              stroke="rgba(167, 139, 250, 0.4)"
              strokeWidth="2"
              fill="none"
              animate={{ rotate: [360, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
            <motion.circle
              cx="80"
              cy="80"
              r="20"
              stroke="rgba(167, 139, 250, 0.5)"
              strokeWidth="2"
              fill="none"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Radial Lines */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <line
                key={angle}
                x1="80"
                y1="80"
                x2={80 + 60 * Math.cos((angle * Math.PI) / 180)}
                y2={80 + 60 * Math.sin((angle * Math.PI) / 180)}
                stroke="rgba(167, 139, 250, 0.3)"
                strokeWidth="1"
              />
            ))}
          </svg>

          {/* Center Sparkle */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-purple-300" />
          </motion.div>

          {/* Floating Particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [-20, 20, -20],
                x: [Math.sin(i) * 10, Math.sin(i + Math.PI) * 10, Math.sin(i) * 10],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 3 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="absolute w-2 h-2 bg-purple-300 rounded-full"
              style={{
                left: `${50 + 40 * Math.cos((i * Math.PI * 2) / 8)}%`,
                top: `${50 + 40 * Math.sin((i * Math.PI * 2) / 8)}%`
              }}
            />
          ))}
        </motion.div>

        {/* Enhanced Progress Information */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-6 max-w-md mx-auto"
          >
            {/* Stage Icon with Gradient Background */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${currentStage.color} flex items-center justify-center shadow-lg`}
            >
              <StageIcon className="w-8 h-8 text-white" />
            </motion.div>

            {/* Stage Title */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-serif text-white font-bold">
                {currentStage.title}
              </h2>
              <p className="text-lg text-purple-200 font-medium">
                {currentStage.subtitle}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-purple-300 font-medium">Progress</span>
                <span className="text-purple-100 font-bold">{currentStage.progress}%</span>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative"
              >
                <Progress 
                  value={currentStage.progress} 
                  className="h-3 bg-purple-900/50"
                />
              </motion.div>
            </div>

            {/* Detailed Information Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 shadow-xl"
            >
              <p className="text-sm text-purple-100 leading-relaxed text-center">
                {currentStage.details}
              </p>
            </motion.div>

            {/* Stage Dots */}
            <div className="flex justify-center gap-3 pt-2">
              {['analyzing', 'interpreting', 'generating', 'complete'].map((s, i) => (
                <motion.div
                  key={s}
                  animate={{
                    scale: s === stage ? [1, 1.3, 1] : 1,
                    opacity: ['analyzing', 'interpreting', 'generating', 'complete'].indexOf(stage) >= i ? 1 : 0.4
                  }}
                  transition={{ duration: 0.5, repeat: s === stage ? Infinity : 0, repeatDelay: 0.5 }}
                  className={`w-2.5 h-2.5 rounded-full ${
                    ['analyzing', 'interpreting', 'generating', 'complete'].indexOf(stage) >= i
                      ? 'bg-purple-300 shadow-lg shadow-purple-500/50'
                      : 'bg-purple-600'
                  }`}
                />
              ))}
            </div>

            {/* Helpful Tip */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-xs text-purple-300 text-center italic"
            >
              This usually takes 20-40 seconds • Hang tight, we're crafting something special! ✨
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
