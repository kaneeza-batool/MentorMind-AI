import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react'

/**
 * A collapsible review item showing one question's result and explanation.
 * Used after quiz submission in the review-answers section.
 */
export default function ExplanationDrawer({
  questionNumber,
  question,
  options,
  selectedIndex,
  correctIndex,
  correct,
  explanation,
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={[
      'rounded-xl border overflow-hidden',
      correct ? 'border-mentor/30' : 'border-coach/30',
    ].join(' ')}>

      {/* Toggle header */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 text-left
                   hover:bg-bg-elevated transition-colors duration-150
                   focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-strong
                   focus-visible:outline-none"
      >
        {correct
          ? <CheckCircle2 size={15} className="text-mentor flex-shrink-0" aria-hidden="true" />
          : <XCircle     size={15} className="text-coach  flex-shrink-0" aria-hidden="true" />
        }
        <span className="text-2xs text-text-muted flex-shrink-0 font-mono">Q{questionNumber}</span>
        <span className="text-sm text-text-secondary truncate flex-1">{question}</span>
        {open
          ? <ChevronDown  size={13} className="text-text-muted flex-shrink-0" />
          : <ChevronRight size={13} className="text-text-muted flex-shrink-0" />
        }
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-2.5">
              {/* User's answer */}
              <div className={[
                'flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs',
                correct ? 'bg-mentor/10 text-mentor' : 'bg-coach/10 text-coach',
              ].join(' ')}>
                {correct
                  ? <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                  : <XCircle     size={13} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                }
                <span>
                  Your answer:{' '}
                  <strong>{options[selectedIndex]}</strong>
                  {correct ? ' — correct' : ' — incorrect'}
                </span>
              </div>

              {/* Correct answer hint (only shown when wrong) */}
              {!correct && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-mentor/10 text-mentor text-xs">
                  <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Correct answer: <strong>{options[correctIndex]}</strong>
                  </span>
                </div>
              )}

              {/* AI explanation */}
              <p className="text-xs text-text-secondary leading-relaxed pl-1">{explanation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
