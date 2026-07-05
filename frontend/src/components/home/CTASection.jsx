import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Brain, Github, Twitter } from 'lucide-react'

export default function CTASection() {
  return (
    <>
      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="relative py-28 lg:py-40 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Background radial burst */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.14) 0%, transparent 55%),
              radial-gradient(ellipse at 20% 80%, rgba(192,132,252,0.07) 0%, transparent 40%),
              radial-gradient(ellipse at 80% 20%, rgba(52,211,153,0.05) 0%, transparent 35%)
            `,
          }}
        />

        {/* Faint grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          {/* Glowing orb */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-reflection flex items-center justify-center shadow-glow-primary">
                <Brain size={36} className="text-white" />
              </div>
              {/* Ping rings */}
              <span className="absolute inset-0 rounded-2xl border border-primary/40 animate-ping-slow" />
              <span className="absolute inset-[-6px] rounded-[22px] border border-primary/20 animate-ping-slow delay-300" />
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            className="text-4xl lg:text-6xl font-black tracking-tighter text-text-primary mb-5 leading-[1.05]"
          >
            Your AI mentor team{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #A5B4FC 0%, #C084FC 50%, #34D399 100%)',
              }}
            >
              is ready.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="text-lg text-text-secondary mb-10 leading-relaxed"
          >
            What will you master today?
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.34, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <Link to="/onboarding">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(129,140,248,0.45)' }}
                whileTap={{ scale: 0.96 }}
                className="btn-primary btn-lg text-base font-bold px-10 group"
              >
                Begin Your Journey
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-200" />
              </motion.button>
            </Link>

            <p className="text-xs text-text-muted">
              Free to start · No setup required · Powered by Google Gemini 2.0
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-bg-surface">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary-500 to-reflection flex items-center justify-center">
              <Brain size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold text-text-primary">
              MentorMind <span className="text-primary-400">AI</span>
            </span>
          </div>

          <p className="text-xs text-text-muted text-center">
            Built with Google Gemini · Google ADK · React · FastAPI
          </p>

          <div className="flex items-center gap-1">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost p-2 rounded-lg"
              aria-label="GitHub"
            >
              <Github size={16} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost p-2 rounded-lg"
              aria-label="Twitter"
            >
              <Twitter size={16} />
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}
