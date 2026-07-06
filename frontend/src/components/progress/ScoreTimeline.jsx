import { CheckCircle2, Play, Lock } from 'lucide-react'

export default function ScoreTimeline({ curriculum = [], mastery = {} }) {
  return (
    <ol className="space-y-0" aria-label="Learning timeline">
      {curriculum.map((topic, i) => {
        const score       = mastery[topic.id] || 0
        const isCompleted = topic.status === 'completed'
        const isActive    = topic.status === 'active'
        const isLast      = i === curriculum.length - 1
        const dotColor    = isCompleted
          ? 'bg-mentor'
          : isActive
          ? 'bg-primary-400'
          : 'bg-bg-elevated border border-border-strong'

        return (
          <li key={topic.id} className="flex items-start gap-3">
            {/* Timeline connector */}
            <div className="flex flex-col items-center gap-0 flex-shrink-0">
              <div className={`w-3 h-3 rounded-full mt-1 ${dotColor}`} aria-hidden="true">
                {isCompleted && <CheckCircle2 size={12} className="text-mentor -ml-px -mt-px" />}
              </div>
              {!isLast && <div className="w-px bg-border" style={{ minHeight: 24 }} />}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs leading-tight truncate ${isActive ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                  {topic.title}
                </span>
                {isCompleted && (
                  <span className="text-2xs font-bold text-mentor tabular-nums flex-shrink-0">
                    {score.toFixed(0)}%
                  </span>
                )}
                {isActive && (
                  <span className="flex items-center gap-1 text-2xs text-primary-400 flex-shrink-0">
                    <Play size={9} aria-hidden="true" /> Active
                  </span>
                )}
                {!isCompleted && !isActive && (
                  <Lock size={10} className="text-text-muted flex-shrink-0" aria-hidden="true" />
                )}
              </div>
              {isCompleted && (
                <div className="mt-1.5 h-1 bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${score >= 80 ? 'bg-mentor' : score >= 60 ? 'bg-primary-400' : 'bg-coach'}`}
                    style={{ width: `${score}%`, transition: 'width 0.9s ease' }}
                  />
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
