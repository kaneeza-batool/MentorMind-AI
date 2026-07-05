import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Target, Clock, Calendar, CheckCircle2 } from 'lucide-react'
import useLearningStore from '@/store/learningStore'
import StepQuestion from '../StepQuestion'

const DEADLINES = [
  {
    value: '30',
    label: '30 Days',
    Icon: Zap,
    color: '#F87171',
    track: 'Intensive track',
    desc: 'High pace, laser focus. Push hard for a month.',
  },
  {
    value: '60',
    label: '60 Days',
    Icon: Target,
    color: '#818CF8',
    track: 'Balanced track',
    desc: 'Steady and sustainable. The most popular timeline.',
    recommended: true,
  },
  {
    value: '90',
    label: '90 Days',
    Icon: Clock,
    color: '#34D399',
    track: 'Relaxed track',
    desc: 'Deep mastery over time. Comprehensive coverage.',
  },
  {
    value: 'custom',
    label: 'Custom',
    Icon: Calendar,
    color: '#94A3B8',
    track: 'Your timeline',
    desc: 'Set your own deadline. Your rules, your pace.',
  },
]

export default function DeadlineStep() {
  const deadline       = useLearningStore((s) => s.deadline)
  const deadlineCustom = useLearningStore((s) => s.deadlineCustom)
  const setField       = useLearningStore((s) => s.setField)

  const select = (val) => setField('deadline', val)

  return (
    <div>
      <StepQuestion
        question="When do you want to achieve this?"
        subtitle="Your Strategist will calibrate the learning pace to fit your timeline."
        speed={18}
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.38 }}
        className="grid grid-cols-2 gap-4"
      >
        {DEADLINES.map((d, i) => {
          const selected = deadline === d.value
          return (
            <motion.button
              key={d.value}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 + i * 0.07, duration: 0.35 }}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => select(d.value)}
              className="relative text-left p-5 rounded-2xl border transition-all duration-250 overflow-hidden"
              style={{
                backgroundColor: selected ? `${d.color}10` : '#13141C',
                borderColor:     selected ? `${d.color}55` : '#1E2030',
                boxShadow:       selected ? `0 0 20px ${d.color}15` : undefined,
              }}
            >
              {/* Recommended label */}
              {d.recommended && !selected && (
                <span
                  className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{ backgroundColor: `${d.color}20`, color: d.color }}
                >
                  Popular
                </span>
              )}

              {/* Checkmark */}
              <motion.div
                className="absolute top-3.5 right-3.5"
                initial={false}
                animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <CheckCircle2 size={16} style={{ color: d.color }} />
              </motion.div>

              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{
                  backgroundColor: `${d.color}18`,
                  border:          `1px solid ${d.color}35`,
                }}
              >
                <d.Icon size={20} strokeWidth={1.8} style={{ color: d.color }} />
              </div>

              <p className="text-base font-bold text-text-primary mb-0.5 tracking-tight">
                {d.label}
              </p>
              <p
                className="text-[11px] font-semibold mb-2"
                style={{ color: d.color }}
              >
                {d.track}
              </p>
              <p className="text-xs text-text-muted leading-relaxed">
                {d.desc}
              </p>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Custom days input */}
      <AnimatePresence>
        {deadline === 'custom' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex items-center gap-3">
              <input
                autoFocus
                type="number"
                min={7}
                max={365}
                value={deadlineCustom}
                onChange={(e) => setField('deadlineCustom', e.target.value)}
                placeholder="e.g. 45"
                className="input max-w-[120px] text-center text-lg font-bold"
              />
              <span className="text-text-secondary text-sm">days from now</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
