import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import useLearningStore from '@/store/learningStore'
import StepQuestion from '../StepQuestion'

const SUGGESTIONS = [
  'Python', 'JavaScript', 'React', 'Machine Learning',
  'System Design', 'TypeScript', 'SQL', 'Docker & Kubernetes',
  'DSA', 'AWS', 'Go', 'FastAPI', 'Next.js', 'Rust',
]

export default function WelcomeStep({ onNext }) {
  const skill    = useLearningStore((s) => s.skill)
  const setField = useLearningStore((s) => s.setField)
  const inputRef = useRef(null)

  const handleKey = (e) => {
    if (e.key === 'Enter' && skill.trim().length >= 2) onNext()
  }

  return (
    <div>
      <StepQuestion
        question="What would you like to master?"
        subtitle="Type a skill, technology, or subject — your mentor team will handle the rest."
        speed={22}
      />

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="relative mb-6"
      >
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          ref={inputRef}
          autoFocus
          type="text"
          value={skill}
          onChange={(e) => setField('skill', e.target.value)}
          onKeyDown={handleKey}
          placeholder="e.g. Python, React, Machine Learning…"
          className="w-full bg-bg-surface border border-border rounded-2xl pl-11 pr-5 py-4 text-lg font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all duration-200"
        />
      </motion.div>

      {/* Suggestion chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <p className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-3">
          Popular picks
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s, i) => (
            <motion.button
              key={s}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.03, duration: 0.25 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setField('skill', s)
                inputRef.current?.focus()
              }}
              className={`px-3.5 py-1.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                skill === s
                  ? 'bg-primary/15 border-primary/40 text-primary-400'
                  : 'bg-bg-card border-border text-text-secondary hover:border-primary/30 hover:text-text-primary hover:bg-bg-elevated'
              }`}
            >
              {s}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
