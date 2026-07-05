import { motion } from 'framer-motion'
import useLearningStore from '@/store/learningStore'
import StepQuestion from '../StepQuestion'

const OPTIONS = [
  { minutes: 15,  label: '15 min',  tag: 'Quick sessions',    desc: 'Short bursts — perfect for busy schedules.' },
  { minutes: 30,  label: '30 min',  tag: 'Focused practice',  desc: 'The sweet spot for consistent daily progress.' },
  { minutes: 60,  label: '1 hour',  tag: 'Deep learning',     desc: 'Full lessons with time to absorb concepts.' },
  { minutes: 120, label: '2 hours', tag: 'Intensive study',   desc: 'Serious sessions for accelerated growth.' },
  { minutes: 240, label: '4+ hours', tag: 'Full immersion',   desc: 'Maximum throughput — learn at warp speed.' },
]

export default function TimeStep() {
  const dailyMinutes = useLearningStore((s) => s.dailyMinutes)
  const setField     = useLearningStore((s) => s.setField)

  const currentIndex = Math.max(0, OPTIONS.findIndex((o) => o.minutes === dailyMinutes))
  const current      = OPTIONS[currentIndex]
  const percent      = (currentIndex / (OPTIONS.length - 1)) * 100

  const handleSlider = (e) => {
    const idx = parseInt(e.target.value)
    setField('dailyMinutes', OPTIONS[idx].minutes)
  }

  return (
    <div>
      <StepQuestion
        question="How much time can you dedicate daily?"
        subtitle="Your Strategist will pace your curriculum around your real schedule."
        speed={20}
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.38 }}
        className="space-y-10"
      >
        {/* Big selected value display */}
        <div className="text-center">
          <motion.div
            key={current.minutes}
            initial={{ opacity: 0, scale: 0.88, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <span
              className="text-[72px] lg:text-[88px] font-black leading-none tracking-tighter"
              style={{
                backgroundImage: 'linear-gradient(135deg, #818CF8, #C084FC)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {current.label}
            </span>
          </motion.div>
          <motion.p
            key={current.minutes + '-desc'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            className="text-text-secondary text-base mt-2"
          >
            {current.desc}
          </motion.p>
        </div>

        {/* Slider */}
        <div className="px-1">
          <input
            type="range"
            min={0}
            max={OPTIONS.length - 1}
            step={1}
            value={currentIndex}
            onChange={handleSlider}
            className="time-slider w-full"
            style={{
              height: '4px',
              borderRadius: '2px',
              background: `linear-gradient(to right, #6366F1 0%, #818CF8 ${percent}%, #1E2030 ${percent}%, #1E2030 100%)`,
            }}
          />

          {/* Tick labels */}
          <div className="flex justify-between mt-3.5">
            {OPTIONS.map((opt, i) => (
              <button
                key={opt.minutes}
                onClick={() => setField('dailyMinutes', opt.minutes)}
                className={`text-[11px] font-semibold transition-colors duration-200 ${
                  i === currentIndex ? 'text-primary-400' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tag badge */}
        <div className="flex justify-center">
          <motion.span
            key={current.tag}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="badge badge-primary text-sm px-4 py-1.5"
          >
            {current.tag}
          </motion.span>
        </div>
      </motion.div>
    </div>
  )
}
