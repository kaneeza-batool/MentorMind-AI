import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart2, CheckCircle2, Target, TrendingUp, Zap,
  BookOpen, Brain, Sparkles, ArrowRight, Loader2,
} from 'lucide-react'
import useLearningStore from '@/store/learningStore'
import { progress as progressApi } from '@/services/api'
import MasteryRing from '@/components/progress/MasteryRing'
import ScoreTimeline from '@/components/progress/ScoreTimeline'
import AdaptiveBadge from '@/components/progress/AdaptiveBadge'

// ── Stat Card ─────────────────────────────────────────────────────

const ACCENT = {
  primary:    { bg: 'bg-primary/10',    border: 'border-primary/20',    text: 'text-primary-300' },
  mentor:     { bg: 'bg-mentor/10',     border: 'border-mentor/20',     text: 'text-mentor' },
  examiner:   { bg: 'bg-examiner/10',   border: 'border-examiner/20',   text: 'text-examiner' },
  reflection: { bg: 'bg-reflection/10', border: 'border-reflection/20', text: 'text-reflection' },
}

function StatCard({ icon: Icon, label, value, accent = 'primary', delay = 0 }) {
  const a = ACCENT[accent] ?? ACCENT.primary
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="card p-4 flex items-start gap-3"
    >
      <div className={`w-9 h-9 rounded-xl ${a.bg} border ${a.border} flex items-center justify-center flex-shrink-0`}>
        <Icon size={16} className={a.text} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-2xs text-text-muted uppercase tracking-widest font-semibold">{label}</p>
        <p className="text-lg font-bold text-text-primary mt-0.5 leading-none tabular-nums">{value}</p>
      </div>
    </motion.div>
  )
}

// ── Topic Mastery Card ────────────────────────────────────────────

function TopicMasteryCard({ item, delay = 0 }) {
  const { title, score, confidence, completed } = item
  const barColor = score >= 80 ? 'bg-mentor' : score >= 60 ? 'bg-primary-400' : 'bg-coach'

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-center gap-4 py-3 border-b border-border last:border-0"
    >
      <MasteryRing score={completed ? score : 0} size={48} strokeWidth={5} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary leading-tight mb-1.5 truncate">
          {title}
        </p>
        <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
          {completed && (
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{ width: `${score}%`, transition: 'width 0.9s ease' }}
            />
          )}
        </div>
      </div>

      <div className="text-right flex-shrink-0 min-w-[44px]">
        {completed ? (
          <>
            <p className="text-xs font-bold text-text-primary tabular-nums">
              {score.toFixed(0)}%
            </p>
            {confidence > 0 && (
              <p className="text-2xs text-text-muted">Conf. {confidence}%</p>
            )}
          </>
        ) : (
          <span className="text-2xs text-text-muted">—</span>
        )}
      </div>
    </motion.div>
  )
}

// ── Curriculum Complete Banner ─────────────────────────────────────

function CurriculumComplete({ dashboard, onNewSkill, onReview }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      className="rounded-2xl bg-gradient-to-br from-reflection/10 to-primary/5 border border-reflection/25 p-6 text-center mb-8"
      role="status"
      aria-label="Curriculum complete"
    >
      <div className="text-4xl mb-3" aria-hidden="true">🎉</div>
      <h2 className="text-xl font-bold text-text-primary mb-1">Curriculum Complete!</h2>
      <p className="text-sm text-text-secondary mb-5 leading-relaxed">
        You've mastered all{' '}
        <span className="font-semibold text-text-primary">{dashboard.total_topics} topics</span>{' '}
        in{' '}
        <span className="font-semibold text-text-primary">{dashboard.skill}</span>.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-6" aria-label="Final stats">
        <div className="rounded-xl bg-bg-elevated/80 border border-border py-3 px-2">
          <p className="text-xl font-bold text-mentor tabular-nums">{dashboard.topics_completed}</p>
          <p className="text-2xs text-text-muted">Topics done</p>
        </div>
        <div className="rounded-xl bg-bg-elevated/80 border border-border py-3 px-2">
          <p className="text-xl font-bold text-examiner tabular-nums">
            {dashboard.average_score.toFixed(0)}%
          </p>
          <p className="text-2xs text-text-muted">Avg. score</p>
        </div>
        <div className="rounded-xl bg-bg-elevated/80 border border-border py-3 px-2">
          <p className="text-xl font-bold text-primary-300 tabular-nums">{dashboard.streak}</p>
          <p className="text-2xs text-text-muted">Streak</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onReview} className="btn-secondary btn-sm gap-1.5">
          <BookOpen size={13} aria-hidden="true" /> Review Curriculum
        </button>
        <button onClick={onNewSkill} className="btn-primary btn-sm gap-1.5">
          Start New Skill <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  )
}

// ── AI Insights ───────────────────────────────────────────────────

