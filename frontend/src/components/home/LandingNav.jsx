import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, ArrowRight, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { label: 'AI Agents',    href: '#agents' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features',     href: '#features' },
]

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-bg-card/80 backdrop-blur-xl border-b border-border shadow-modal/10'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-reflection flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-primary transition-shadow duration-300">
              <Brain size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-text-primary">
              MentorMind <span className="text-primary-400">AI</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <Link to="/onboarding" className="hidden sm:block">
              <button className="btn-primary text-xs px-4 py-2 group">
                Start Learning
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
            <button
              className="md:hidden btn-ghost p-2"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 inset-x-0 z-40 bg-bg-card/95 backdrop-blur-xl border-b border-border px-6 py-4 flex flex-col gap-2 md:hidden"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all"
              >
                {link.label}
              </a>
            ))}
            <Link to="/onboarding" onClick={() => setMobileOpen(false)}>
              <button className="btn-primary w-full mt-2">Start Learning</button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
