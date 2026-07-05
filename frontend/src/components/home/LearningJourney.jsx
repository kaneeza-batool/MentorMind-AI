import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Clock, Lock, BookOpen, ClipboardList, Zap, Sparkles, ChevronDown } from 'lucide-react'

const JOURNEY = [
  {
    week: 1,
    title: 'Python Fundamentals',
    status: 'completed',
    lesson: { title: 'Variables, Types & Control Flow', duration: '24 min' },
    quiz: { score: 9, total: 10, label: 'Excellent' },
    coach: null,
    reflection: '"You have a strong grasp of types and conditionals. Move forward with confidence."',
    mastery: 88,
  },
  {
    week: 2,
    title: 'Functions & OOP',
    status: 'completed',
    lesson: { title: 'Functions, Classes & Inheritance', duration: '31 min' },
    quiz: { score: 7, total: 10, label: 'Good' },
    coach: 'Path adapted: Added OOP reinforcement module',
    reflection: '"Solid on functions. Class inheritance needs more practice — the Strategist has queued an extra exercise."',
    mastery: 71,
  },
  {
    week: 3,
    title: 'Data Structures',
    status: 'active',
    lesson: { title: 'Lists, Dicts, Sets & Comprehensions', duration: 'In progress…' },
    quiz: null,
    coach: null,
    reflection: null,
    mastery: 42,
  },
  {
    week: 4,
    title: 'APIs & Testing',
    status: 'locked',
    lesson: null,
    quiz: null,
    coach: null,
    reflection: null,
    mastery: 0,
  },
]

const statusConfig = {
  completed: { icon: CheckCircle2, color: '#34D399', label: 'Completed' },
  active:    { icon: Clock,        color: '#FBBF24', label: 'In Progress' },
  locked:    { icon: Lock,         color: '#475569', label: 'Locked' },
}

export default function LearningJourney() {
  const [selected, setSelected] = useState(2)   // default: active week

  return (
    <section id="journey" className="relative py-28 lg:py-36 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-14"
        >
          <span className="badge badge-mentor mb-4">Interactive Preview</span>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-text-primary mb-4">
            Your Learning Journey
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto leading-relaxed">
            A sample 4-week journey through Python Programming. Click any week to explore it.
          </p>
        </motion.div>

        {/* Timeline row */}
        <div className="relative mb-8">
          {/* Connector */}
          <div className="hidden sm:block absolute top-1/2 -translate-y-1/2 left-8 right-8 h-px bg-border" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative">
            {JOURNEY.map((week, i) => {
              const cfg = statusConfig[week.status]
              const isSelected = selected === i
              return (
                <motion.button
                  key={week.week}
                  onClick={() => setSelected(i)}
                  whileHover={week.status !== 'locked' ? { scale: 1.03 } : {}}
                  whileTap={week.status !== 'locked' ? { scale: 0.97 } : {}}
                  disabled={week.status === 'locked'}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${
                    isSelected
                      ? 'border-border-strong bg-bg-elevated shadow-card-hover'
                      : 'border-border bg-bg-card hover:border-border-strong'
                  } ${week.status === 'locked' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* Status icon */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: cfg.color + '18', border: `1px solid ${cfg.color}40` }}
                  >
                    <cfg.icon size={18} style={{ color: cfg.color }} />
                  </div>

                  {/* Week label */}
                  <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    Week {week.week}
                  </span>
                  <span className="text-xs font-bold text-text-primary text-center leading-tight">
                    {week.title}
                  </span>

                  {/* Mastery bar */}
                  {week.mastery > 0 && (
                    <div className="w-full h-1 bg-bg-surface rounded-full overflow-hidden mt-1">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: cfg.color }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${week.mastery}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                      />
                    </div>
                  )}

                  {isSelected && (
                    <ChevronDown size={14} className="text-text-muted mt-1 hidden sm:block" />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="card p-6 lg:p-8"
          >
            <WeekDetail week={JOURNEY[selected]} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

function WeekDetail({ week }) {
  const cfg = statusConfig[week.status]

  if (week.status === 'locked') {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
        <Lock size={32} className="text-text-muted" />
        <p className="text-text-secondary font-medium">Complete Week {week.week - 1} to unlock this module.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-text-primary tracking-tight">{week.title}</h3>
          <span className="text-xs text-text-muted">Week {week.week}</span>
        </div>
        <span
          className="badge text-xs flex-shrink-0"
          style={{
            color:           cfg.color,
            backgroundColor: cfg.color + '14',
            borderColor:     cfg.color + '35',
          }}
        >
          {cfg.label}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Lesson card */}
        {week.lesson && (
          <DetailBlock
            icon={<BookOpen size={15} className="text-mentor" />}
            label="Mentor · Lesson"
            color="#34D399"
          >
            <p className="text-sm font-semibold text-text-primary">{week.lesson.title}</p>
            <p className="text-xs text-text-muted mt-0.5">{week.lesson.duration}</p>
          </DetailBlock>
        )}

        {/* Quiz card */}
        {week.quiz ? (
          <DetailBlock
            icon={<ClipboardList size={15} className="text-examiner" />}
            label="Examiner · Quiz"
            color="#FBBF24"
          >
            <p className="text-sm font-semibold text-text-primary">
              {week.quiz.score}/{week.quiz.total} — {week.quiz.label}
            </p>
            <div className="mt-2 h-1.5 bg-bg-surface rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-examiner"
                style={{ width: `${(week.quiz.score / week.quiz.total) * 100}%` }}
              />
            </div>
          </DetailBlock>
        ) : week.status === 'active' ? (
          <DetailBlock
            icon={<ClipboardList size={15} className="text-examiner" />}
            label="Examiner · Quiz"
            color="#FBBF24"
          >
            <p className="text-sm text-text-muted italic">Available after lesson</p>
          </DetailBlock>
        ) : null}

        {/* Coach / Reflection */}
        {week.coach && (
          <DetailBlock
            icon={<Zap size={15} className="text-coach" />}
            label="Coach · Adaptation"
            color="#F87171"
          >
            <p className="text-xs text-text-secondary leading-relaxed">{week.coach}</p>
          </DetailBlock>
        )}
        {week.reflection && (
          <DetailBlock
            icon={<Sparkles size={15} className="text-reflection" />}
            label="Reflection · Feedback"
            color="#C084FC"
            className={week.coach ? 'sm:col-span-2 lg:col-span-1' : ''}
          >
            <p className="text-xs text-text-secondary leading-relaxed italic">{week.reflection}</p>
          </DetailBlock>
        )}
      </div>
    </div>
  )
}

function DetailBlock({ icon, label, color, children, className = '' }) {
  return (
    <div
      className={`rounded-xl border p-4 ${className}`}
      style={{ backgroundColor: color + '08', borderColor: color + '28' }}
    >
      <div className="flex items-center gap-1.5 mb-2.5">
        {icon}
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}
