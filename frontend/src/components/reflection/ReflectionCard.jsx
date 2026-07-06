import { Sparkles } from 'lucide-react'

export default function ReflectionCard({ summary }) {
  return (
    <div className="rounded-2xl bg-reflection/5 border border-reflection/20 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={13} className="text-reflection flex-shrink-0" aria-hidden="true" />
        <span className="text-2xs font-bold text-reflection uppercase tracking-widest">
          AI Reflection
        </span>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{summary}</p>
    </div>
  )
}
