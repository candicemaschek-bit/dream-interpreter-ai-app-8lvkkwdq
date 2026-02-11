import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DREAM_FACTS = [
  "Did you know? We spend about 6 years of our lives dreaming.",
  "Dreams help the brain process emotions and store memories.",
  "Most dreams last between 5 and 20 minutes.",
  "You forget 95% of your dreams within 10 minutes of waking up.",
  "Even blind people dream; those born blind have auditory and tactile dreams.",
  "Inventions like the periodic table and DNA's structure were inspired by dreams.",
  "Ancient Egyptians believed dreams were messages from the gods.",
  "A 'lucid dream' is when you're aware you're dreaming while it's happening.",
  "We dream every night, even if we don't remember them.",
  "Men and women dream differently, often featuring different themes."
]

export function FactCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % DREAM_FACTS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="h-16 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-sm text-muted-foreground italic text-center max-w-xs"
        >
          {DREAM_FACTS[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
