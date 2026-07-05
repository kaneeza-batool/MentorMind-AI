import { useState, useCallback } from 'react'
import { progress as progressApi } from '@/services/api'
import useLearningStore from '@/store/learningStore'

export default function useProgress() {
  const [loading, setLoading] = useState(false)
  const sessionId  = useLearningStore((s) => s.sessionId)
  const updateMastery = useLearningStore((s) => s.updateMastery)
  const setWeakAreas  = useLearningStore((s) => s.setWeakAreas)

  const fetchProgress = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const { data } = await progressApi.get(sessionId)
      Object.entries(data.mastery ?? {}).forEach(([id, score]) => updateMastery(id, score))
      setWeakAreas(data.weak_areas ?? [])
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  return { fetchProgress, loading }
}
