import { motion } from 'framer-motion'
import { Eye, Code2, BookOpen, Layers, CheckCircle2 } from 'lucide-react'
import useLearningStore from '@/store/learningStore'
import StepQuestion from '../StepQuestion'

const STYLES = [
  {
    id: 'visual',
    label: 'Visual',
    Icon: Eye,
    color: '#818CF8',
    description: 'Diagrams, charts, step-by-step visual breakdowns, and annotated examples.',
    emoji: '👁️',
  },
  {
    id: 'hands-on',
    label: 'Hands-on',
    Icon: Code2,
    color: '#34D399',
    description: 'Build things, run experiments, write code, and learn through doing.',
    emoji: '⚒️',
  },
  {
    id: 'reading',
    label: 'Reading',
    Icon: BookOpen,
    color: '#22D3EE',
    description: 'Well-structured text, documentation, theory, and in-depth explanations.',
    emoji: '📖',
  },
  {
    id: 'mixed',
    label: 'Mixed',
    Icon: Layers,
    color: '#C084FC',
    description: 'A dynamic blend of all formats — keeps things fresh and engaging.',
    emoji: '✨',
    recommended: true,
  },
]

export default function LearningStyleStep({ onNext }) {
  const learningStyle = useLearningStore((s) => s.learningStyle)
  const setField      = useLearningStore((s) => s.setField)

  const handleSelect = (id) => {
    setField('learningStyle', id)
    setTimeout(onNext, 320)
  }

  return (
    <div>
      <StepQuestion
        question="How do you learn best?"
        subtitle="Your Mentor will tune lesson style, examples, and pacing to match how you absorb knowledge."
        speed={18}
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.38 }}
        className="grid grid-cols-2 gap-4"
      >
        {STYLES.map((style, i) => {
          const selected = learningStyle === style.id
          return (
            <motion.button
              key={style.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.07, duration: 0.35 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(style.id)}
              className="relative text-left p-5 rounded-2xl border transition-all duration-250 overflow-hidden group"
              style={{
                backgroundColor: selected ? `${style.color}12` : '#13141C',
                borderColor:     selected ? `${style.color}55` : '#1E2030',
                boxShadow:       selected ? `0 0 24px ${style.color}18` : undefined,
              }}
            >
              {/* Hover bg */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-250 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, ${style.color}08 0%, transparent 60%)`,
                }}
              />

              {/* Recommended */}
              {style.recommended && !selected && (
                <span
                  className="absolute top-2.5 right-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{ backgroundColor: `${style.color}20`, color: style.color }}
                >
                  Most popular
                </span>
              )}

              {/* Checkmark */}
              <motion.div
                className="absolute top-3.5 right-3.5"
                initial={false}
                animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <CheckCircle2 size={16} style={{ color: style.color }} />
              </motion.div>

              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                style={{
                  backgroundColor: `${style.color}18`,
                  border: `1px solid ${style.color}35`,
                }}
              >
                <style.Icon size={22} strokeWidth={1.8} style={{ color: style.color }} />
              </div>

              <h3 className="text-base font-bold text-text-primary mb-2 tracking-tight">
                {style.label}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {style.description}
              </p>
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
