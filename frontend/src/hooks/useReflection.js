import { useState, useCallback } from 'react'
import { reflection as reflectionApi } from '@/services/api'
import useLearningStore from '@/store/learningStore'

export default function useReflection() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const sessionId        = useLearningStore((s) => s.sessionId)
  const quizResults      = useLearningStore((s) => s.quizResults)
  const curriculum       = useLearningStore((s) => s.curriculum)
  const currentTopicIndex = useLearningStore((s) => s.currentTopicIndex)
  const reflectionHistory = useLearningStore((s) => s.reflectionHistory)
  const setReflection     = useLearningStore((s) => s.setReflection)
  const setReflectionHistory = useLearningStore((s) => s.setReflectionHistory)

  const currentTopic = curriculum[currentTopicIndex] ?? null

  const generateReflection = useCallback(async () => {
    if (!sessionId || !currentTopic) return

    // Serve from cache if the reflection for this topic was already generated
    if (reflectionHistory[currentTopic.id]) {
      setReflection(reflectionHistory[currentTopic.id])
      return
    }

    if (!quizResults) return

    setLoading(true)
    setError(null)
    try {
      const { data } = await reflectionApi.generate({
        session_id:   sessionId,
        topic_id:     currentTopic.id,
        quiz_results: quizResults,
      })
      setReflection(data)
      setReflectionHistory(currentTopic.id, data)
    } catch {
      setError('Reflection temporarily unavailable.')
    } finally {
      setLoading(false)
    }
  }, [sessionId, quizResults, currentTopic, reflectionHistory, setReflection, setReflectionHistory])

  return { generateReflection, loading, error }
}
