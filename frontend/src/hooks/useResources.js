import { useState, useCallback } from 'react'
import { resources as resourcesApi } from '@/services/api'
import useLearningStore from '@/store/learningStore'

export default function useResources() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const sessionId         = useLearningStore((s) => s.sessionId)
  const curriculum        = useLearningStore((s) => s.curriculum)
  const currentTopicIndex = useLearningStore((s) => s.currentTopicIndex)
  const storedResources   = useLearningStore((s) => s.resources)
  const setResources      = useLearningStore((s) => s.setResources)

  const currentTopic = curriculum[currentTopicIndex] ?? null

  const fetchResources = useCallback(async (topicId, { force = false } = {}) => {
    const tid = topicId || currentTopic?.id
    if (!tid || !sessionId) return

    // Read live store state to avoid stale closure on retry
    const live = useLearningStore.getState().resources
    if (!force && live[tid]?.length > 0) return

    setLoading(true)
    setError(null)
    try {
      const { data } = await resourcesApi.forTopic(tid, sessionId)
      setResources(tid, data.resources)
    } catch {
      setError('Resources temporarily unavailable. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [sessionId, currentTopic, setResources]) // storedResources removed — we read live state instead

  return { fetchResources, loading, error }
}
