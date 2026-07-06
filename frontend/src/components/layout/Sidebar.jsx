import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, ClipboardList, Sparkles, Library,
  BarChart2, Brain, X,
} from 'lucide-react'
import useLearningStore from '@/store/learningStore'

const NAV_ITEMS = [
  { label: 'Learn',           path: '/learn',           Icon: BookOpen,       always: true },
  { label: 'Quiz',            path: '/quiz',            Icon: ClipboardList,  lockKey: 'quiz' },
  { label: 'Reflection',      path: '/reflection',      Icon: Sparkles,       lockKey: 'reflection' },
  { label: 'Resources',       path: '/resources',       Icon: Library,        always: true },
  { label: 'Mission Control', path: '/mission-control', Icon: BarChart2,      always: true },
]

function NavItem({ item, isLocked, onClick }) {
  const { label, path, Icon } = item

  if (isLocked) {
    return (
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                   text-text-muted cursor-not-allowed select-none"
        aria-label={`${label} — complete previous steps to unlock`}
        title="Complete previous steps to unlock"
      >
        <Icon size={16} aria-hidden="true" />
        <span className="text-sm font-medium">{label}</span>
        <span className="ml-auto text-2xs opacity-40">🔒</span>
      </div>
    )
  }

  return (
    <NavLink
      to={path}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
         ${isActive
           ? 'bg-primary/12 text-primary-300 border border-primary/20'
           : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
         }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} aria-hidden="true" className={isActive ? 'text-primary-300' : ''} />
          <span className="text-sm font-medium">{label}</span>
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              aria-hidden="true"
            />
          )}
        </>
      )}
    </NavLink>
  )
}

function SidebarContent({ onNavClick }) {
  const sessionId         = useLearningStore((s) => s.sessionId)
  const curriculum        = useLearningStore((s) => s.curriculum)
  const currentTopicIndex = useLearningStore((s) => s.currentTopicIndex)
  const lessonHistory     = useLearningStore((s) => s.lessonHistory)
  const lessonComplete    = useLearningStore((s) => s.lessonComplete)
  const quizResults       = useLearningStore((s) => s.quizResults)
  const reflectionHistory = useLearningStore((s) => s.reflectionHistory)
  const skill             = useLearningStore((s) => s.skill)
  const level             = useLearningStore((s) => s.level)

  const currentTopic = curriculum[currentTopicIndex] ?? null

  const canQuiz = !!(
    currentTopic && (lessonHistory[currentTopic.id] || lessonComplete)
  )
  const canReflect = !!(
    quizResults || (currentTopic && reflectionHistory[currentTopic.id])
  )

  const lockMap = { quiz: !canQuiz, reflection: !canReflect }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
          <Brain size={15} className="text-primary-300" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-primary leading-tight">MentorMind</p>
          <p className="text-2xs text-text-muted truncate">AI Learning</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isLocked={!sessionId || (!item.always && lockMap[item.lockKey])}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* Session info */}
      {sessionId && skill && (
        <div className="px-4 py-4 border-t border-border">
          <p className="text-2xs text-text-muted uppercase tracking-widest font-semibold mb-1">
            Current Session
          </p>
          <p className="text-xs font-semibold text-text-primary truncate">{skill}</p>
          {level && (
            <p className="text-2xs text-text-muted capitalize mt-0.5">{level}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Desktop sidebar ───────────────────────────────────────────────────────────

export function DesktopSidebar() {
  return (
    <aside
      className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-border bg-bg-surface"
      aria-label="Sidebar navigation"
    >
      <SidebarContent />
    </aside>
  )
}

// ── Mobile drawer ─────────────────────────────────────────────────────────────

export function MobileDrawer({ open, onClose }) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            className="fixed inset-y-0 left-0 w-72 bg-bg-surface border-r border-border z-50 md:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            aria-label="Mobile navigation drawer"
            role="dialog"
            aria-modal="true"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted
                         hover:text-text-primary hover:bg-bg-elevated transition-colors"
              aria-label="Close navigation"
            >
              <X size={16} />
            </button>
            <SidebarContent onNavClick={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

// Default export: desktop sidebar (AppShell uses named exports for mobile)
export default DesktopSidebar
