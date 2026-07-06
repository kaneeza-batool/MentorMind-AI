import { TrendingUp, TrendingDown } from 'lucide-react'

export default function AdaptiveBadge({ averageScore = 0, weakAreas = [] }) {
  if (!averageScore && !weakAreas.length) return null

  const needsAdapt = weakAreas.length > 0 || averageScore < 70

  return (
    <span
      className={`badge ${needsAdapt ? 'badge-coach' : 'badge-mentor'}`}
      aria-label={needsAdapt ? 'Adaptive review suggested' : 'On track'}
    >
      {needsAdapt
        ? <><TrendingDown size={11} aria-hidden="true" /> Review suggested</>
        : <><TrendingUp   size={11} aria-hidden="true" /> On track</>
      }
    </span>
  )
}
