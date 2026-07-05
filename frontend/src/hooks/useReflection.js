import { useState, useCallback } from 'react'
import { reflection as reflectionApi } from '@/services/api'
import useLearningStore from '@/store/learningStore'

export default function useReflection() {
  const [loading, setLoading] = useState(false)
  const sessionId    = useLearningStore((s) => s.sessionId)
  const quizResults  = useLearningStore((s) => s.quizResults)
  const setReflection = useLearningStore((s) => s.setReflection)

  const generateReflection = useCallback(async () => {
    if (!sessionId || !quizResults) return
    setLoading(true)
    try {
      const { data } = await reflectionApi.generate({ session_id: sessionId, quiz_results: quizResults })
      setReflection(data)
    } finally {
      setLoading(false)
    }
  }, [sessionId, quizResults])

  return { generateReflection, loading }
}
