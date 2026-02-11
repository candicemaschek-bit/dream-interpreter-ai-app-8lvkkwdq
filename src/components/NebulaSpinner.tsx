import React from 'react'
import { motion } from 'framer-motion'

export function NebulaSpinner() {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      {/* Outer Galaxy Ring */}
      <motion.div
        className="absolute inset-0 border-4 border-primary/20 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Middle Galaxy Ring */}
      <motion.div
        className="absolute inset-2 border-2 border-accent/40 rounded-full border-t-accent"
        animate={{ rotate: -360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      {/* Pulsing Moon/Center */}
      <motion.div
        className="relative w-12 h-12 bg-gradient-to-tr from-primary to-accent rounded-full shadow-[0_0_20px_rgba(139,92,246,0.5)]"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
          boxShadow: [
            "0 0 10px rgba(139,92,246,0.3)",
            "0 0 25px rgba(139,92,246,0.6)",
            "0 0 10px rgba(139,92,246,0.3)"
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Subtle Crater highlights */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-white/20 rounded-full" />
        <div className="absolute top-6 left-7 w-3 h-3 bg-white/10 rounded-full" />
        <div className="absolute top-8 left-3 w-1.5 h-1.5 bg-white/15 rounded-full" />
      </motion.div>

      {/* Orbiting Particles */}
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_5px_#fff]"
          initial={{ rotate: angle, translateX: 40 }}
          animate={{ rotate: angle + 360 }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  )
}