function AiInsights({ dashboard }) {
  const { mastery_by_topic, average_score, streak } = dashboard
  const completed = mastery_by_topic.filter((t) => t.completed)
  if (completed.length === 0) return null

  const insights = []
  const best  = [...completed].sort((a, b) => b.score - a.score)[0]
  const worst = [...completed].sort((a, b) => a.score - b.score)[0]

  if (best)
    insights.push(`You performed strongest on "${best.title}" with ${best.score.toFixed(0)}%.`)
  if (worst && worst.score < 80 && completed.length > 1)
    insights.push(`"${worst.title}" may benefit from additional review — score was ${worst.score.toFixed(0)}%.`)
  if (average_score >= 85)
    insights.push('Your average score reflects strong mastery across topics.')
  if (streak >= 3)
    insights.push(`A ${streak}-topic streak shows excellent consistency and momentum.`)
  if (average_score > 0 && average_score < 70)
    insights.push('Reviewing lessons before advancing will help solidify your foundation.')

  if (insights.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={13} className="text-reflection" aria-hidden="true" />
        <span className="text-2xs font-bold text-reflection uppercase tracking-widest">AI Insights</span>
      </div>
      <ul className="space-y-2" aria-label="Learning insights">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-reflection text-xs mt-0.5 flex-shrink-0" aria-hidden="true">•</span>
            <span className="text-xs text-text-secondary leading-relaxed">{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────

export default function MissionControl() {
  const navigate = useNavigate()
  const { sessionId, curriculum, mastery, weakAreas } = useLearningStore()

  const [dashboard, setDashboard] = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  useEffect(() => {
    if (!sessionId) { navigate('/learn', { replace: true }); return }

    progressApi
      .dashboard(sessionId)
      .then(({ data }) => setDashboard(data))
      .catch(() => setError('Dashboard temporarily unavailable.'))
      .finally(() => setLoading(false))
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!sessionId) return null

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center gap-2.5">
        <Loader2 size={20} className="text-reflection animate-spin" aria-hidden="true" />
        <span className="text-sm text-text-muted">Loading dashboard…</span>
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-xs px-4">
          <BarChart2 size={32} className="text-text-muted mx-auto mb-3" aria-hidden="true" />
          <p className="font-semibold text-text-primary mb-1">Dashboard unavailable</p>
          <p className="text-xs text-text-muted mb-5 leading-relaxed">{error}</p>
          <button onClick={() => navigate('/learn')} className="btn-primary btn-sm">
            Continue Learning
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="flex items-start gap-3 mb-6">
          <div
            className="w-9 h-9 rounded-xl bg-reflection/10 border border-reflection/20
                        flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <BarChart2 size={16} className="text-reflection" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs font-bold text-reflection uppercase tracking-widest">
              Mission Control
            </p>
            <p className="text-sm font-semibold text-text-primary truncate">{dashboard.skill}</p>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed line-clamp-1">
              {dashboard.goal}
            </p>
          </div>
          <AdaptiveBadge averageScore={dashboard.average_score} weakAreas={weakAreas} />
        </div>

        {/* Curriculum complete banner */}
        {dashboard.curriculum_complete && (
          <CurriculumComplete
            dashboard={dashboard}
            onNewSkill={() => navigate('/onboarding')}
            onReview={() => navigate('/learn')}
          />
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6" aria-label="Learning statistics">
          <StatCard
            icon={TrendingUp}
            label="Progress"
            value={`${dashboard.overall_progress}%`}
            accent="primary"
            delay={0.05}
          />
          <StatCard
            icon={CheckCircle2}
            label="Topics done"
            value={`${dashboard.topics_completed}/${dashboard.total_topics}`}
            accent="mentor"
            delay={0.10}
          />
          <StatCard
            icon={Brain}
            label="Avg. score"
            value={dashboard.average_score > 0 ? `${dashboard.average_score.toFixed(0)}%` : '—'}
            accent="examiner"
            delay={0.15}
          />
          <StatCard
            icon={Zap}
            label="Streak"
            value={dashboard.streak || '—'}
            accent="reflection"
            delay={0.20}
          />
        </div>

        {/* Overall progress bar */}
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-secondary">Overall Progress</span>
            <span className="text-xs font-bold text-text-primary">{dashboard.completion_estimate}</span>
          </div>
          <div
            className="h-2 bg-bg-elevated rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={dashboard.overall_progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Overall progress: ${dashboard.overall_progress}%`}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-reflection"
              initial={{ width: 0 }}
              animate={{ width: `${dashboard.overall_progress}%` }}
              transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
            />
          </div>
          {dashboard.current_topic && (
            <p className="text-2xs text-text-muted mt-2">
              Currently on:{' '}
              <span className="text-text-secondary font-medium">{dashboard.current_topic}</span>
            </p>
          )}
        </div>

        {/* Mastery + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Mastery by topic */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Target size={13} className="text-text-muted" aria-hidden="true" />
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                Mastery by Topic
              </span>
            </div>
            <div>
              {dashboard.mastery_by_topic.map((item, i) => (
                <TopicMasteryCard key={item.topic_id} item={item} delay={i * 0.06} />
              ))}
            </div>
          </div>

          {/* Learning timeline */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={13} className="text-text-muted" aria-hidden="true" />
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                Learning Timeline
              </span>
            </div>
            <ScoreTimeline curriculum={curriculum} mastery={mastery} />
          </div>
        </div>

        {/* AI Insights */}
        <div className="mb-6">
          <AiInsights dashboard={dashboard} />
        </div>

        {/* CTA — only when not complete */}
        {!dashboard.curriculum_complete && (
          <div className="flex justify-end">
            <button
              onClick={() => navigate('/learn')}
              className="btn-primary btn-sm gap-1.5"
              aria-label="Continue learning"
            >
              Continue Learning <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
