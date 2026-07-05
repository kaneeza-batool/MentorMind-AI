import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import useTypewriter from '@/hooks/useTypewriter'

export default function StepQuestion({ question, subtitle, speed = 20 }) {
  const { displayed, done } = useTypewriter(question, speed)

  return (
    <div className="mb-9">
      {/* Agent indicator */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 mb-5"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-reflection flex items-center justify-center shadow-glow-sm">
          <Brain size={13} className="text-white" />
        </div>
        <span className="text-xs font-semibold text-primary-400 tracking-wide">
          MentorMind AI
        </span>
        <span className="flex gap-0.5 items-center">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1 h-1 rounded-full bg-primary-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </span>
      </motion.div>

      {/* Question headline */}
      <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-text-primary mb-4 min-h-[1.2em]">
        {displayed}
        {!done && (
          <motion.span
            className="inline-block w-[2px] h-[0.85em] bg-primary-400 ml-1 align-middle rounded-sm"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
          />
        )}
      </h2>

      {/* Subtitle fades in after typing completes */}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: done ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="text-base text-text-secondary leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}
