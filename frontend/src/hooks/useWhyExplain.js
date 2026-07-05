import { useState } from 'react'
import { quiz as quizApi } from '@/services/api'

export default function useWhyExplain() {
  const [explanation, setExplanation] = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  const explain = async ({ question, chosenAnswer, correctAnswer, topic }) => {
    setLoading(true)
    setError(null)
    setExplanation(null)
    try {
      const { data } = await quizApi.explain({ question, chosen_answer: chosenAnswer, correct_answer: correctAnswer, topic })
      setExplanation(data.explanation)
    } catch {
      setError('Could not load explanation. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const clear = () => { setExplanation(null); setError(null) }

  return { explain, explanation, loading, error, clear }
}
