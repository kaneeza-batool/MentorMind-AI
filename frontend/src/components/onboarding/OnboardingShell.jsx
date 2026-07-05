import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronLeft, ArrowRight, Brain } from 'lucide-react'

export default function OnboardingShell({
  step, totalSteps, onBack, onNext, canContinue, isLastStep, children,
}) {
  const progress = ((step + 1) / totalSteps) * 100

  return (
    <div className="min-h-screen bg-bg flex flex-col overflow-hidden">
      {/* ── Top progress bar ─────────────────────────────────── */}
      <div className="h-[3px] bg-bg-elevated w-full relative">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-r-full"
          style={{
            background: 'linear-gradient(to right, #4F46E5, #818CF8, #C084FC)',
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 max-w-2xl mx-auto w-full">
        {/* Back */}
        <motion.button
          onClick={onBack}
          animate={{ opacity: step === 0 ? 0 : 1, pointerEvents: step === 0 ? 'none' : 'auto' }}
          whileHover={{ x: -2 }}
          className="flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft size={16} />
          Back
        </motion.button>

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-reflection flex items-center justify-center group-hover:shadow-glow-sm transition-shadow">
            <Brain size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-text-primary hidden sm:block">
            MentorMind <span className="text-primary-400">AI</span>
          </span>
        </Link>

        {/* Step counter */}
        <span className="text-xs text-text-muted font-semibold tabular-nums">
          {step + 1} <span className="text-border-strong">/</span> {totalSteps}
        </span>
      </div>

      {/* ── Step content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-4 w-full max-w-2xl mx-auto">
        {children}
      </div>

      {/* ── Continue button ───────────────────────────────────── */}
      <div className="px-6 pb-10 pt-2 w-full max-w-2xl mx-auto">
        <motion.button
          onClick={onNext}
          disabled={!canContinue}
          whileHover={canContinue ? { scale: 1.02, boxShadow: '0 0 28px rgba(129,140,248,0.38)' } : {}}
          whileTap={canContinue ? { scale: 0.97 } : {}}
          animate={canContinue
            ? { backgroundColor: '#6366F1', color: '#fff' }
            : { backgroundColor: '#13141C', color: '#475569' }
          }
          transition={{ duration: 0.25 }}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 border border-transparent transition-all"
          style={{ outline: 'none' }}
        >
          {isLastStep ? 'Build My Journey' : 'Continue'}
          <motion.span
            animate={{ x: canContinue ? 0 : -4, opacity: canContinue ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowRight size={18} />
          </motion.span>
        </motion.button>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 mt-5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width:           i === step ? 20 : 6,
                backgroundColor: i < step ? '#6366F1' : i === step ? '#818CF8' : '#1E2030',
              }}
              transition={{ duration: 0.3 }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
