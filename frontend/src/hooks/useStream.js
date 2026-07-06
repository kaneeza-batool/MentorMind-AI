import { useEffect, useRef, useState, useCallback } from 'react'
import { createLessonStream, learning as learningApi } from '@/services/api'
import useLearningStore from '@/store/learningStore'

const MAX_RETRIES = 2

export default function useStream(sessionId, topicId, { enabled = false } = {}) {
  const appendLesson      = useLearningStore((s) => s.appendLesson)
  const setLoading        = useLearningStore((s) => s.setLessonLoading)
  const setComplete       = useLearningStore((s) => s.setLessonComplete)
  const setError          = useLearningStore((s) => s.setStreamError)
  const clearLesson       = useLearningStore((s) => s.clearLesson)
  const saveLessonHistory = useLearningStore((s) => s.saveLessonHistory)

  const sourceRef   = useRef(null)
  const startRef    = useRef(null)  // lesson start timestamp for study-time tracking
  const attemptsRef = useRef({})
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    if (!enabled || !sessionId || !topicId) return

    clearLesson()
    setLoading(true)
    startRef.current = Date.now()

    const source = createLessonStream(sessionId, topicId)
    sourceRef.current = source

    source.addEventListener('chunk', (e) => {
      appendLesson(e.data)
    })

    source.addEventListener('done', () => {
      setLoading(false)
      setComplete(true)
      saveLessonHistory(topicId)
      source.close()

      // Record study time on backend (fire-and-forget — don't block the UI)
      const elapsedMinutes = Math.max(1, Math.round((Date.now() - startRef.current) / 60_000))
      learningApi
        .complete(sessionId, topicId, elapsedMinutes)
        .catch(() => { /* non-critical */ })
    })

    source.addEventListener('stream_error', (e) => {
      setLoading(false)
      setError(e.data || 'Lesson generation failed. Please retry.')
      source.close()
    })

    source.onerror = () => {
      if (source.readyState !== EventSource.CLOSED) {
        setLoading(false)
        setError('Connection lost. Please retry.')
        source.close()
      }
    }

    return () => source.close()
  }, [enabled, sessionId, topicId, retryTick]) // eslint-disable-line react-hooks/exhaustive-deps

  const retry = useCallback(() => {
    const attempts = attemptsRef.current[topicId] ?? 0
    if (attempts < MAX_RETRIES) {
      attemptsRef.current[topicId] = attempts + 1
      sourceRef.current?.close()
      setError(null)
      setRetryTick((n) => n + 1)
    }
  }, [topicId, setError])

  return {
    cancel:   () => sourceRef.current?.close(),
    retry,
    canRetry: (attemptsRef.current[topicId] ?? 0) < MAX_RETRIES,
  }
}
