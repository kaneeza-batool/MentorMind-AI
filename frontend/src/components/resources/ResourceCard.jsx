import { ExternalLink, Clock, Lightbulb } from 'lucide-react'
import { TypeBadge, DifficultyBadge } from './ResourceBadge'

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function ResourceCardSkeleton() {
  return (
    <div className="card p-4 space-y-3 animate-pulse" aria-hidden="true">
      <div className="flex items-start gap-3">
        <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3.5 rounded w-3/4" />
          <div className="skeleton h-3 rounded w-1/3" />
        </div>
      </div>
      <div className="skeleton h-3 rounded w-full" />
      <div className="skeleton h-3 rounded w-5/6" />
      <div className="flex gap-2 pt-1">
        <div className="skeleton h-5 rounded w-14" />
        <div className="skeleton h-5 rounded w-20" />
      </div>
    </div>
  )
}

// ── Type icon mapping ─────────────────────────────────────────────────────────

const TYPE_ICON = {
  video:   '▶',
  article: '📄',
  docs:    '📚',
  course:  '🎯',
  repo:    '⚡',
}

const PROVIDER_COLOR = {
  YouTube:      'text-[#FF0000]',
  freeCodeCamp: 'text-[#0A0A23]',
  MDN:          'text-[#1D2E3A]',
  Exercism:     'text-[#009CAB]',
  Codewars:     'text-[#B1361E]',
  GitHub:       'text-text-primary',
}

// ── Card ──────────────────────────────────────────────────────────────────────

export default function ResourceCard({ resource }) {
  const { title, url, type, source, why, duration, difficulty } = resource
  const icon = TYPE_ICON[type] ?? '🔗'

  const handleOpen = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <article
      className="card p-4 flex flex-col gap-3 transition-all duration-200
                 hover:border-border-strong hover:shadow-card-hover"
      aria-label={`Resource: ${title}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg bg-bg-elevated border border-border
                     flex items-center justify-center flex-shrink-0 text-sm"
          aria-hidden="true"
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary leading-snug line-clamp-2">
            {title}
          </h3>
          <p className="text-2xs text-text-muted mt-0.5">{source}</p>
        </div>
        {duration && (
          <div className="flex items-center gap-1 text-2xs text-text-muted flex-shrink-0">
            <Clock size={10} aria-hidden="true" />
            <span>{duration}</span>
          </div>
        )}
      </div>

      {/* Why recommended */}
      <div className="flex items-start gap-2">
        <Lightbulb size={12} className="text-examiner flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-text-secondary leading-relaxed">{why}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <TypeBadge type={type} />
          <DifficultyBadge difficulty={difficulty} />
        </div>
        <button
          onClick={handleOpen}
          className="flex items-center gap-1 text-2xs font-semibold text-resource
                     hover:text-resource/80 transition-colors duration-150 flex-shrink-0"
          aria-label={`Open ${title} in a new tab`}
        >
          Open <ExternalLink size={11} aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
