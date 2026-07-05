import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { AGENTS } from '@/data/agents'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
}
const cardVariants = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } },
}

export default function AgentShowcase() {
  return (
    <section id="agents" className="relative py-28 lg:py-36 overflow-hidden">
      {/* Subtle section divider glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-16 lg:mb-20"
        >
          <span className="badge badge-primary mb-4">Your AI Team</span>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-text-primary mb-4">
            Meet Your AI Mentor Team
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            Six specialized agents, each an expert in their domain — working together to deliver
            a learning experience that adapts to you.
          </p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {AGENTS.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function AgentCard({ agent }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-bg-card group cursor-default"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1.5px]"
        style={{
          background: `linear-gradient(to right, transparent 0%, ${agent.color}90 40%, ${agent.color}90 60%, transparent 100%)`,
        }}
      />

      {/* Hover inner glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${agent.color}0e 0%, transparent 60%)` }}
      />

      <div className="p-6">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl mb-5 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
          style={{
            background:  `${agent.color}16`,
            border:      `1px solid ${agent.color}38`,
            boxShadow:   `0 0 0 0 ${agent.color}40`,
          }}
        >
          <agent.Icon size={22} strokeWidth={1.8} style={{ color: agent.color }} />
        </div>

        {/* Name + role */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-text-primary mb-1.5 tracking-tight">
            {agent.name}
          </h3>
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border"
            style={{
              color:           agent.color,
              backgroundColor: agent.color + '12',
              borderColor:     agent.color + '30',
            }}
          >
            {agent.role}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary leading-relaxed mb-5">
          {agent.description}
        </p>

        {/* Powers list */}
        <ul className="space-y-2">
          {agent.powers.map((power, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-text-muted">
              <CheckCircle2
                size={13}
                strokeWidth={2.5}
                className="mt-0.5 flex-shrink-0"
                style={{ color: agent.color }}
              />
              <span>{power}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}
