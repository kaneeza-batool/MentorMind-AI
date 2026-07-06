import { CheckCircle2, XCircle } from 'lucide-react'

const LETTERS = ['A', 'B', 'C', 'D']

/**
 * A single answer option card.
 *
 * state:
 *   'idle'               — neutral (taking phase)
 *   'correct'            — this option is correct AND was selected
 *   'incorrect'          — this option is incorrect AND was selected
 *   'correct-unselected' — this option is correct but the user chose something else (review hint)
 */
export default function AnswerOption({
  text,
  index,
  isSelected,
  state = 'idle',
  onClick,
  disabled = false,
}) {
  const containerClass = (() => {
    if (state === 'correct')             return 'border-mentor   bg-mentor/10'
    if (state === 'incorrect')           return 'border-coach    bg-coach/10'
    if (state === 'correct-unselected')  return 'border-mentor/40 bg-transparent'
    if (isSelected)                      return 'border-examiner  bg-examiner/10'
    return 'border-border bg-bg-card hover:border-examiner/40 hover:bg-examiner/5'
  })()

  const badgeClass = (() => {
    if (state === 'correct')             return 'bg-mentor/20    text-mentor'
    if (state === 'incorrect')           return 'bg-coach/20     text-coach'
    if (state === 'correct-unselected')  return 'bg-mentor/10    text-mentor'
    if (isSelected)                      return 'bg-examiner/20  text-examiner'
    return 'bg-bg-elevated text-text-muted'
  })()

  const textClass = (() => {
    if (state === 'correct')             return 'text-text-primary'
    if (state === 'incorrect')           return 'text-text-primary'
    if (state === 'correct-unselected')  return 'text-text-secondary'
    if (isSelected)                      return 'text-text-primary'
    return 'text-text-secondary'
  })()

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      role="radio"
      aria-checked={isSelected}
      className={[
        'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border',
        'text-left transition-all duration-200 select-none',
        'focus-visible:ring-2 focus-visible:ring-examiner/50 focus-visible:outline-none',
        'disabled:cursor-default',
        containerClass,
      ].join(' ')}
    >
      {/* Letter badge */}
      <span className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-2xs font-bold ${badgeClass}`}>
        {LETTERS[index]}
      </span>

      {/* Option text */}
      <span className={`flex-1 text-sm leading-snug ${textClass}`}>{text}</span>

      {/* Status icon */}
      {state === 'correct' && (
        <CheckCircle2 size={15} className="text-mentor ml-auto flex-shrink-0" aria-hidden="true" />
      )}
      {state === 'incorrect' && (
        <XCircle size={15} className="text-coach ml-auto flex-shrink-0" aria-hidden="true" />
      )}
    </button>
  )
}
