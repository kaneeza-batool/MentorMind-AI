import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sessions } from '@/services/api'
import useLearningStore from '@/store/learningStore'

export default function useSession() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const initSession = useLearningStore((s) => s.initSession)
  const navigate    = useNavigate()

  const createSession = async ({ skill, goal, level }) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await sessions.create({ skill, goal, level })
      initSession({ ...data, skill, goal, level })
      navigate('/learn')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  return { createSession, loading, error }
}
