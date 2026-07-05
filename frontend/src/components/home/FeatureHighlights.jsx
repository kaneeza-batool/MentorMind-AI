import { motion } from 'framer-motion'
import {
  Zap, Activity, HelpCircle, Map, BookMarked, BarChart3,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Map,
    color: '#818CF8',
    title: 'Adaptive Curriculum',
    description:
      'The Strategist builds a dynamic learning path that re-routes itself based on your quiz performance — no two journeys are the same.',
  },
  {
    icon: Zap,
    color: '#34D399',
    title: 'Live Lesson Streaming',
    description:
      'Lessons arrive word-by-word as they are generated, creating an immersive real-time learning experience that feels alive.',
  },
  {
    icon: Activity,
    color: '#FBBF24',
    title: 'Intelligent Quizzing',
    description:
      'The Examiner calibrates question difficulty to your mastery level — always challenging you at exactly the right edge.',
  },
  {
    icon: HelpCircle,
    color: '#F87171',
    title: '"Why?" Explanations',
    description:
      'Every quiz answer has a "Why?" button. One click delivers a deep, instant explanation of the reasoning behind it.',
  },
  {
    icon: BarChart3,
    color: '#22D3EE',
    title: 'Mastery Tracking',
    description:
      'Coach computes a 0–100 mastery score for every topic, updated after each quiz. See exactly where you stand.',
  },
  {
    icon: BookMarked,
    color: '#C084FC',
    title: 'Curated Resources',
    description:
      'The Resource Agent surfaces high-quality articles, videos, and docs — filtered by topic, level, and your specific goal.',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}
const itemVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
}

export default function FeatureHighlights() {
  return (
    <section id="features" className="relative py-28 lg:py-36 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Section glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(129,140,248,0.05) 0%, transparent 55%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-16 lg:mb-20"
        >
          <span className="badge badge-primary mb-4">Capabilities</span>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-text-primary mb-4">
            Everything You Need to Master Any Skill
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto leading-relaxed">
            A complete learning system — not a chatbot — built to take you from beginner to expert.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {FEATURES.map((feat) => (
            <FeatureCard key={feat.title} feature={feat} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function FeatureCard({ feature }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className="group relative p-6 rounded-2xl border border-border bg-bg-card overflow-hidden cursor-default"
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${feature.color}0c 0%, transparent 55%)`,
        }}
      />

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-6 bottom-6 w-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: feature.color }}
      />

      {/* Icon */}
      <div
        className="w-11 h-11 rounded-xl mb-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
        style={{
          backgroundColor: feature.color + '16',
          border:          `1px solid ${feature.color}35`,
        }}
      >
        <feature.icon size={20} strokeWidth={1.8} style={{ color: feature.color }} />
      </div>

      <h3 className="text-base font-bold text-text-primary mb-2 tracking-tight">
        {feature.title}
      </h3>
      <p className="text-sm text-text-secondary leading-relaxed">
        {feature.description}
      </p>
    </motion.div>
  )
}
