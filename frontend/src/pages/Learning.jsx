import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  BookOpen, ChevronDown, ChevronRight,
  Clock, RotateCcw, AlertTriangle,
  CheckCircle2, Lock, Play, Loader2,
} from 'lucide-react'
import useLearningStore from '@/store/learningStore'
import { sessions as sessionsApi, learning as learningApi } from '@/services/api'
import useStream from '@/hooks/useStream'

// ── Helpers ──────────────────────────────────────────────────────

function readingMinutes(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

// ── Mission Card ─────────────────────────────────────────────────

function MissionCard({ topic, goal, level, readMins, complete }) {
  return (
    <div className="rounded-2xl bg-bg-card border border-mentor/20 p-5 shadow-glow-mentor/10">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-mentor/10 border border-mentor/20 flex items-center justify-center flex-shrink-0">
          <BookOpen size={13} className="text-mentor" />
        </div>
        <span className="text-2xs font-bold text-mentor uppercase tracking-widest">
          Today's Mission
        </span>
        {complete && (
          <CheckCircle2 size={14} className="text-mentor ml-auto flex-shrink-0" />
        )}
      </div>

      <h3 className="text-sm font-bold text-text-primary leading-snug mb-1.5">
        {topic?.title ?? '…'}
      </h3>
      <p className="text-xs text-text-muted leading-relaxed line-clamp-3 mb-3">{goal}</p>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1 text-2xs text-text-muted">
          <Clock size={11} />
          {readMins} min read
        </span>
        <span className="badge badge-mentor">{level}</span>
      </div>
    </div>
  )
}

// ── Progress Bar ─────────────────────────────────────────────────

function ProgressBar({ current, total }) {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0
  return (
    <div className="flex items-center gap-3 mb-8">
      <span className="text-2xs text-text-muted whitespace-nowrap">
        Topic {current + 1} / {total}
      </span>
      <div className="flex-1 h-1 bg-bg-elevated rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-mentor to-primary-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
      <span className="text-2xs text-text-muted">{Math.round(pct)}%</span>
    </div>
  )
}

// ── Curriculum Nav ────────────────────────────────────────────────

function CurriculumNav({ curriculum, currentIdx, onSelectTopic }) {
  return (
    <div className="mt-5">
      <p className="text-2xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">
        Curriculum
      </p>
      <div className="space-y-0.5">
        {curriculum.map((topic, i) => {
          const isActive  = i === currentIdx
          const isDone    = topic.status === 'completed'
          const isLocked  = !isDone && !isActive

          return (
            <button
              key={topic.id}
              disabled={isLocked}
              onClick={() => onSelectTopic(i)}
              className={[
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left',
                'transition-all duration-200',
                isActive
                  ? 'bg-mentor/10 border border-mentor/20 text-text-primary'
                  : isDone
                  ? 'hover:bg-bg-elevated text-text-secondary border border-transparent'
                  : 'opacity-35 cursor-not-allowed border border-transparent',
              ].join(' ')}
            >
              <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                {isDone
                  ? <CheckCircle2 size={13} className="text-mentor" />
                  : isActive
                  ? <Play size={11} className="text-mentor" />
                  : <Lock size={11} className="text-text-muted" />
                }
              </span>
              <span className="text-xs leading-tight truncate">{topic.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Why Section ───────────────────────────────────────────────────

function WhySection({ sessionId, topicId }) {
  const whyExplanation   = useLearningStore((s) => s.whyExplanation)
  const setWhyExplanation = useLearningStore((s) => s.setWhyExplanation)

  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)

  const cachedText = whyExplanation[topicId]

  const fetchWhy = useCallback(async () => {
    if (cachedText || loading) return
    setLoading(true)
    try {
      const { data } = await learningApi.why(sessionId, topicId)
      setWhyExplanation(topicId, data.why)
    } catch {
      setWhyExplanation(topicId, 'This topic builds essential foundations toward your learning goal.')
    } finally {
      setLoading(false)
    }
  }, [cachedText, loading, sessionId, topicId, setWhyExplanation])

  const toggle = () => {
    if (!open) fetchWhy()
    setOpen((o) => !o)
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left
                   hover:bg-bg-elevated transition-colors duration-150"
      >
        <span className="text-xs font-semibold text-text-secondary">
          Why are we learning this now?
        </span>
        {open
          ? <ChevronDown size={13} className="text-text-muted flex-shrink-0" />
          : <ChevronRight size={13} className="text-text-muted flex-shrink-0" />
        }
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="why-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0.5">
              {loading
                ? <div className="skeleton h-10 rounded-lg" />
                : (
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {cachedText}
                  </p>
                )
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Thinking Skeleton ─────────────────────────────────────────────

function ThinkingState() {
  const lines = [
    'w-2/3', 'w-full', 'w-5/6', 'w-full',
    'w-3/4', 'w-full', 'w-4/5', 'w-2/3',
  ]
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-mentor/10 border border-mentor/20 flex items-center justify-center flex-shrink-0">
          <Loader2 size={15} className="text-mentor animate-spin" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary leading-none mb-0.5">
            Mentor is thinking…
          </p>
          <p className="text-xs text-text-muted">Generating your personalized lesson</p>
        </div>
      </div>
      <div className="space-y-3">
        {lines.map((w, i) => (
          <div
            key={i}
            className={`skeleton h-3.5 rounded ${w}`}
            style={{ animationDelay: `${i * 70}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Error Banner ──────────────────────────────────────────────────

function ErrorBanner({ message, onRetry, canRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-coach/8 border border-coach/25 mb-6"
    >
      <AlertTriangle size={15} className="text-coach flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">Lesson generation failed</p>
        <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{message}</p>
      </div>
      {canRetry && (
        <button
          onClick={onRetry}
          className="btn-ghost btn-sm gap-1.5 flex-shrink-0 text-text-secondary hover:text-text-primary"
        >
          <RotateCcw size={12} />
          Retry
        </button>
      )}
    </motion.div>
  )
}

// ── Complete Badge ────────────────────────────────────────────────

function CompleteBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      className="mt-12 flex items-center justify-center gap-3 py-6 rounded-2xl
                 bg-mentor/8 border border-mentor/20"
    >
      <CheckCircle2 size={22} className="text-mentor" />
      <div>
        <p className="font-bold text-text-primary text-sm">Lesson complete!</p>
        <p className="text-xs text-text-muted mt-0.5">
          Head to the Quiz tab to test your understanding
        </p>
      </div>
    </motion.div>
  )
}

// ── Main Learning Page ────────────────────────────────────────────

export default function Learning() {
  const navigate = useNavigate()

  const {
    sessionId, skill, goal, level,
    curriculum, currentTopicIndex,
    lessonContent, lessonLoading, lessonComplete, streamError,
    initSession, setCurrentTopic,
  } = useLearningStore()

  const [sessionReady, setSessionReady] = useState(!!sessionId)
  const [initError,    setInitError]    = useState(null)

  const lessonRef      = useRef(null)
  const bottomRef      = useRef(null)
  const userScrolledUp = useRef(false)

  const currentTopic = curriculum[currentTopicIndex] ?? null

  // ── Session initialization ──────────────────────────────────────
  useEffect(() => {
    // Already have a session — nothing to do.
    if (sessionId) { setSessionReady(true); return }

    // Onboarding data missing — send user back.
    if (!skill || !level || !goal) { navigate('/onboarding'); return }

    ;(async () => {
      try {
        const { data } = await sessionsApi.create({ skill, goal, level })
        initSession({ sessionId: data.session_id, curriculum: data.curriculum })
        setSessionReady(true)
      } catch {
        setInitError('Failed to start your session. Please try again.')
      }
    })()
  }, []) // intentionally runs once on mount

  // ── Lesson stream ───────────────────────────────────────────────
  const { retry, canRetry } = useStream(sessionId, currentTopic?.id, {
    enabled: sessionReady && !!currentTopic,
  })

  // ── Scroll tracking ─────────────────────────────────────────────
  useEffect(() => {
    const el = lessonRef.current
    if (!el) return
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      userScrolledUp.current = distFromBottom > 120
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [sessionReady])

  // Auto-scroll to bottom while streaming if user hasn't scrolled up.
  useEffect(() => {
    if (lessonLoading && !userScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [lessonContent, lessonLoading])

  // ── Topic selection ─────────────────────────────────────────────
  const handleSelectTopic = useCallback((idx) => {
    userScrolledUp.current = false
    setCurrentTopic(idx)
    lessonRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setCurrentTopic])

  // Estimated reading time: prefer computed value once content exists.
  const readMins = lessonContent
    ? readingMinutes(lessonContent)
    : (currentTopic?.estimated_minutes ?? 20)

  // ── Error / loading states ──────────────────────────────────────
  if (initError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-xs">
          <AlertTriangle size={30} className="text-coach mx-auto mb-3" />
          <p className="font-semibold text-text-primary mb-1">Something went wrong</p>
          <p className="text-xs text-text-muted mb-5 leading-relaxed">{initError}</p>
          <button onClick={() => navigate('/onboarding')} className="btn-primary btn-sm">
            Start Over
          </button>
        </div>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="h-full flex items-center justify-center gap-2.5">
        <Loader2 size={20} className="text-mentor animate-spin" />
        <span className="text-sm text-text-muted">Preparing your session…</span>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="h-full flex overflow-hidden">

      {/* ── Left sidebar ──────────────────────────────────────────── */}
      <aside className="w-72 flex-shrink-0 border-r border-border h-full overflow-y-auto no-scrollbar">
        <div className="p-5 space-y-4">
          <MissionCard
            topic={currentTopic}
            goal={goal}
            level={level}
            readMins={readMins}
            complete={lessonComplete}
          />

          {sessionId && currentTopic && (
            <WhySection sessionId={sessionId} topicId={currentTopic.id} />
          )}

          <CurriculumNav
            curriculum={curriculum}
            currentIdx={currentTopicIndex}
            onSelectTopic={handleSelectTopic}
          />
        </div>
      </aside>

      {/* ── Main lesson area ──────────────────────────────────────── */}
      <div ref={lessonRef} className="flex-1 h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">

          <ProgressBar current={currentTopicIndex} total={curriculum.length} />

          {/* Stream error */}
          {streamError && (
            <ErrorBanner message={streamError} onRetry={retry} canRetry={canRetry} />
          )}

          {/* Thinking skeleton — only before first chunk arrives */}
          {lessonLoading && !lessonContent && <ThinkingState />}

          {/* Lesson content — renders progressively as chunks stream in */}
          <AnimatePresence mode="wait">
            {lessonContent && (
              <motion.article
                key={currentTopic?.id ?? 'lesson'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="prose-lesson"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {lessonContent}
                </ReactMarkdown>
              </motion.article>
            )}
          </AnimatePresence>

          {/* Lesson complete badge */}
          {lessonComplete && <CompleteBadge />}

          {/* Auto-scroll sentinel */}
          <div ref={bottomRef} className="h-1" />
        </div>
      </div>
    </div>
  )
}
