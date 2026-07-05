import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { AGENTS } from '@/data/agents'

const W  = 520
const H  = 460
const CX = 260
const CY = 220
const R  = 158

const NODES = AGENTS.map((agent, i) => {
  const angle = ((-90 + i * 60) * Math.PI) / 180
  return { ...agent, x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle) }
})

const floatVariants = (i) => ({
  animate: {
    y: [0, -7, 0],
    transition: { duration: 3.5 + i * 0.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.55 },
  },
})

export default function AgentOrbit() {
  return (
    <div className="relative select-none" style={{ width: W, height: H }}>

      {/* ── SVG: rings, lines, particles ─────────────────────── */}
      <svg
        width={W} height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <radialGradient id="mm-center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#6366F1" stopOpacity="0.28" />
            <stop offset="60%"  stopColor="#6366F1" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0"    />
          </radialGradient>
          <filter id="mm-blur-glow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient center glow */}
        <ellipse cx={CX} cy={CY} rx={145} ry={145} fill="url(#mm-center-glow)" />

        {/* Outer decorative ring */}
        <circle
          cx={CX} cy={CY} r={R + 32}
          fill="none"
          stroke="rgba(255,255,255,0.045)"
          strokeWidth={1}
          strokeDasharray="3 11"
        />
        {/* Inner orbit ring */}
        <circle
          cx={CX} cy={CY} r={R - 28}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={1}
          strokeDasharray="1 8"
        />

        {/* Connection lines + flowing particles */}
        {NODES.map((node, i) => {
          const pathD = `M ${CX} ${CY} L ${node.x} ${node.y}`
          const dotDur = `${1.9 + i * 0.32}s`
          const dotDelay = `${i * 0.55}s`
          return (
            <g key={node.id}>
              {/* Dashed line */}
              <line
                x1={CX} y1={CY} x2={node.x} y2={node.y}
                stroke={node.color}
                strokeOpacity={0.22}
                strokeWidth={1.2}
                strokeDasharray="3 7"
              />
              {/* Animated particle */}
              <circle r={2.8} fill={node.color} filter="url(#mm-blur-glow)">
                <animateMotion path={pathD} dur={dotDur} repeatCount="indefinite" begin={dotDelay} />
                <animate attributeName="opacity" values="0;1;1;0" dur={dotDur} repeatCount="indefinite" begin={dotDelay} />
              </circle>
            </g>
          )
        })}

        {/* Center pulse rings */}
        <circle cx={CX} cy={CY} r={52} fill="none" stroke="rgba(99,102,241,0.35)" strokeWidth={1.5}>
          <animate attributeName="r"       values="52;72;52" dur="3.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0;0.35" dur="3.2s" repeatCount="indefinite" />
        </circle>
        <circle cx={CX} cy={CY} r={52} fill="none" stroke="rgba(99,102,241,0.18)" strokeWidth={1}>
          <animate attributeName="r"       values="52;90;52" dur="3.2s" repeatCount="indefinite" begin="0.6s" />
          <animate attributeName="opacity" values="0.18;0;0.18" dur="3.2s" repeatCount="indefinite" begin="0.6s" />
        </circle>
      </svg>

      {/* ── Center "You" node ──────────────────────────────────── */}
      <motion.div
        className="absolute flex flex-col items-center gap-1.5"
        style={{ left: CX - 38, top: CY - 38 }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-[76px] h-[76px] rounded-full bg-gradient-to-br from-primary-600 to-primary-400 border-2 border-primary-300/40 shadow-glow-primary flex items-center justify-center">
          <User size={30} className="text-white" />
        </div>
        <span className="text-[11px] font-bold tracking-wide text-primary-300 uppercase">You</span>
      </motion.div>

      {/* ── Agent nodes ────────────────────────────────────────── */}
      {NODES.map((node, i) => (
        <motion.div
          key={node.id}
          className="absolute flex flex-col items-center gap-1.5"
          style={{ left: node.x - 30, top: node.y - 30 }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={['visible', 'float']}
          variants={{
            visible: {
              opacity: 1,
              scale: 1,
              transition: { delay: 0.6 + i * 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
            },
            float: floatVariants(i).animate,
          }}
        >
          {/* Icon bubble */}
          <div
            className="w-[60px] h-[60px] rounded-[18px] flex items-center justify-center border"
            style={{
              backgroundColor: node.color + '18',
              borderColor:     node.color + '45',
              boxShadow:       `0 0 20px ${node.color}22, 0 0 40px ${node.color}0a`,
            }}
          >
            <node.Icon size={24} style={{ color: node.color }} strokeWidth={1.8} />
          </div>
          {/* Label */}
          <span
            className="text-[10px] font-semibold whitespace-nowrap tracking-wide"
            style={{ color: node.color + 'cc' }}
          >
            {node.name}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
