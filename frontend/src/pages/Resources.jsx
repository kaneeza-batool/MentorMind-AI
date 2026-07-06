import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Library, BookOpen, RefreshCw } from 'lucide-react'
import useLearningStore from '@/store/learningStore'
import useResources from '@/hooks/useResources'
import ResourceFeed from '@/components/resources/ResourceFeed'

// ── Topic selector ────────────────────────────────────────────────────────────

function TopicSelector({ curriculum, selectedId, onSelect }) {
  return (
    <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Select topic">
      {curriculum.map((topic) => (
        <button
          key={topic.id}
          role="tab"
          aria-selected={topic.id === selectedId}
          onClick={() => onSelect(topic.id)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200
            ${topic.id === selectedId
              ? 'bg-resource/12 text-resource border-resource/30'
              : 'bg-transparent text-text-muted border-border hover:border-border-strong hover:text-text-secondary'
            }
            ${topic.status === 'locked' ? 'opacity-40 cursor-not-allowed' : ''}
          `}
          disabled={topic.status === 'locked'}
        >
          {topic.title}
        </button>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Resources() {
  const navigate = useNavigate()

  const sessionId         = useLearningStore((s) => s.sessionId)
  const curriculum        = useLearningStore((s) => s.curriculum)
  const currentTopicIndex = useLearningStore((s) => s.currentTopicIndex)
  const storedResources   = useLearningStore((s) => s.resources)

  const { fetchResources, loading, error } = useResources()

  // Default to current topic, allow switching to any unlocked topic
  const [selectedId, setSelectedId] = useState(
    () => curriculum[currentTopicIndex]?.id ?? curriculum[0]?.id ?? null
  )

  // Redirect to /learn if no session
  useEffect(() => {
    if (!sessionId) navigate('/learn', { replace: true })
  }, [sessionId, navigate])

  // Fetch whenever selected topic changes
  useEffect(() => {
    if (selectedId) fetchResources(selectedId)
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedTopic = curriculum.find((t) => t.id === selectedId)
  const resources     = storedResources[selectedId] ?? []

  const handleRetry = () => {
    if (selectedId) fetchResources(selectedId, { force: true })
  }

  if (!sessionId) return null

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-3 mb-7"
        >
          <div
            className="w-9 h-9 rounded-xl bg-resource/10 border border-resource/20
                        flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <Library size={16} className="text-resource" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs font-bold text-resource uppercase tracking-widest">
              Resource Intelligence
            </p>
            <p className="text-sm font-semibold text-text-primary truncate">
              {selectedTopic?.title ?? 'Loading…'}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              AI-curated resources matched to your level and weak areas
            </p>
          </div>
        </motion.div>

        {/* Topic selector */}
        {curriculum.length > 1 && (
          <div className="mb-6">
            <p className="text-2xs font-semibold text-text-muted uppercase tracking-widest mb-2">
              Topic
            </p>
            <TopicSelector
              curriculum={curriculum}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        )}

        {/* Empty state — no session/topic */}
        {!selectedId && (
          <div className="text-center py-12">
            <BookOpen size={32} className="text-text-muted mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm font-semibold text-text-primary mb-1">Start a lesson first</p>
            <p className="text-xs text-text-muted mb-5">
              Complete a lesson to unlock personalized resources
            </p>
            <button onClick={() => navigate('/learn')} className="btn-primary btn-sm">
              Go to Learn
            </button>
          </div>
        )}

        {/* Resource feed */}
        {selectedId && (
          <motion.div
            key={selectedId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ResourceFeed
              resources={resources}
              loading={loading}
              error={error}
              onRetry={handleRetry}
            />
          </motion.div>
        )}

      </div>
    </div>
  )
}
