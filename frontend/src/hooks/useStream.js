import { useEffect, useRef } from 'react'
import { createLessonStream } from '@/services/api'
import useLearningStore from '@/store/learningStore'

export default function useStream(sessionId, topicId, { enabled = false } = {}) {
  const appendLesson   = useLearningStore((s) => s.appendLesson)
  const setLoading     = useLearningStore((s) => s.setLessonLoading)
  const sourceRef      = useRef(null)

  useEffect(() => {
    if (!enabled || !sessionId || !topicId) return

    setLoading(true)
    const source = createLessonStream(sessionId, topicId)
    sourceRef.current = source

    source.onmessage = (e) => {
      if (e.data === '[DONE]') {
        setLoading(false)
        source.close()
      } else {
        appendLesson(e.data)
      }
    }

    source.onerror = () => {
      setLoading(false)
      source.close()
    }

    return () => source.close()
  }, [enabled, sessionId, topicId])

  return { cancel: () => sourceRef.current?.close() }
}
