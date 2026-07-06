import { AlertTriangle, RefreshCw } from 'lucide-react'
import ResourceCard, { ResourceCardSkeleton } from './ResourceCard'

// ── Category sections ─────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'video',    label: 'Videos',           icon: '▶' },
  { key: 'article',  label: 'Articles & Docs',   icon: '📄' },
  { key: 'practice', label: 'Practice',           icon: '🎯' },
  { key: 'project',  label: 'Projects',           icon: '⚡' },
]

function CategorySection({ label, icon, resources }) {
  if (!resources.length) return null
  return (
    <section aria-label={label}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm" aria-hidden="true">{icon}</span>
        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">
          {label}
        </h3>
        <span className="text-2xs text-text-muted">({resources.length})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {resources.map((r, i) => (
          <ResourceCard key={`${r.url}-${i}`} resource={r} />
        ))}
      </div>
    </section>
  )
}

// ── Skeleton feed ─────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading resources…">
      {[0, 1].map((s) => (
        <div key={s}>
          <div className="flex items-center gap-2 mb-3">
            <div className="skeleton w-4 h-4 rounded" aria-hidden="true" />
            <div className="skeleton h-3 w-24 rounded" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ResourceCardSkeleton />
            <ResourceCardSkeleton />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main feed ─────────────────────────────────────────────────────────────────

export default function ResourceFeed({ resources = [], loading = false, error = null, onRetry }) {
  if (loading && !resources.length) return <FeedSkeleton />

  if (error && !resources.length) {
    return (
      <div className="text-center py-8">
        <AlertTriangle size={24} className="text-coach mx-auto mb-2" aria-hidden="true" />
        <p className="text-sm font-semibold text-text-primary mb-1">Could not load resources</p>
        <p className="text-xs text-text-muted mb-4 leading-relaxed max-w-xs mx-auto">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn-secondary btn-sm gap-1.5">
            <RefreshCw size={12} aria-hidden="true" /> Try Again
          </button>
        )}
      </div>
    )
  }

  if (!resources.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-text-muted">No resources available for this topic.</p>
      </div>
    )
  }

  const byCategory = (cat) =>
    resources.filter((r) => (r.category || deriveCategory(r.type)) === cat)

  return (
    <div className="space-y-8">
      {CATEGORIES.map(({ key, label, icon }) => (
        <CategorySection
          key={key}
          label={label}
          icon={icon}
          resources={byCategory(key)}
        />
      ))}
    </div>
  )
}

function deriveCategory(type) {
  if (type === 'video')                  return 'video'
  if (type === 'article' || type === 'docs') return 'article'
  if (type === 'course')                 return 'practice'
  if (type === 'repo')                   return 'project'
  return 'article'
}
