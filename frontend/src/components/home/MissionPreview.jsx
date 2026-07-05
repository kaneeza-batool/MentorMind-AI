import { motion } from 'framer-motion'
import { Brain, Map, BookOpen, ClipboardList, TrendingUp, Library, Sparkles, CheckCircle2 } from 'lucide-react'

const TOPICS = [
  { name: 'Variables & Types',  mastery: 88, color: '#34D399', done: true  },
  { name: 'Functions & OOP',    mastery: 71, color: '#818CF8', done: true  },
  { name: 'Data Structures',    mastery: 42, color: '#FBBF24', done: false },
  { name: 'APIs & Testing',     mastery: 0,  color: '#475569', done: false },
]

const NAV_ITEMS = [
  { icon: Map,          label: 'Learn',     active: false },
  { icon: ClipboardList,label: 'Quiz',      active: false },
  { icon: Library,      label: 'Resources', active: false },
  { icon: TrendingUp,   label: 'Mission',   active: true  },
]

export default function MissionPreview() {
  return (
    <section className="relative py-28 lg:py-36 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Large ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.06) 0%, transparent 55%)',
        }}
      />

      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-14"
        >
          <span className="badge badge-primary mb-4">Mission Control</span>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-text-primary mb-4">
            See Your Mastery at a Glance
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto leading-relaxed">
            Mission Control gives you a live view of every topic, skill score, and next step — always up to date.
          </p>
        </motion.div>

        {/* App window mockup */}
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
          className="relative rounded-2xl border border-border overflow-hidden shadow-modal"
          style={{ background: 'rgba(13,14,20,0.95)' }}
        >
          {/* Window chrome */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-bg-surface">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <span className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-2 bg-bg-card border border-border rounded-lg px-4 py-1 text-xs text-text-muted">
                <Brain size={11} className="text-primary-400" />
                mentormind.ai/mission-control
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Brain size={14} className="text-primary-400" />
              <span className="text-xs font-bold text-text-primary">
                MentorMind <span className="text-primary-400">AI</span>
              </span>
            </div>
          </div>

          {/* App layout */}
          <div className="flex h-[380px] lg:h-[440px]">
            {/* Sidebar */}
            <div className="w-[60px] lg:w-[200px] border-r border-border bg-bg-surface flex-shrink-0 flex flex-col py-4 gap-1 px-2 lg:px-4">
              {NAV_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl transition-colors ${
                    item.active
                      ? 'bg-primary/12 text-primary-400'
                      : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated'
                  }`}
                >
                  <item.icon size={16} strokeWidth={item.active ? 2 : 1.8} />
                  <span className="hidden lg:block text-xs font-medium">{item.label}</span>
                </div>
              ))}

              {/* Goal pill */}
              <div className="hidden lg:block mt-auto mx-1 p-3 rounded-xl border border-border bg-bg-card">
                <p className="text-[10px] text-text-muted mb-1 font-semibold uppercase tracking-wider">Goal</p>
                <p className="text-xs font-semibold text-text-primary leading-tight">Python<br />Programming</p>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-hidden p-5 lg:p-7 flex flex-col gap-5">
              {/* Page title */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-text-primary tracking-tight">Mission Control</h3>
                  <p className="text-xs text-text-muted">Python Programming · Week 3 of 4</p>
                </div>
                <span className="badge badge-mentor text-[10px]">
                  <CheckCircle2 size={10} />
                  2 Topics Mastered
                </span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Overall Mastery" value="74%" color="#818CF8" />
                <StatCard label="Quizzes Taken"   value="2"   color="#34D399" />
                <StatCard label="Streak"          value="5d"  color="#FBBF24" />
              </div>

              {/* Topics list */}
              <div className="flex-1 space-y-2.5 overflow-y-auto no-scrollbar">
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Topic Mastery</p>
                {TOPICS.map((topic, i) => (
                  <TopicRow key={topic.name} topic={topic} index={i} />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom edge fade */}
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[rgba(8,9,14,0.9)] to-transparent pointer-events-none" />
        </motion.div>

        {/* Caption */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center text-xs text-text-muted mt-5"
        >
          Realistic preview — data reflects your actual learning session
        </motion.p>
      </div>
    </section>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-3 text-center">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-xl font-black" style={{ color }}>{value}</p>
    </div>
  )
}

function TopicRow({ topic, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.4 }}
      className="flex items-center gap-3"
    >
      <CheckCircle2
        size={14}
        style={{ color: topic.done ? topic.color : '#475569', flexShrink: 0 }}
        strokeWidth={topic.done ? 2.5 : 1.5}
      />
      <span className="text-xs text-text-secondary w-32 truncate flex-shrink-0">{topic.name}</span>
      <div className="flex-1 h-1.5 bg-bg-surface rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: topic.color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${topic.mastery}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 + index * 0.1, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
      <span className="text-[11px] font-bold w-8 text-right flex-shrink-0" style={{ color: topic.color }}>
        {topic.mastery > 0 ? `${topic.mastery}%` : '—'}
      </span>
    </motion.div>
  )
}
