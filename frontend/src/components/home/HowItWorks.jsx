import { motion } from 'framer-motion'
import { Target, Map, BookOpen, ClipboardList, Sparkles, ArrowRight } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: Target,
    title: 'Set Your Goal',
    description: 'Tell MentorMind what you want to master — your skill, current level, and target timeline.',
    agent: null,
    color: '#64748B',
  },
  {
    number: '02',
    icon: Map,
    title: 'Get Your Plan',
    description: 'The Strategist designs a personalized curriculum — structured, prioritized, and aligned to your goal.',
    agent: 'Strategist',
    color: '#818CF8',
  },
  {
    number: '03',
    icon: BookOpen,
    title: 'Learn Live',
    description: 'The Mentor streams rich lessons calibrated to your level — with examples, analogies, and code.',
    agent: 'Mentor',
    color: '#34D399',
  },
  {
    number: '04',
    icon: ClipboardList,
    title: 'Take the Quiz',
    description: 'The Examiner tests your understanding with adaptive questions. Hit "Why?" for instant clarity.',
    agent: 'Examiner',
    color: '#FBBF24',
  },
  {
    number: '05',
    icon: Sparkles,
    title: 'Reflect & Adapt',
    description: 'Coach and Reflection analyze your results, update your mastery, and refine your path forward.',
    agent: 'Coach + Reflection',
    color: '#C084FC',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28 lg:py-36 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Background accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(99,102,241,0.05) 0%, transparent 60%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-16 lg:mb-20"
        >
          <span className="badge badge-primary mb-4">The Process</span>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-text-primary mb-4">
            How MentorMind Works
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto leading-relaxed">
            Five intelligent steps — from goal to mastery — powered by an autonomous agent pipeline.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-[52px] left-[calc(10%+40px)] right-[calc(10%+40px)] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4">
            {STEPS.map((step, i) => (
              <StepCard key={step.number} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function StepCard({ step, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col items-center text-center lg:items-center group"
    >
      {/* Number + icon */}
      <div className="relative mb-5">
        {/* Step number */}
        <span className="absolute -top-2 -right-2 text-[10px] font-black text-text-muted z-10">
          {step.number}
        </span>

        {/* Icon circle */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center border relative z-0"
          style={{
            backgroundColor: step.color + '14',
            borderColor:     step.color + '40',
            boxShadow:       `0 0 0 0 ${step.color}30`,
          }}
        >
          <step.icon size={28} strokeWidth={1.6} style={{ color: step.color }} />
        </motion.div>
      </div>

      {/* Content */}
      <h3 className="text-base font-bold text-text-primary mb-2 tracking-tight">
        {step.title}
      </h3>
      <p className="text-xs text-text-secondary leading-relaxed mb-3 max-w-[160px] lg:max-w-full">
        {step.description}
      </p>

      {/* Agent badge */}
      {step.agent && (
        <span
          className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border"
          style={{
            color:           step.color,
            backgroundColor: step.color + '12',
            borderColor:     step.color + '35',
          }}
        >
          {step.agent}
        </span>
      )}

      {/* Mobile arrow between steps */}
      {index < STEPS.length - 1 && (
        <div className="block sm:hidden mt-4">
          <ArrowRight size={16} className="text-text-muted rotate-90" />
        </div>
      )}
    </motion.div>
  )
}
