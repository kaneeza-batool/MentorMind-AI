import { ArrowRight } from 'lucide-react'

export default function NextStepPrompt({ recommendation }) {
  return (
    <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-4 flex items-start gap-3">
      <div className="w-6 h-6 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <ArrowRight size={12} className="text-primary-300" aria-hidden="true" />
      </div>
      <div>
        <p className="text-2xs font-bold text-primary-300 uppercase tracking-widest mb-1.5">
          Next Step
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">{recommendation}</p>
      </div>
    </div>
  )
}
