import AnswerOption from './AnswerOption'

/**
 * Renders a single quiz question with four answer options.
 * Used exclusively during the taking phase — no answer state is shown here.
 */
export default function QuizCard({ question, selectedIndex, onSelect, disabled = false }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-card">
      <p className="text-base font-semibold text-text-primary leading-relaxed mb-5">
        {question.question}
      </p>

      <div className="space-y-2.5" role="radiogroup" aria-label="Answer options">
        {question.options.map((option, idx) => (
          <AnswerOption
            key={idx}
            text={option}
            index={idx}
            isSelected={selectedIndex === idx}
            state="idle"
            onClick={() => onSelect(idx)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}
