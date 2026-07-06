import { useEffect, useRef, useState, useCallback } from 'react'
import { createLessonStream } from '@/services/api'
import useLearningStore from '@/store/learningStore'

const MAX_RETRIES = 2

/**
 * Opens an SSE connection to /learn/stream and pipes chunks into the Zustand store.
 *
 * Named SSE events used (must match backend):
 *   chunk        — a piece of lesson markdown
 *   done         — stream finished
 *   stream_error — backend-reported error (avoids clashing with the browser's
 *                  reserved 'error' EventSource event)
 */
export default function useStream(sessionId, topicId, { enabled = false } = {}) {
  const appendLesson       = useLearningStore((s) => s.appendLesson)
  const setLoading         = useLearningStore((s) => s.setLessonLoading)
  const setComplete        = useLearningStore((s) => s.setLessonComplete)
  const setError           = useLearningStore((s) => s.setStreamError)
  const clearLesson        = useLearningStore((s) => s.clearLesson)
  const saveLessonHistory  = useLearningStore((s) => s.saveLessonHistory)

  const sourceRef = useRef(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled || !sessionId || !topicId) return

    clearLesson()
    setLoading(true)

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
    })

    // Backend-reported application error (named 'stream_error' to avoid the
    // reserved browser EventSource 'error' event).
    source.addEventListener('stream_error', (e) => {
      setLoading(false)
      setError(e.data || 'Lesson generation failed. Please retry.')
      source.close()
    })

    // Network / HTTP error (connection refused, 5xx, etc.)
    source.onerror = () => {
      if (source.readyState !== EventSource.CLOSED) {
        setLoading(false)
        setError('Connection lost. Please retry.')
        source.close()
      }
    }

    return () => source.close()
  }, [enabled, sessionId, topicId, attempt])

  const retry = useCallback(() => {
    if (attempt < MAX_RETRIES) {
      sourceRef.current?.close()
      setError(null)
      setAttempt((c) => c + 1)
    }
  }, [attempt, setError])

  return {
    cancel:   () => sourceRef.current?.close(),
    retry,
    canRetry: attempt < MAX_RETRIES,
  }
}
