import { motion } from 'framer-motion'
import { Trophy, XCircle, CheckCircle2 } from 'lucide-react'

const PASS_THRESHOLD = 70

export default function ResultBanner({ correct, total, score, passed }) {
  const pct = Math.round(score)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      className={[
        'rounded-2xl border p-7 text-center mb-2',
        passed ? 'bg-mentor/8 border-mentor/25' : 'bg-coach/8 border-coach/25',
      ].join(' ')}
    >
      {passed
        ? <Trophy size={34} className="text-examiner mx-auto mb-3" aria-hidden="true" />
        : <XCircle size={34} className="text-coach   mx-auto mb-3" aria-hidden="true" />
      }

      {/* Score */}
      <div className="text-4xl font-bold text-text-primary tabular-nums mb-0.5">
        {correct}
        <span className="text-2xl font-normal text-text-muted"> / {total}</span>
      </div>
      <div className={`text-2xl font-bold mb-4 tabular-nums ${passed ? 'text-mentor' : 'text-coach'}`}>
        {pct}%
      </div>

      {/* Pass/fail message */}
      {passed ? (
        <div className="flex items-center justify-center gap-2">
          <CheckCircle2 size={15} className="text-mentor" aria-hidden="true" />
          <span className="text-sm font-semibold text-mentor">Ready for the next topic!</span>
        </div>
      ) : (
        <div>
          <p className="text-sm text-text-secondary">
            {pct}% — you need {PASS_THRESHOLD}% to pass
          </p>
          <p className="text-xs text-text-muted mt-1">Review the lesson and give it another try</p>
        </div>
      )}
    </motion.div>
  )
}
