import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Compass, BookOpen, ClipboardList,
  TrendingUp, Library, Sparkles, CheckCircle2, Loader2,
} from 'lucide-react'
import useLearningStore from '@/store/learningStore'

const AGENT_STEPS = [
  {
    Icon: Compass,
    name: 'Strategist',
    color: '#818CF8',
    getMessage: (s) => `Building your ${s.deadline === 'custom' ? s.deadlineCustom + '-day' : s.deadline + '-day'} ${s.skill} curriculum…`,
  },
  {
    Icon: BookOpen,
    name: 'Mentor',
    color: '#34D399',
    getMessage: (s) => `Calibrating lessons for ${s.level} level — ${s.dailyMinutes >= 60 ? `${s.dailyMinutes / 60}hr` : `${s.dailyMinutes}min`}/day pace…`,
  },
  {
    Icon: ClipboardList,
    name: 'Examiner',
    color: '#FBBF24',
    getMessage: (s) => `Preparing adaptive assessments for ${s.skill}…`,
  },
  {
    Icon: TrendingUp,
    name: 'Coach',
    color: '#F87171',
    getMessage: () => 'Setting up mastery tracking and weak-area detection…',
  },
  {
    Icon: Library,
    name: 'Resource',
    color: '#22D3EE',
    getMessage: (s) => `Curating top-rated ${s.skill} resources for ${s.learningStyle} learners…`,
  },
  {
    Icon: Sparkles,
    name: 'Reflection',
    color: '#C084FC',
    getMessage: () => 'Configuring personalized feedback and insight engine…',
  },
]

const AGENT_DELAY_MS = 420

export default function PreparingScreen() {
  const navigate   = useNavigate()
  const store      = useLearningStore()
  const [activeIdx, setActiveIdx]  = useState(-1)
  const [doneSet,   setDoneSet]    = useState(new Set())
  const [finished,  setFinished]   = useState(false)

  // Progress 0-100 driven by activeIdx
  const progress = finished ? 100 : activeIdx < 0 ? 0 : ((activeIdx + 1) / AGENT_STEPS.length) * 92

  useEffect(() => {
    let idx = 0

    const tick = () => {
      if (idx < AGENT_STEPS.length) {
        const current = idx
        setActiveIdx(current)
        setTimeout(() => {
          setDoneSet((prev) => new Set([...prev, current]))
        }, AGENT_DELAY_MS - 80)
        idx++
        setTimeout(tick, AGENT_DELAY_MS)
      } else {
        setFinished(true)
        setTimeout(() => navigate('/learn'), 1200)
      }
    }

    const init = setTimeout(tick, 450)
    return () => clearTimeout(init)
  }, [navigate])

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 overflow-hidden relative">

      {/* ── Background ──────────────────────────────────────────── */}
      <div className="absolute inset-0 mesh-bg pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(99,102,241,0.1) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center gap-8">

        {/* ── Logo pulse ─────────────────────────────────────────── */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-reflection flex items-center justify-center shadow-glow-primary">
            <Brain size={36} className="text-white" />
          </div>
          {/* Pulse rings */}
          <motion.span
            className="absolute inset-0 rounded-2xl border border-primary/35"
            animate={{ scale: [1, 1.35, 1.35], opacity: [0.6, 0, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.span
            className="absolute inset-0 rounded-2xl border border-primary/20"
            animate={{ scale: [1, 1.6, 1.6], opacity: [0.4, 0, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
          />
        </motion.div>

        {/* ── Headline ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="text-center"
        >
          <AnimatePresence mode="wait">
            {!finished ? (
              <motion.h1
                key="preparing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="text-2xl font-black text-text-primary tracking-tight mb-1"
              >
                Preparing your personalized journey
              </motion.h1>
            ) : (
              <motion.h1
                key="ready"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className="text-2xl font-black tracking-tight mb-1"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #A5B4FC, #C084FC, #34D399)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Your journey is ready ✨
              </motion.h1>
            )}
          </AnimatePresence>
          <p className="text-sm text-text-muted">
            {finished
              ? `${store.skill} · ${store.level} · ${store.deadline === 'custom' ? store.deadlineCustom : store.deadline} days`
              : 'Six agents are collaborating on your behalf…'}
          </p>
        </motion.div>

        {/* ── Progress bar ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="w-full h-[3px] bg-bg-elevated rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(to right, #4F46E5, #818CF8, #C084FC)',
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </motion.div>

        {/* ── Agent checklist ────────────────────────────────────── */}
        <div className="w-full space-y-1.5">
          {AGENT_STEPS.map((agent, i) => {
            const isDone    = doneSet.has(i)
            const isActive  = activeIdx === i && !isDone
            const isPending = activeIdx < i

            return (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: activeIdx >= i - 1 ? 1 : 0.3, x: 0 }}
                transition={{ delay: 0.5 + i * 0.04, duration: 0.35 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-bg-elevated border border-border-strong' : ''
                }`}
              >
                {/* Status indicator */}
                <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {isDone ? (
                      <motion.div
                        key="done"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      >
                        <CheckCircle2 size={18} style={{ color: agent.color }} />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div key="loading">
                        <Loader2 size={18} style={{ color: agent.color }} className="animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="pending"
                        className="w-4 h-4 rounded-full border-2"
                        style={{ borderColor: '#1E2030' }}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* Agent icon bubble */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isPending ? '#13141C' : `${agent.color}16`,
                    border: `1px solid ${isPending ? '#1E2030' : agent.color + '35'}`,
                  }}
                >
                  <agent.Icon
                    size={15}
                    strokeWidth={1.8}
                    style={{ color: isPending ? '#475569' : agent.color }}
                  />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold"
                      style={{ color: isPending ? '#475569' : isDone ? agent.color : '#E2E8F0' }}
                    >
                      {agent.name}
                    </span>
                  </div>
                  <AnimatePresence>
                    {(isActive || isDone) && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-[11px] text-text-muted leading-tight mt-0.5 truncate"
                      >
                        {agent.getMessage(store)}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
