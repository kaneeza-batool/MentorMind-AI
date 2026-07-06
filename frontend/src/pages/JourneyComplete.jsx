import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Trophy, BarChart2, BookOpen, ArrowRight,
  CheckCircle2, Star, Sparkles,
} from 'lucide-react'
import useLearningStore from '@/store/learningStore'

// ── Stat pill ─────────────────────────────────────────────────────────────────

function StatPill({ label, value, accent = 'primary' }) {
  const colors = {
    primary:    'bg-primary/10 border-primary/20 text-primary-300',
    mentor:     'bg-mentor/10 border-mentor/20 text-mentor',
    examiner:   'bg-examiner/10 border-examiner/20 text-examiner',
    reflection: 'bg-reflection/10 border-reflection/20 text-reflection',
  }
  return (
    <div className={`rounded-2xl border px-5 py-4 text-center ${colors[accent] ?? colors.primary}`}>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-2xs text-text-muted mt-1">{label}</p>
    </div>
  )
}

// ── Reflection summary row ────────────────────────────────────────────────────

function ReflectionRow({ topic, data }) {
  if (!data) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <CheckCircle2 size={14} className="text-mentor mt-0.5 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-text-primary truncate">{topic.title}</p>
        {data.recommendation && (
          <p className="text-2xs text-text-muted mt-0.5 leading-relaxed line-clamp-2">
            {data.recommendation}
          </p>
        )}
      </div>
      {data.confidence > 0 && (
        <span className="text-2xs font-bold text-reflection flex-shrink-0">
          {data.confidence}%
        </span>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function JourneyComplete() {
  const navigate = useNavigate()

  const {
    sessionId,
    curriculum,
    skill,
    goal,
    mastery,
    reflectionHistory,
  } = useLearningStore()

  // If no session or curriculum not complete, redirect away
  useEffect(() => {
    if (!sessionId) {
      navigate('/', { replace: true })
      return
    }
    const allDone = curriculum.length > 0 && curriculum.every((t) => t.status === 'completed')
    if (!allDone) {
      navigate('/reflection', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Derived stats
  const masteryValues   = Object.values(mastery)
  const avgMastery      = masteryValues.length
    ? Math.round(masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length)
    : 0
  const topicsCompleted = curriculum.filter((t) => t.status === 'completed').length

  const bestTopic = curriculum
    .filter((t) => mastery[t.id] != null)
    .sort((a, b) => (mastery[b.id] ?? 0) - (mastery[a.id] ?? 0))[0]

  if (!sessionId) return null

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-examiner/20 to-primary/10
                       border border-examiner/30 flex items-center justify-center mx-auto mb-6"
            aria-hidden="true"
          >
            <Trophy size={36} className="text-examiner" />
          </motion.div>

          <h1 className="text-3xl font-bold text-text-primary mb-2">Journey Complete!</h1>
          <p className="text-text-secondary text-sm leading-relaxed max-w-md mx-auto">
            You've mastered all {curriculum.length} topics in{' '}
            <span className="font-semibold text-text-primary">{skill}</span>.{' '}
            {goal && <span className="text-text-muted">Goal: {goal}</span>}
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-3 gap-3 mb-8"
          aria-label="Final statistics"
        >
          <StatPill label="Topics Completed"  value={topicsCompleted}       accent="mentor" />
          <StatPill label="Avg. Mastery"      value={`${avgMastery}%`}      accent="examiner" />
          <StatPill label="All Reflections"   value={Object.keys(reflectionHistory).length} accent="reflection" />
        </motion.div>

        {/* Best topic highlight */}
        {bestTopic && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3 }}
            className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-examiner/8 border border-examiner/20 mb-8"
          >
            <Star size={16} className="text-examiner flex-shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-text-primary">Strongest Performance</p>
              <p className="text-xs text-text-muted truncate">{bestTopic.title}</p>
            </div>
            <span className="text-sm font-bold text-examiner tabular-nums ml-auto">
              {Math.round(mastery[bestTopic.id] ?? 0)}%
            </span>
          </motion.div>
        )}

        {/* Reflection summary per topic */}
        {curriculum.some((t) => reflectionHistory[t.id]) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.4 }}
            className="card p-5 mb-8"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={13} className="text-reflection" aria-hidden="true" />
              <span className="text-xs font-bold text-reflection uppercase tracking-widest">
                Reflection Summary
              </span>
            </div>
            <div>
              {curriculum.map((topic) => (
                <ReflectionRow
                  key={topic.id}
                  topic={topic}
                  data={reflectionHistory[topic.id]}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3"
          role="navigation"
          aria-label="Post-journey actions"
        >
          <button
            onClick={() => navigate('/learn')}
            className="btn-secondary btn-sm gap-1.5"
            aria-label="Review all curriculum topics"
          >
            <BookOpen size={13} aria-hidden="true" />
            Review Topics
          </button>

          <button
            onClick={() => navigate('/mission-control')}
            className="btn-secondary btn-sm gap-1.5"
            aria-label="Open Mission Control dashboard"
          >
            <BarChart2 size={13} aria-hidden="true" />
            Mission Control
          </button>

          <button
            onClick={() => {
              useLearningStore.getState().resetSession()
              navigate('/onboarding')
            }}
            className="btn-primary btn-sm gap-1.5 sm:ml-auto"
            aria-label="Start learning a new skill"
          >
            Start New Skill <ArrowRight size={14} aria-hidden="true" />
          </button>
        </motion.div>

      </div>
    </div>
  )
}
