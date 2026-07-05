import { motion } from 'framer-motion'
import { Sprout, Zap, Trophy, CheckCircle2 } from 'lucide-react'
import useLearningStore from '@/store/learningStore'
import StepQuestion from '../StepQuestion'

const LEVELS = [
  {
    id: 'beginner',
    label: 'Beginner',
    Icon: Sprout,
    color: '#34D399',
    description: "I'm just getting started or exploring this topic for the first time.",
    detail: 'Start from first principles',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    Icon: Zap,
    color: '#818CF8',
    description: "I've built things before and want to go deeper into the subject.",
    detail: 'Skip basics, go deeper',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    Icon: Trophy,
    color: '#FBBF24',
    description: "I'm experienced and targeting true mastery and production expertise.",
    detail: 'Push for expertise',
  },
]

export default function SkillLevelStep({ onNext }) {
  const level    = useLearningStore((s) => s.level)
  const setField = useLearningStore((s) => s.setField)

  const handleSelect = (id) => {
    setField('level', id)
    setTimeout(onNext, 320)
  }

  return (
    <div>
      <StepQuestion
        question="How would you describe your current level?"
        subtitle="Be honest — your mentor team calibrates everything to exactly where you are."
        speed={18}
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {LEVELS.map((lvl, i) => {
          const selected = level === lvl.id
          return (
            <motion.button
              key={lvl.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.08, duration: 0.38 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(lvl.id)}
              className="relative text-left p-5 rounded-2xl border transition-all duration-250 overflow-hidden group"
              style={{
                backgroundColor: selected ? `${lvl.color}12` : undefined,
                borderColor:     selected ? `${lvl.color}55` : undefined,
                boxShadow:       selected ? `0 0 22px ${lvl.color}18` : undefined,
              }}
              data-selected={selected}
            >
              {/* Unselected bg */}
              {!selected && (
                <div className="absolute inset-0 bg-bg-card border border-border rounded-2xl -z-10 group-hover:border-border-strong transition-colors" />
              )}

              {/* Checkmark */}
              <motion.div
                className="absolute top-3.5 right-3.5"
                initial={false}
                animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <CheckCircle2 size={18} style={{ color: lvl.color }} />
              </motion.div>

              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                style={{
                  backgroundColor: `${lvl.color}18`,
                  border:          `1px solid ${lvl.color}35`,
                }}
              >
                <lvl.Icon size={22} style={{ color: lvl.color }} strokeWidth={1.8} />
              </div>

              <h3 className="text-base font-bold text-text-primary mb-1.5 tracking-tight">
                {lvl.label}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-3">
                {lvl.description}
              </p>
              <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
                style={{
                  color:           lvl.color,
                  backgroundColor: `${lvl.color}12`,
                  borderColor:     `${lvl.color}30`,
                }}
              >
                {lvl.detail}
              </span>
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
