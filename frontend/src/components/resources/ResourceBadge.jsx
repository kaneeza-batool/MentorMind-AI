const TYPE_CONFIG = {
  video:   { label: 'Video',   cls: 'bg-examiner/10 text-examiner border-examiner/20' },
  article: { label: 'Article', cls: 'bg-primary/10 text-primary-300 border-primary/20' },
  docs:    { label: 'Docs',    cls: 'bg-mentor/10 text-mentor border-mentor/20' },
  course:  { label: 'Course',  cls: 'bg-resource/10 text-resource border-resource/20' },
  repo:    { label: 'Project', cls: 'bg-reflection/10 text-reflection border-reflection/20' },
}

const DIFF_CONFIG = {
  beginner:     { label: 'Beginner',     cls: 'bg-mentor/10 text-mentor border-mentor/20' },
  intermediate: { label: 'Intermediate', cls: 'bg-examiner/10 text-examiner border-examiner/20' },
  advanced:     { label: 'Advanced',     cls: 'bg-coach/10 text-coach border-coach/20' },
}

export function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.article
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-2xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

export function DifficultyBadge({ difficulty }) {
  if (!difficulty) return null
  const cfg = DIFF_CONFIG[difficulty] ?? DIFF_CONFIG.intermediate
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-2xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

export default TypeBadge
