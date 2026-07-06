import { useEffect, useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, ChevronLeft, ChevronRight,
  RotateCcw, BookOpen, AlertTriangle, Loader2, ArrowRight, Sparkles,
} from 'lucide-react'
import useLearningStore from '@/store/learningStore'
import { quiz as quizApi, sessions as sessionsApi } from '@/services/api'
import QuizCard from '@/components/quiz/QuizCard'
import ResultBanner from '@/components/quiz/ResultBanner'
import ExplanationDrawer from '@/components/quiz/ExplanationDrawer'

// ── Loading Skeleton ──────────────────────────────────────────────

function QuizLoadingState({ topicTitle }) {
  const widths = ['w-3/4', 'w-full', 'w-5/6', 'w-full', 'w-2/3', 'w-full', 'w-4/5', 'w-3/4']
  return (
    <div className="animate-fade-in max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-examiner/10 border border-examiner/20 flex items-center justify-center flex-shrink-0">
          <Loader2 size={16} className="text-examiner animate-spin" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-bold text-text-primary">Generating your quiz…</p>
          <p className="text-xs text-text-muted">{topicTitle}</p>
        </div>
      </div>
      <div className="space-y-3" aria-hidden="true">
        {widths.map((w, i) => (
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

// ── Error State ───────────────────────────────────────────────────

function QuizErrorState({ message, onRetry }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-xs px-4">
        <AlertTriangle size={32} className="text-coach mx-auto mb-3" aria-hidden="true" />
        <p className="font-semibold text-text-primary mb-1">Could not load quiz</p>
        <p className="text-xs text-text-muted mb-5 leading-relaxed">{message}</p>
        <button onClick={onRetry} className="btn-primary btn-sm gap-2">
          <RotateCcw size={13} aria-hidden="true" /> Try Again
        </button>
      </div>
    </div>
  )
}

// ── Main Quiz Page ────────────────────────────────────────────────

export default function Quiz() {
  const navigate = useNavigate()

  const {
    sessionId, curriculum, currentTopicIndex, level,
    handleQuizSubmit, syncCurriculum,
  } = useLearningStore()

  const currentTopic = curriculum[currentTopicIndex] ?? null

  // Redirect if the session hasn't been initialised yet
  useEffect(() => {
    if (!sessionId || !currentTopic) navigate('/learn', { replace: true })
  }, [sessionId, currentTopic, navigate])

  // ── Local state ─────────────────────────────────────────────────
  const [phase, setPhase]                     = useState('loading')
  const [questions, setQuestions]             = useState([])
  const [answers, setAnswers]                 = useState({})   // { [qId]: index }
  const [currentQIdx, setCurrentQIdx]         = useState(0)
  const [results, setResults]                 = useState(null)
  const [feedback, setFeedback]               = useState(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [errorMsg, setErrorMsg]               = useState(null)
  const [retakeKey, setRetakeKey]             = useState(0)    // increment to regenerate

  // ── Fetch quiz on mount / retake ─────────────────────────────────
  useEffect(() => {
    if (!sessionId || !currentTopic) return

    setPhase('loading')
    setQuestions([])
    setAnswers({})
    setCurrentQIdx(0)
    setResults(null)
    setFeedback(null)
    setErrorMsg(null)

    quizApi
      .generate({ session_id: sessionId, topic_id: currentTopic.id })
      .then(({ data }) => {
        setQuestions(data.questions)
        setPhase('taking')
      })
      .catch((err) => {
        const msg =
          err.response?.data?.detail ||
          'Quiz generation is temporarily unavailable. Please try again.'
        setErrorMsg(msg)
        setPhase('error')
      })
  }, [sessionId, currentTopic?.id, retakeKey])

  // ── Derived values ───────────────────────────────────────────────
  const allAnswered = useMemo(
    () => questions.length > 0 && questions.every((q) => answers[q.id] !== undefined),
    [questions, answers],
  )
  const isFirst = currentQIdx === 0
  const isLast  = currentQIdx === questions.length - 1

  // ── Handlers ────────────────────────────────────────────────────
  const selectAnswer = useCallback((qId, idx) => {
    setAnswers((prev) => ({ ...prev, [qId]: idx }))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!allAnswered) return
    setPhase('submitting')

    try {
      const { data } = await quizApi.submit({
        session_id: sessionId,
        topic_id:   currentTopic.id,
        answers:    questions.map((q) => ({ question_id: q.id, answer: answers[q.id] })),
      })

      setResults(data)
      setPhase('results')
      handleQuizSubmit(currentTopic.id, data)

      // If the curriculum was adapted, sync updated topic titles from server
      if (data.curriculum_adapted) {
        sessionsApi.get(sessionId)
          .then(({ data: sess }) => syncCurriculum(sess.curriculum))
          .catch(() => {})
      }

      // Fire feedback concurrently — non-blocking; result shown when ready
      const wrongQs = questions
        .filter((q) => {
          const r = data.results.find((r) => r.question_id === q.id)
          return r && !r.correct
        })
        .map((q) => q.question)

      setFeedbackLoading(true)
      quizApi
        .feedback({
          session_id:      sessionId,
          topic_id:        currentTopic.id,
          score:           data.score,
          correct:         data.correct,
          total:           data.total,
          wrong_questions: wrongQs,
        })
        .then(({ data: fb }) => setFeedback(fb.feedback))
        .catch(() => {})
        .finally(() => setFeedbackLoading(false))

    } catch {
      setErrorMsg('Quiz submission failed. Please try again.')
      setPhase('error')
    }
  }, [allAnswered, sessionId, currentTopic, questions, answers, updateMastery])

  const handleNextTopic = useCallback(() => {
    navigate('/reflection')
  }, [navigate])

  const handleRetake = useCallback(() => {
    setRetakeKey((k) => k + 1)
  }, [])

  // ── Guard ────────────────────────────────────────────────────────
  if (!sessionId || !currentTopic) return null

  // ── Phase: loading ───────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="h-full overflow-y-auto">
        <QuizLoadingState topicTitle={currentTopic.title} />
      </div>
    )
  }

  // ── Phase: error ─────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="h-full">
        <QuizErrorState message={errorMsg} onRetry={handleRetake} />
      </div>
    )
  }

  // ── Phase: taking / submitting / results ─────────────────────────
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-9 h-9 rounded-xl bg-examiner/10 border border-examiner/20 flex items-center justify-center flex-shrink-0">
            <Brain size={16} className="text-examiner" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs font-bold text-examiner uppercase tracking-widest">
              Knowledge Check
            </p>
            <p className="text-sm font-semibold text-text-primary truncate">
              {currentTopic.title}
            </p>
          </div>
          <span className="badge badge-examiner">{level}</span>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Taking + Submitting ──────────────────────────── */}
          {(phase === 'taking' || phase === 'submitting') && (
            <motion.div
              key="taking"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28 }}
            >
              {/* Progress bar */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xs text-text-muted whitespace-nowrap tabular-nums">
                  {currentQIdx + 1} / {questions.length}
                </span>
                <div
                  className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={currentQIdx + 1}
                  aria-valuemin={1}
                  aria-valuemax={questions.length}
                >
                  <motion.div
                    className="h-full rounded-full bg-examiner"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQIdx + 1) / questions.length) * 100}%` }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
                <span className="text-2xs text-text-muted tabular-nums">
                  {Object.keys(answers).length}/{questions.length} answered
                </span>
              </div>

              {/* Question card — slides between questions */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQIdx}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                >
                  <QuizCard
                    question={questions[currentQIdx]}
                    selectedIndex={answers[questions[currentQIdx]?.id]}
                    onSelect={(idx) => selectAnswer(questions[currentQIdx].id, idx)}
                    disabled={phase === 'submitting'}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigation row */}
              <div className="flex items-center justify-between mt-6 gap-3">
                {/* Prev */}
                <button
                  onClick={() => setCurrentQIdx((i) => Math.max(0, i - 1))}
                  disabled={isFirst || phase === 'submitting'}
                  aria-label="Previous question"
                  className="btn-secondary btn-sm gap-1.5"
                >
                  <ChevronLeft size={14} aria-hidden="true" /> Prev
                </button>

                {/* Dot indicators */}
                <div className="flex gap-2" role="tablist" aria-label="Questions">
                  {questions.map((q, i) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIdx(i)}
                      role="tab"
                      aria-selected={i === currentQIdx}
                      aria-label={`Question ${i + 1}${answers[q.id] !== undefined ? ', answered' : ''}`}
                      className={[
                        'w-2 h-2 rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-examiner/50 focus-visible:outline-none',
                        i === currentQIdx
                          ? 'bg-examiner scale-125'
                          : answers[q.id] !== undefined
                          ? 'bg-examiner/50'
                          : 'bg-bg-elevated',
                      ].join(' ')}
                    />
                  ))}
                </div>

                {/* Next / Submit */}
                {isLast ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!allAnswered || phase === 'submitting'}
                    className="btn-primary btn-sm gap-1.5 min-w-[110px] justify-center"
                    aria-label="Submit quiz"
                  >
                    {phase === 'submitting' ? (
                      <>
                        <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                        Grading…
                      </>
                    ) : (
                      'Submit Quiz'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQIdx((i) => Math.min(questions.length - 1, i + 1))}
                    disabled={phase === 'submitting'}
                    aria-label="Next question"
                    className="btn-primary btn-sm gap-1.5"
                  >
                    Next <ChevronRight size={14} aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Hint: submit requires all questions */}
              {isLast && !allAnswered && (
                <p className="text-center text-2xs text-text-muted mt-3">
                  Answer all {questions.length} questions to submit
                </p>
              )}
            </motion.div>
          )}

          {/* ── Results ──────────────────────────────────────── */}
          {phase === 'results' && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Score card */}
              <ResultBanner
                correct={results.correct}
                total={results.total}
                score={results.score}
                passed={results.passed}
              />

              {/* Adaptive curriculum banner */}
              {results.curriculum_adapted && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-start gap-3 px-4 py-3.5 rounded-xl
                             bg-reflection/8 border border-reflection/25"
                  role="status"
                >
                  <Sparkles size={15} className="text-reflection flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      Curriculum adapted
                    </p>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                      Your mentor has updated the remaining topics to focus on your weak areas.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* AI feedback */}
              <div className="mt-5 mb-6 rounded-xl border border-border bg-bg-card p-4">
                <p className="text-2xs font-bold text-text-muted uppercase tracking-widest mb-2">
                  Mentor Feedback
                </p>
                {feedbackLoading ? (
                  <div className="space-y-2" aria-busy="true" aria-label="Loading feedback">
                    <div className="skeleton h-3.5 rounded w-full" />
                    <div className="skeleton h-3.5 rounded w-4/5" />
                  </div>
                ) : feedback ? (
                  <p className="text-sm text-text-secondary leading-relaxed">{feedback}</p>
                ) : null}
              </div>

              {/* Review answers */}
              <div className="mb-8">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">
                  Review Answers
                </p>
                <div className="space-y-2">
                  {questions.map((q, i) => {
                    const r = results.results.find((r) => r.question_id === q.id)
                    return r ? (
                      <ExplanationDrawer
                        key={q.id}
                        questionNumber={i + 1}
                        question={q.question}
                        options={q.options}
                        selectedIndex={r.chosen_index}
                        correctIndex={r.correct_index}
                        correct={r.correct}
                        explanation={r.explanation}
                      />
                    ) : null
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRetake}
                  className="btn-secondary btn-sm gap-1.5"
                >
                  <RotateCcw size={13} aria-hidden="true" /> Retake Quiz
                </button>

                {results.passed ? (
                  <button
                    onClick={handleNextTopic}
                    className="btn-primary btn-sm gap-1.5 sm:ml-auto"
                  >
                    View Reflection <ArrowRight size={14} aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/learn')}
                    className="btn-secondary btn-sm gap-1.5 sm:ml-auto"
                  >
                    <BookOpen size={13} aria-hidden="true" /> Review Lesson
                  </button>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
