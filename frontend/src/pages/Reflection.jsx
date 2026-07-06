import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, CheckCircle2, ArrowRight, BarChart2,
  RotateCcw, Loader2, AlertTriangle,
} from 'lucide-react'
import useLearningStore from '@/store/learningStore'
import useReflection from '@/hooks/useReflection'
import ReflectionCard from '@/components/reflection/ReflectionCard'
import StrengthWeakGrid from '@/components/reflection/StrengthWeakGrid'
import NextStepPrompt from '@/components/reflection/NextStepPrompt'

// ── Confidence Meter ──────────────────────────────────────────────

function ConfidenceMeter({ confidence = 70 }) {
  const barColor = confidence >= 80 ? 'bg-mentor' : confidence >= 60 ? 'bg-primary-400' : 'bg-coach'
  const label    = confidence >= 80 ? 'High' : confidence >= 60 ? 'Moderate' : 'Building'

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-text-secondary">Confidence Level</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-text-primary tabular-nums">{confidence}%</span>
          <span className="badge badge-reflection text-reflection">{label}</span>
        </div>
      </div>
      <div
        className="h-2 bg-bg-elevated rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={confidence}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Confidence: ${confidence}%`}
      >
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
        />
      </div>
    </div>
  )
}

// ── Loading Skeleton ───────────────────────────────────────────────

function ReflectionSkeleton({ topicTitle }) {
  const lines = ['w-3/4', 'w-full', 'w-5/6', 'w-full', 'w-2/3', 'w-full', 'w-4/5']
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-9 h-9 rounded-xl bg-reflection/10 border border-reflection/20 flex items-center justify-center flex-shrink-0">
          <Loader2 size={16} className="text-reflection animate-spin" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-bold text-text-primary">Generating your reflection…</p>
          <p className="text-xs text-text-muted">{topicTitle}</p>
        </div>
      </div>
      <div className="space-y-3" aria-hidden="true">
        {lines.map((w, i) => (
          <div
            key={i}
            className={`skeleton h-4 rounded ${w}`}
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────

export default function Reflection() {
  const navigate = useNavigate()

  const {
    sessionId,
    curriculum,
    currentTopicIndex,
    quizResults,
    reflection,
    reflectionHistory,
    completeCurrentTopic,
  } = useLearningStore()

  const currentTopic = curriculum[currentTopicIndex] ?? null
  const isLastTopic  = currentTopicIndex === curriculum.length - 1

  const { generateReflection, loading, error } = useReflection()

  useEffect(() => {
    if (!sessionId || !currentTopic) {
      navigate('/learn', { replace: true })
      return
    }
    // No quiz data and no cached reflection — redirect back to learn
    if (!quizResults && !reflectionHistory[currentTopic.id] && !reflection) {
      navigate('/learn', { replace: true })
      return
    }
    generateReflection()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = () => {
    completeCurrentTopic()
    navigate(isLastTopic ? '/mission-control' : '/learn')
  }

  if (!sessionId || !currentTopic) return null

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-7">
          <div
            className="w-9 h-9 rounded-xl bg-reflection/10 border border-reflection/20
                        flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <Sparkles size={16} className="text-reflection" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs font-bold text-reflection uppercase tracking-widest">
              Learning Reflection
            </p>
            <p className="text-sm font-semibold text-text-primary truncate">
              {currentTopic.title}
            </p>
          </div>
          {quizResults?.score != null && (
            <span className="badge badge-reflection flex-shrink-0">
              {quizResults.score.toFixed(0)}%
            </span>
          )}
        </div>

        {/* Topic complete banner */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-mentor/8 border border-mentor/20 mb-6"
          role="status"
        >
          <CheckCircle2 size={18} className="text-mentor flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-text-primary">Topic Complete!</p>
            <p className="text-xs text-text-muted">Your AI mentor has reviewed your performance</p>
          </div>
        </div>

        {/* Loading state */}
        {loading && !reflection && (
          <ReflectionSkeleton topicTitle={currentTopic.title} />
        )}

        {/* Error state with retry */}
        {error && !reflection && (
          <div className="text-center py-10">
            <AlertTriangle size={28} className="text-coach mx-auto mb-3" aria-hidden="true" />
            <p className="font-semibold text-text-primary mb-1">Reflection unavailable</p>
            <p className="text-xs text-text-muted mb-5 leading-relaxed">{error}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={generateReflection} className="btn-secondary btn-sm gap-1.5">
                <RotateCcw size={13} aria-hidden="true" /> Try Again
              </button>
              <button onClick={handleContinue} className="btn-primary btn-sm gap-1.5">
                Continue Anyway <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Reflection content */}
        <AnimatePresence mode="wait">
          {reflection && (
            <motion.div
              key="reflection-ready"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              {/* AI narrative summary */}
              <ReflectionCard summary={reflection.summary} />

              {/* Confidence meter */}
              <div className="rounded-xl border border-border bg-bg-card px-4 py-4">
                <ConfidenceMeter confidence={reflection.confidence} />
              </div>

              {/* Strengths and weaknesses */}
              <div className="rounded-xl border border-border bg-bg-card px-5 py-5">
                <StrengthWeakGrid
                  strengths={reflection.strengths}
                  weaknesses={reflection.weaknesses}
                />
              </div>

              {/* Personalized recommendation */}
              <NextStepPrompt recommendation={reflection.recommendation} />

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2" role="navigation" aria-label="Next steps">
                <button
                  onClick={() => navigate('/mission-control')}
                  className="btn-secondary btn-sm gap-1.5"
                  aria-label="Open Mission Control dashboard"
                >
                  <BarChart2 size={13} aria-hidden="true" />
                  Mission Control
                </button>

                <button
                  onClick={handleContinue}
                  className="btn-primary btn-sm gap-1.5 sm:ml-auto"
                  aria-label={isLastTopic ? 'View full dashboard' : 'Continue to next topic'}
                >
                  {isLastTopic ? 'View Full Dashboard' : 'Continue Learning'}
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
