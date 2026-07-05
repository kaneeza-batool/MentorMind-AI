import { useRef } from 'react'
import { motion } from 'framer-motion'
import useLearningStore from '@/store/learningStore'
import StepQuestion from '../StepQuestion'

const GOAL_EXAMPLES = [
  'Crack FAANG interviews',
  'Become an AI Engineer',
  'Build production-ready apps',
  'Switch careers into tech',
  'Master Data Structures & Algorithms',
  'Build my own startup',
  'Get promoted to senior engineer',
  'Pass a certification exam',
  'Learn for a freelance career',
  'Understand the fundamentals deeply',
]

export default function GoalStep() {
  const goal     = useLearningStore((s) => s.goal)
  const setField = useLearningStore((s) => s.setField)
  const textRef  = useRef(null)

  const pick = (example) => {
    setField('goal', example)
    textRef.current?.focus()
  }

  return (
    <div>
      <StepQuestion
        question="What's your target outcome?"
        subtitle="The more specific you are, the better your Strategist can tailor your curriculum."
        speed={18}
      />

      {/* Text area */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.38 }}
        className="mb-5"
      >
        <textarea
          ref={textRef}
          autoFocus
          value={goal}
          onChange={(e) => setField('goal', e.target.value)}
          placeholder="e.g. I want to pass a senior backend engineering interview at a top tech company…"
          rows={3}
          className="w-full bg-bg-surface border border-border rounded-2xl px-5 py-4 text-base font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15 transition-all duration-200 resize-none leading-relaxed"
        />
        <div className="flex justify-end mt-1.5">
          <span className={`text-xs font-medium tabular-nums ${goal.length > 200 ? 'text-error' : 'text-text-muted'}`}>
            {goal.length}/200
          </span>
        </div>
      </motion.div>

      {/* Example goals */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.22, duration: 0.4 }}
      >
        <p className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-3">
          Or choose an example
        </p>
        <div className="flex flex-wrap gap-2">
          {GOAL_EXAMPLES.map((ex, i) => (
            <motion.button
              key={ex}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.28 + i * 0.028, duration: 0.22 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => pick(ex)}
              className={`px-3.5 py-1.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                goal === ex
                  ? 'bg-primary/15 border-primary/40 text-primary-400'
                  : 'bg-bg-card border-border text-text-secondary hover:border-primary/25 hover:text-text-primary hover:bg-bg-elevated'
              }`}
            >
              {ex}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
