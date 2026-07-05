import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Play, Sparkles } from 'lucide-react'
import AgentOrbit from './AgentOrbit'

const ease = [0.4, 0, 0.2, 1]

const fadeUp = (delay = 0, duration = 0.65) => ({
  initial:    { opacity: 0, y: 28 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration, delay, ease },
})

export default function HeroSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const orbitY = useTransform(scrollYProgress, [0, 1], [0, -55])

  return (
    <section
      id="hero"
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-8"
    >
      {/* ── Background layers ──────────────────────────────── */}
      <div className="absolute inset-0 mesh-bg pointer-events-none" />

      {/* Top beam */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.13) 0%, transparent 65%)',
        }}
      />

      {/* Ambient blobs */}
      <div className="absolute top-[30%] left-[15%]  w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(129,140,248,0.07)' }} />
      <div className="absolute top-[40%] right-[12%] w-56 h-56 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(192,132,252,0.06)' }} />
      <div className="absolute bottom-[20%] left-[40%] w-48 h-48 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(52,211,153,0.05)' }} />

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-bg to-transparent pointer-events-none" />

      {/* ── Content ────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto w-full">

        {/* Badge */}
        <motion.div {...fadeUp(0.1)}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/8 text-primary-400 text-xs font-semibold tracking-wide mb-8 cursor-default">
            <Sparkles size={12} className="animate-pulse" />
            6 Specialized AI Agents · Powered by Google Gemini
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.2)}
          className="text-[clamp(2.8rem,8vw,5.5rem)] font-black tracking-tighter leading-[1.04] mb-6"
        >
          <span className="text-text-primary">Learn Anything.</span>
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #A5B4FC 0%, #C084FC 45%, #34D399 100%)',
            }}
          >
            Master Everything.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          {...fadeUp(0.36)}
          className="text-base md:text-lg lg:text-xl text-text-secondary max-w-2xl leading-relaxed mb-10"
        >
          Meet MentorMind AI — your autonomous AI mentor team that plans, teaches, evaluates,
          reflects, and adapts to your unique learning journey.
        </motion.p>

        {/* CTAs */}
        <motion.div {...fadeUp(0.5)} className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <Link to="/onboarding">
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 28px rgba(129,140,248,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary btn-lg text-base font-bold group"
            >
              Start Your Journey
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
            </motion.button>
          </Link>
          <a href="#how-it-works">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-secondary btn-lg text-base font-semibold gap-3"
            >
              <span className="w-7 h-7 rounded-full border border-current flex items-center justify-center flex-shrink-0">
                <Play size={11} className="translate-x-px" />
              </span>
              See How It Works
            </motion.button>
          </a>
        </motion.div>

        {/* Trust line */}
        <motion.p {...fadeUp(0.62)} className="text-xs text-text-muted mb-16">
          Free to start · No setup required · Google Gemini 2.0 Flash
        </motion.p>

        {/* Agent orbit illustration */}
        <motion.div
          style={{ y: orbitY }}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.75, duration: 0.9, ease }}
          className="scale-[0.58] xs:scale-[0.68] sm:scale-75 md:scale-[0.88] lg:scale-100 origin-top"
        >
          <AgentOrbit />
        </motion.div>
      </div>
    </section>
  )
}
