export default function MasteryRing({ score = 0, size = 64, strokeWidth = 5 }) {
  const r             = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset        = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference
  const color         = score >= 80 ? '#34D399' : score >= 60 ? '#FBBF24' : score > 0 ? '#F87171' : '#1A1B26'

  return (
    <div
      className="relative inline-flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Mastery: ${Math.round(score)}%`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="#1A1B26" strokeWidth={strokeWidth} fill="none"
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s ease, stroke 0.3s ease' }}
        />
      </svg>
      <span className="absolute text-2xs font-bold text-text-primary tabular-nums">
        {score > 0 ? `${Math.round(score)}%` : '—'}
      </span>
    </div>
  )
}
