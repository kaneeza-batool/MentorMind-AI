import { useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'

const ROUTE_LABELS = {
  '/learn':           'Learn',
  '/quiz':            'Quiz',
  '/reflection':      'Reflection',
  '/resources':       'Resources',
  '/mission-control': 'Mission Control',
  '/journey-complete':'Journey Complete',
}

export default function Header({ onMenuOpen }) {
  const location   = useLocation()
  const pageLabel  = ROUTE_LABELS[location.pathname] ?? 'MentorMind'

  return (
    <header className="md:hidden flex items-center gap-3 px-4 py-3.5 border-b border-border bg-bg-surface flex-shrink-0">
      <button
        onClick={onMenuOpen}
        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary
                   hover:bg-bg-elevated transition-colors"
        aria-label="Open navigation menu"
        aria-haspopup="dialog"
      >
        <Menu size={18} />
      </button>
      <h1 className="text-sm font-semibold text-text-primary">{pageLabel}</h1>
    </header>
  )
}
