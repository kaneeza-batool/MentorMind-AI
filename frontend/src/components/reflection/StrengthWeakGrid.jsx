import { CheckCircle2, AlertCircle, ThumbsUp, AlertTriangle } from 'lucide-react'

export default function StrengthWeakGrid({ strengths = [], weaknesses = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {/* Strengths */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ThumbsUp size={13} className="text-mentor" aria-hidden="true" />
          <span className="text-2xs font-bold text-mentor uppercase tracking-widest">Strengths</span>
        </div>
        <ul className="space-y-2">
          {strengths.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-mentor mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span className="text-xs text-text-secondary leading-relaxed">{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Weaknesses */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={13} className="text-coach" aria-hidden="true" />
          <span className="text-2xs font-bold text-coach uppercase tracking-widest">Areas to Improve</span>
        </div>
        {weaknesses.length > 0 ? (
          <ul className="space-y-2">
            {weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertCircle size={13} className="text-coach mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span className="text-xs text-text-secondary leading-relaxed">{w}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-text-muted italic">No significant gaps detected — solid work!</p>
        )}
      </div>
    </div>
  )
}
